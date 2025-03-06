import { createHash } from 'crypto';
import { mkdir, readFile, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { cachedir } from './cache-directory.js';
import type { CacheConfig, CacheItem, CacheMetadata } from './types';

/**
 * Cache manager for API responses.
 * Handles storing and retrieving cached data on the filesystem.
 */
export class CacheManager {
	private cacheDir: string;
	private config: CacheConfig;
	private latestBreachDate: string | null = null;

	/**
	 * Create a new cache manager.
	 * 
	 * @param config - Cache configuration options
	 */
	constructor(config: CacheConfig) {
		this.config = config;
		this.cacheDir = config.directory ?? cachedir('haveibeenpwned-ts');
	}

	/**
	 * Create a hash of the given parameters for use as a cache key.
	 * 
	 * @param endpoint - API endpoint
	 * @param params - API parameters
	 * @returns Hashed cache key
	 */
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

	/**
	 * Get the file path for a cached item.
	 * 
	 * @param key - The cache key
	 * @returns The full path to the cache file
	 */
	private getCacheFilePath(key: string): string {
		return join(this.cacheDir, `${key}.json`);
	}

	/**
	 * Get a cached item if it exists and is still valid.
	 * 
	 * @param endpoint - The API endpoint
	 * @param params - The API parameters
	 * @returns The cached data, or null if not found or expired
	 */
	async get<T>(endpoint: string, params?: Record<string, any>): Promise<T | null> {
		// If caching is disabled, always return null
		if (!this.config.enabled) {
			return null;
		}
		
		try {
			const key = this.createCacheKey(endpoint, params);
			const filePath = this.getCacheFilePath(key);
			
			// Check if the file exists
			const fileStats = await stat(filePath);
			if (!fileStats.isFile()) {
				return null;
			}
			
			// Read and parse the cache file
			const fileContent = await readFile(filePath, 'utf8');
			const cacheItem = JSON.parse(fileContent) as CacheItem<T>;
			
			// Check if the cache is still fresh
			if (!this.isCacheFresh(cacheItem.metadata)) {
				return null;
			}
			
			return cacheItem.data;
		} catch (error) {
			// If any error occurs (file not found, invalid JSON, etc.), return null
			return null;
		}
	}

	/**
	 * Check if a cached item is still valid based on TTL or latest breach date.
	 * 
	 * @param metadata - The cache metadata
	 * @returns True if the cache is still valid, false otherwise
	 */
	private isCacheFresh(metadata: CacheMetadata): boolean {
		// Check TTL first if it's configured
		if (this.config.ttl) {
			const now = Date.now();
			const maxAge = this.config.ttl;
			const age = now - metadata.timestamp;
			
			if (age > maxAge) {
				return false;
			}
		}
		
		// Otherwise, check if there's a new breach since this was cached
		// This is the recommended caching strategy in the HIBP docs
		if (this.latestBreachDate && metadata.latestBreachAddedDate) {
			// If there's a newer breach than when this was cached, it's stale
			return this.latestBreachDate <= metadata.latestBreachAddedDate;
		}
		
		// If we don't have a latest breach date yet but this item has one, it's still valid
		// We haven't detected any newer breaches
		return true;
	}

	/**
	 * Set the latest breach date for cache invalidation.
	 * 
	 * @param date - The date of the latest breach, or null to clear
	 */
	setLatestBreachDate(date: string | null): void {
		this.latestBreachDate = date;
	}

	/**
	 * Store data in the cache.
	 * 
	 * @param endpoint - The API endpoint
	 * @param params - The API parameters
	 * @param data - The data to cache
	 */
	async set<T>(endpoint: string, params: Record<string, any> | undefined, data: T): Promise<void> {
		// If caching is disabled, do nothing
		if (!this.config.enabled) {
			return;
		}
		
		try {
			const key = this.createCacheKey(endpoint, params);
			const filePath = this.getCacheFilePath(key);
			
			// Create the directory if it doesn't exist
			const directory = dirname(filePath);
			await mkdir(directory, { recursive: true });
			
			// Create the cache item with metadata
			const cacheItem: CacheItem<T> = {
				data,
				metadata: {
					timestamp: Date.now(),
					latestBreachAddedDate: this.latestBreachDate ?? undefined
				}
			};
			
			// Write the cache file
			await writeFile(filePath, JSON.stringify(cacheItem), 'utf8');
		} catch (error) {
			// If any error occurs during caching, just ignore it
			// Failing to cache shouldn't affect the normal operation
		}
	}

	/**
	 * Clear all cached data.
	 */
	async clearCache(): Promise<void> {
		// Not implemented - would require reading directory and unlinking files
		// For now, users can just delete the cache directory manually
	}
} 