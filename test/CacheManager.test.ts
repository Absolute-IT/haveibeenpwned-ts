import { CacheManager } from '../src/cache.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { config } from 'dotenv';
import { jest } from '@jest/globals';

// Load environment variables
config();

jest.mock('fs/promises');
jest.mock('path');
jest.mock('os');

describe('CacheManager', () => {
	// Setup mocks
	beforeEach(() => {
		jest.resetAllMocks();
		// Mock the directory methods
		jest.spyOn(os, 'homedir').mockReturnValue('/mock/home');
		jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
		jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
		jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'));
		jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
	});

	describe('constructor', () => {
		it('should create an instance with default options', () => {
			const cacheManager = new CacheManager({ enabled: true });
			expect(cacheManager).toBeDefined();
		});

		it('should create an instance with custom directory', () => {
			const cacheManager = new CacheManager({ enabled: true, directory: '/custom/dir' });
			expect(cacheManager).toBeDefined();
		});

		it('should create an instance with custom ttl', () => {
			const cacheManager = new CacheManager({ enabled: true, ttl: 3600 });
			expect(cacheManager).toBeDefined();
		});
	});

	describe('clearCache', () => {
		it('should log cache directory path', () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
			
			const cacheManager = new CacheManager({ enabled: true });
			cacheManager.clearCache();
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('To clear the cache, delete the directory:')
			);
			
			consoleSpy.mockRestore();
		});
	});
}); 