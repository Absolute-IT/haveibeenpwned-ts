import { createHash } from 'crypto';
import { mkdir, readFile, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { cachedir } from './cache-directory.js';
import type { CacheConfig, CacheItem, CacheMetadata } from './types';

/**
 * Cache manager for API responses
 */
export class CacheManager {
	private cacheDir: string;
	private config: CacheConfig;
	private latestBreachDate: string | null = null;

	/**
	 * Create a new cache manager
	 * @param config - Cache configuration options
	 */
	constructor(config: CacheConfig) {
		this.config = config;
		this.cacheDir = config.directory ?? cachedir('haveibeenpwned-ts');
	}

	/**
	 * Create a hash of the given parameters for use as a cache key
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
	 * Get the full path to a cache file
	 * @param key - Cache key
	 * @returns Full path to cache file
	 */
	private getCacheFilePath(key: string): string {
		// Create a subdirectory structure to avoid too many files in one directory
		// Use the first 2 characters of the hash for the directory name
		const subDir = key.substring(0, 2);
		return join(this.cacheDir, subDir, `${key}.json`);
	}

	/**
	 * Get an item from the cache
	 * @param endpoint - API endpoint
	 * @param params - API parameters
	 * @returns Cached data or null if not found/expired
	 */
	async get<T>(endpoint: string, params?: Record<string, any>): Promise<T | null> {
		if (!this.config.enabled) {
			return null;
		}

		try {
			const key = this.createCacheKey(endpoint, params);
			const filePath = this.getCacheFilePath(key);
			
			const fileContent = await readFile(filePath, 'utf8');
			const cache = JSON.parse(fileContent) as CacheItem<T>;
			
			// Check if cache is fresh
			if (this.isCacheFresh(cache.metadata)) {
				return cache.data;
			}
			
			return null;
		} catch (error) {
			// File doesn't exist or other error
			return null;
		}
	}

	/**
	 * Check if a cached item is still fresh
	 * @param metadata - Cache metadata
	 * @returns Whether the cache is still fresh
	 */
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

	/**
	 * Set the latest breach date known by the system
	 * @param date - ISO date string of the latest breach
	 */
	setLatestBreachDate(date: string | null): void {
		this.latestBreachDate = date;
	}

	/**
	 * Store an item in the cache
	 * @param endpoint - API endpoint
	 * @param params - API parameters
	 * @param data - Data to cache
	 */
	async set<T>(endpoint: string, params: Record<string, any> | undefined, data: T): Promise<void> {
		if (!this.config.enabled) {
			return;
		}

		try {
			const key = this.createCacheKey(endpoint, params);
			const filePath = this.getCacheFilePath(key);
			
			// Create cache directories if they don't exist
			await mkdir(dirname(filePath), { recursive: true });
			
			const cacheItem: CacheItem<T> = {
				data,
				metadata: {
					timestamp: Date.now(),
					latestBreachAddedDate: this.latestBreachDate ?? undefined
				}
			};
			
			await writeFile(filePath, JSON.stringify(cacheItem), 'utf8');
		} catch (error) {
			// Log the error but don't throw - caching failures shouldn't break the app
			console.error('Error writing to cache:', error);
		}
	}

	/**
	 * Clear all cached data
	 */
	async clearCache(): Promise<void> {
		// This is a placeholder - a full implementation would delete 
		// all files in the cache directory, but that's more complex
		// than needed for this example.
		console.log(`To clear the cache, delete the directory: ${this.cacheDir}`);
	}
} 