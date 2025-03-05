import { cachedir } from '../src/cache-directory.js';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

// Mock the modules
jest.mock('os');
jest.mock('path');

describe('cachedir', () => {
	// Setup mocks
	beforeEach(() => {
		jest.resetAllMocks();
		jest.spyOn(os, 'homedir').mockReturnValue('/mock/home');
		jest.spyOn(os, 'platform').mockReturnValue('darwin'); // Default to macOS
		jest.spyOn(path, 'join').mockImplementation((...args: any[]) => args.join('/'));
	});

	it('should throw error for non-string input', () => {
		// @ts-ignore - Testing invalid input
		expect(() => cachedir(123)).toThrow('id is not a string');
	});

	it('should throw error for empty string', () => {
		expect(() => cachedir('')).toThrow('id cannot be empty');
	});

	it('should throw error for strings with special characters', () => {
		expect(() => cachedir('app/name')).toThrow('id cannot contain special characters');
		expect(() => cachedir('app\\name')).toThrow('id cannot contain special characters');
		expect(() => cachedir('app:name')).toThrow('id cannot contain special characters');
		expect(() => cachedir('app*name')).toThrow('id cannot contain special characters');
		expect(() => cachedir('app?name')).toThrow('id cannot contain special characters');
		expect(() => cachedir('app"name')).toThrow('id cannot contain special characters');
		expect(() => cachedir('app<name')).toThrow('id cannot contain special characters');
		expect(() => cachedir('app>name')).toThrow('id cannot contain special characters');
		expect(() => cachedir('app|name')).toThrow('id cannot contain special characters');
	});

	it('should use darwin implementation for macOS', async () => {
		// Force the implementation to be reselected
		jest.isolateModules(async () => {
			// Reset the module cache
			jest.resetModules();
			
			// Mock platform before importing
			jest.spyOn(os, 'platform').mockReturnValue('darwin');
			
			// Re-import the module to get a fresh implementation
			const module = await import('../src/cache-directory.js');
			const freshCachedir = module.cachedir;
			
			const result = freshCachedir('testapp');
			expect(result).toBe('/mock/home/Library/Caches/testapp');
		});
	});

	it('should use win32 implementation for Windows', async () => {
		// Force the implementation to be reselected
		jest.isolateModules(async () => {
			// Reset the module cache
			jest.resetModules();
			
			// Mock platform before importing
			jest.spyOn(os, 'platform').mockReturnValue('win32');
			process.env.LOCALAPPDATA = '/mock/localappdata';
			
			// Re-import the module to get a fresh implementation
			const module = await import('../src/cache-directory.js');
			const freshCachedir = module.cachedir;
			
			const result = freshCachedir('testapp');
			expect(result).toBe('/mock/localappdata/testapp/Cache');
			
			// Clean up
			delete process.env.LOCALAPPDATA;
		});
	});

	it('should use win32 implementation with homedir when LOCALAPPDATA not set', async () => {
		// Force the implementation to be reselected
		jest.isolateModules(async () => {
			// Reset the module cache
			jest.resetModules();
			
			// Save original env
			const originalEnv = process.env;
			
			// Mock platform before importing
			jest.spyOn(os, 'platform').mockReturnValue('win32');
			
			// Create a new env without LOCALAPPDATA
			process.env = { ...originalEnv };
			delete process.env.LOCALAPPDATA;
			
			// Re-import the module to get a fresh implementation
			const module = await import('../src/cache-directory.js');
			const freshCachedir = module.cachedir;
			
			const result = freshCachedir('testapp');
			expect(result).toBe('/mock/home/AppData/Local/testapp/Cache');
			
			// Restore original env
			process.env = originalEnv;
		});
	});

	it('should use posix implementation for Linux', async () => {
		// Force the implementation to be reselected
		jest.isolateModules(async () => {
			// Reset the module cache
			jest.resetModules();
			
			// Mock platform before importing
			jest.spyOn(os, 'platform').mockReturnValue('linux');
			
			// Re-import the module to get a fresh implementation
			const module = await import('../src/cache-directory.js');
			const freshCachedir = module.cachedir;
			
			const result = freshCachedir('testapp');
			expect(result).toBe('/mock/home/.cache/testapp');
		});
	});

	it('should use XDG_CACHE_HOME if set on Linux', async () => {
		// Force the implementation to be reselected
		jest.isolateModules(async () => {
			// Reset the module cache
			jest.resetModules();
			
			// Save original env
			const originalEnv = process.env;
			
			// Mock platform before importing
			jest.spyOn(os, 'platform').mockReturnValue('linux');
			
			// Set XDG_CACHE_HOME
			process.env = { ...originalEnv, XDG_CACHE_HOME: '/mock/xdg/cache' };
			
			// Re-import the module to get a fresh implementation
			const module = await import('../src/cache-directory.js');
			const freshCachedir = module.cachedir;
			
			const result = freshCachedir('testapp');
			expect(result).toBe('/mock/xdg/cache/testapp');
			
			// Restore original env
			process.env = originalEnv;
		});
	});

	it('should use posix implementation for other platforms and log a warning', async () => {
		// Force the implementation to be reselected
		jest.isolateModules(async () => {
			// Reset the module cache
			jest.resetModules();
			
			// Mock platform before importing
			jest.spyOn(os, 'platform').mockReturnValue('some-unknown-platform' as any);
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
			
			// Re-import the module to get a fresh implementation
			const module = await import('../src/cache-directory.js');
			const freshCachedir = module.cachedir;
			
			const result = freshCachedir('testapp');
			expect(result).toBe('/mock/home/.cache/testapp');
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('[cachedir] Warning: the platform')
			);
			
			consoleSpy.mockRestore();
		});
	});
}); 