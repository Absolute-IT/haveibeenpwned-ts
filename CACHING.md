# Caching Implementation for HIBP API Client

This document explains the technical implementation of the caching system for the Have I Been Pwned API client.

## Overview

The caching system is designed to:

1. Reduce API requests by storing responses locally
2. Follow HIBP API recommendations for optimizing domain queries
3. Support platform-specific cache directories
4. Be configurable (enable/disable, custom directory, TTL)
5. Work with zero dependencies

## Architecture

The caching system consists of three main components:

1. `cache-directory.ts`: Platform-specific cache directory resolution 
2. `cache.ts`: Core caching functionality (read/write/invalidate)
3. Integration in the main API client and endpoint classes

## Cache Directory Resolution

We use the provided cache directory resolution code (converted to ESM) to determine the appropriate cache directory based on the user's operating system. This follows the XDG specification on Linux, and uses appropriate directories on macOS and Windows.

```typescript
// Platform-specific directory paths
function posix(id: string): string {
    const cacheHome = process.env.XDG_CACHE_HOME || join(homedir(), '.cache');
    return join(cacheHome, id);
}

function darwin(id: string): string {
    return join(homedir(), 'Library', 'Caches', id);
}

function win32(id: string): string {
    const appData = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local');
    return join(appData, id, 'Cache');
}
```

## Cache Manager

The core of the caching system is the `CacheManager` class in `cache.ts`. It handles:

1. Generating unique cache keys for API requests
2. Reading/writing cache files
3. Checking if cache entries are still valid
4. Tracking the latest breach date

Key features:

### Cache Keys

We generate a SHA-256 hash of the endpoint path and parameters to create a unique cache key:

```typescript
private createCacheKey(endpoint: string, params?: Record<string, any>): string {
    const hash = createHash('sha256');
    hash.update(endpoint);
    
    if (params) {
        // Sort keys to ensure consistent hashing
        const sortedKeys = Object.keys(params).sort();
        for (const key of sortedKeys) {
            const value = params[key];
            if (value !== undefined) {
                hash.update(`${key}=${String(value)}`);
            }
        }
    }
    
    return hash.digest('hex');
}
```

### Cache Freshness

We determine if a cache entry is still valid based on:

1. Explicit TTL if provided
2. Latest breach date for breach-related data
3. Default 24-hour expiration if no other rules apply

```typescript
private isCacheFresh(metadata: CacheMetadata): boolean {
    // If we have a specific TTL, use that
    if (this.config.ttl) {
        const now = Date.now();
        const age = now - metadata.timestamp;
        return age < this.config.ttl;
    }
    
    // If we know the latest breach date, compare it with the metadata
    if (this.latestBreachDate && metadata.latestBreachAddedDate) {
        return metadata.latestBreachAddedDate >= this.latestBreachDate;
    }
    
    // Default: 24 hours cache time if no other rules apply
    const now = Date.now();
    const age = now - metadata.timestamp;
    return age < 24 * 60 * 60 * 1000; // 24 hours
}
```

## Integration with API Client

The main client class (`HaveIBeenPwned`) integrates caching through:

1. A cache configuration option in the constructor
2. A method to check the latest breach on initialization
3. A wrapper around the main request method that tries to read from cache first
4. A method to update the cache configuration

### Request with Caching

```typescript
async request(path: string, options: RequestOptions = {}): Promise<unknown> {
    // Try to get from cache first
    const cacheKey = path;
    const cachedData = await this.cacheManager.get(cacheKey, options.params);
    
    if (cachedData !== null) {
        return cachedData;
    }
    
    // If not in cache or expired, make the actual request
    const response = await this.requestNoCache(path, options);
    
    // Cache the response if it's not null
    if (response !== null) {
        await this.cacheManager.set(cacheKey, options.params, response);
    }
    
    return response;
}
```

## Optimized Domain Queries

For domain breach queries, we implement the recommendation from the HIBP API docs:

1. Check the latest breach date first (cached)
2. Only make a new domain query if there's a new breach
3. Store the results for future use

```typescript
async domain(domain: string, forceFresh = false): Promise<Map<string, string[]> | null> {
    if (!forceFresh) {
        // Get the latest breach to check if we need to refresh
        const latestBreach = await this.client.breach.latest();
        
        if (latestBreach?.AddedDate) {
            // If the latest breach date hasn't changed, use cached data
            if (this.lastKnownBreachDate && this.lastKnownBreachDate >= latestBreach.AddedDate) {
                console.log("Latest breach hasn't changed, using cached data if available");
                
                // This will use the cache if available
                const response = await this.client.request(...);
                return response;
            }
            
            // Update our latest known breach date
            this.lastKnownBreachDate = latestBreach.AddedDate;
        }
    }
    
    // Get fresh data and store in cache
    const response = await this.requestNoCache(...);
    await this.updateCache(...);
    
    return response;
}
```

## File Structure

The cache files are organized in a two-level directory structure:

1. The main cache directory (platform-specific)
2. Subdirectories named after the first two chars of the cache key
3. Cache files named after the full cache key with a `.json` extension

This prevents having too many files in a single directory, which can be problematic on some filesystems.

## Cache File Format

Each cache file contains:

1. The actual response data
2. Metadata including:
   - Timestamp when the cache was created
   - Latest breach date (if available) when the cache was created

```json
{
  "data": { /* API response data */ },
  "metadata": {
    "timestamp": 1677686400000,
    "latestBreachAddedDate": "2023-03-01T12:00:00Z"
  }
}
```

## Security Considerations

1. Cache files are stored in the user's personal cache directory, which generally has appropriate permissions
2. API keys are never stored in the cache files, only response data
3. Cache key generation uses SHA-256 hashing to anonymize the request parameters 