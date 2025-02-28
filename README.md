# Have I Been Pwned API Client

A TypeScript client for the [Have I Been Pwned API](https://haveibeenpwned.com/API/v3). This client includes support for all API endpoints and features an intelligent caching system to optimize API usage.

## Features

- Full support for all HIBP API endpoints
- Smart caching system that respects the API recommendations
- Platform-specific cache directory handling
- Options to disable or customize caching
- Typed interfaces for all API responses
- No external dependencies

## Installation

```bash
npm install haveibeenpwned
```

## Usage

### Basic Usage

```typescript
import HaveIBeenPwned from 'haveibeenpwned';

// Create a client with default caching enabled
const hibp = new HaveIBeenPwned('your-api-key');

// Check if an account has been breached
const breaches = await hibp.breached.account('example@example.com');
console.log(breaches);

// Check if a password has been pwned
const pwnedCount = await hibp.passwords.check('password123');
console.log(`This password has been found in ${pwnedCount} breaches`);
```

### Caching

The client implements an intelligent caching system that follows the HIBP API recommendations:

> Typically, there is no need to query a domain unless a new breach has been added since the last query. Whilst there's no formal rate limit on the domain search API, reguarly querying it beyond what is practically necessary may result in an HTTP 429 response. To optimise your querying, you can aggressively query the unauthenticated most recent breach API (it's heavily cached at Cloudflare) and once a new breach is seen, query the domain search API for each of your domains.

When you check for breached domains, the client will:

1. Check the latest breach date (with automatic caching)
2. Only make a new API request if the latest breach date is more recent than the last check
3. Store the results in a local cache for future queries

### Configuring Caching

You can configure caching options when creating the client:

```typescript
const hibp = new HaveIBeenPwned('your-api-key', {
  cache: {
    enabled: true,  // Set to false to disable caching
    directory: '/custom/cache/path',  // Custom cache directory
    ttl: 3600000  // Cache time-to-live in milliseconds (1 hour)
  }
});
```

Or update the cache configuration later:

```typescript
// Disable caching
hibp.configureCaching({ enabled: false });

// Re-enable with custom options
hibp.configureCaching({
  enabled: true,
  directory: '/custom/cache/path'
});

// Clear the cache
await hibp.clearCache();
```

## Cache Directory

The client uses platform-specific directories to store cache files:

- **Linux/Unix**: `~/.cache/haveibeenpwned-ts/`
- **macOS**: `~/Library/Caches/haveibeenpwned-ts/`
- **Windows**: `%LOCALAPPDATA%\haveibeenpwned-ts\Cache\`

## API Endpoints

The client provides access to all HIBP API endpoints through a clean, intuitive interface:

- `hibp.breach.*` - Information about breaches
- `hibp.breached.*` - Check for breached accounts and domains
- `hibp.data.*` - Data classes
- `hibp.stealerLog.*` - Stealer logs
- `hibp.paste.*` - Paste services
- `hibp.subscription.*` - Subscription status
- `hibp.passwords.*` - Password checking

Please refer to the [HIBP API documentation](https://haveibeenpwned.com/API/v3) for more information on each endpoint.

## License

GPL-3.0-or-later 