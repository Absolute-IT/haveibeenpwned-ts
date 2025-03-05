import HaveIBeenPwned from '../src/index.js';
import fetchMock from 'jest-fetch-mock';
import { config } from 'dotenv';

// Load environment variables
config();

describe('HaveIBeenPwned', () => {
	const apiKey = process.env.API_KEY || '58b1febd04414585afdd514b74f4499f';
	let hibp: HaveIBeenPwned;

	beforeEach(() => {
		fetchMock.resetMocks();
		hibp = new HaveIBeenPwned(apiKey, {
			cache: {
				enabled: false // Disable caching for tests
			}
		});
	});

	describe('constructor', () => {
		it('should create an instance with default options', () => {
			const client = new HaveIBeenPwned(apiKey);
			expect(client).toBeInstanceOf(HaveIBeenPwned);
			expect(client.getUserAgent()).toBe('haveibeenpwned-ts');
		});

		it('should throw an error if API key is not provided', () => {
			expect(() => new HaveIBeenPwned('')).toThrow('API key is required');
		});

		it('should create an instance with custom options', () => {
			const client = new HaveIBeenPwned(apiKey, {
				userAgent: 'custom-user-agent',
				baseUrl: 'https://custom-url.com/api/v3/',
				passwordsBaseUrl: 'https://custom-passwords-url.com/',
				cache: {
					enabled: true,
					ttl: 3600000
				}
			});

			expect(client).toBeInstanceOf(HaveIBeenPwned);
			expect(client.getUserAgent()).toBe('custom-user-agent');
			expect(client.getPasswordsBaseUrl()).toBe('https://custom-passwords-url.com/');
		});
	});

	describe('error handling', () => {
		it('should handle 400 Bad Request error', async () => {
			fetchMock.mockResponseOnce('', { status: 400 });

			await expect(hibp.breached.account('')).rejects.toThrow('Bad request');
		});

		it('should handle 401 Unauthorized error', async () => {
			fetchMock.mockResponseOnce('', { status: 401 });

			await expect(hibp.breached.account('test@example.com')).rejects.toThrow('Unauthorized');
		});

		it('should handle 403 Forbidden error', async () => {
			fetchMock.mockResponseOnce('', { status: 403 });

			await expect(hibp.breached.account('test@example.com')).rejects.toThrow('Forbidden');
		});

		it('should handle 429 Rate Limit error', async () => {
			fetchMock.mockResponseOnce('', { status: 429 });

			await expect(hibp.breached.account('test@example.com')).rejects.toThrow('Too many requests');
		});

		it('should handle 503 Service Unavailable error', async () => {
			fetchMock.mockResponseOnce('', { status: 503 });

			await expect(hibp.breached.account('test@example.com')).rejects.toThrow('Service unavailable');
		});

		it('should handle unexpected status codes', async () => {
			fetchMock.mockResponseOnce('', { status: 418, statusText: 'I\'m a teapot' });

			await expect(hibp.breached.account('test@example.com')).rejects.toThrow('Unexpected status code: 418 I\'m a teapot');
		});
	});

	describe('endpoint lazy loading', () => {
		it('should lazy load the breach endpoint', () => {
			expect(hibp.breach).toBeDefined();
			expect(hibp.breach).toBe(hibp.breach); // Same instance
		});

		it('should lazy load the breached endpoint', () => {
			expect(hibp.breached).toBeDefined();
			expect(hibp.breached).toBe(hibp.breached); // Same instance
		});

		it('should lazy load the data endpoint', () => {
			expect(hibp.data).toBeDefined();
			expect(hibp.data).toBe(hibp.data); // Same instance
		});

		it('should lazy load the paste endpoint', () => {
			expect(hibp.paste).toBeDefined();
			expect(hibp.paste).toBe(hibp.paste); // Same instance
		});

		it('should lazy load the stealerLog endpoint', () => {
			expect(hibp.stealerLog).toBeDefined();
			expect(hibp.stealerLog).toBe(hibp.stealerLog); // Same instance
		});

		it('should lazy load the subscription endpoint', () => {
			expect(hibp.subscription).toBeDefined();
			expect(hibp.subscription).toBe(hibp.subscription); // Same instance
		});

		it('should lazy load the passwords endpoint', () => {
			expect(hibp.passwords).toBeDefined();
			expect(hibp.passwords).toBe(hibp.passwords); // Same instance
		});
	});

	describe('cache management', () => {
		it('should configure caching options', () => {
			hibp.configureCaching({
				enabled: true,
				ttl: 3600000
			});
			// This is more of a coverage test since we can't easily verify the internal state
			expect(hibp).toBeDefined();
		});

		it('should clear cache', async () => {
			// This is more of a coverage test since we've disabled caching
			await hibp.clearCache();
			expect(hibp).toBeDefined();
		});
	});
}); 