import HaveIBeenPwned from '../src/index.js';
import fetchMock from 'jest-fetch-mock';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Passwords', () => {
	const apiKey = '58b1febd04414585afdd514b74f4499f';

	// Mock password range hash response - format is important!
	// Hash suffix is after the prefix (we search for A1B2C, so anything after that)
	const mockHashRanges = 
`D4567:5
34567:2
FEABC:1`;

	beforeEach(() => {
		fetchMock.resetMocks();
		
		// Mock the latestbreach API call that happens automatically at initialization
		// with an empty JSON object to prevent parse errors
		fetchMock.mockResponseOnce('{}');
	});

	describe('range', () => {
		it('should check if a password hash appears in breaches', async () => {
			// Setup mock for the password range API call
			fetchMock.mockResponseOnce(mockHashRanges);

			const hibp = new HaveIBeenPwned(apiKey, {
				cache: {
					enabled: false // Disable caching for tests
				}
			});

			// We're searching for hash A1B2C34567
			// The API will request prefix A1B2C
			// And look for suffix 34567 in the response, which has a count of 2
			const result = await hibp.passwords.range('A1B2C34567');

			// Check that fetchMock was called correctly
			expect(fetchMock.mock.calls.length).toBe(2);
			expect(fetchMock.mock.calls[1][0]).toBe('https://api.pwnedpasswords.com/range/A1B2C');
			
			// Check the result value
			expect(result).toBe(2); // Found with count 2
		});

		it('should add padding when requested', async () => {
			// Setup mock for the password range API call
			fetchMock.mockResponseOnce(mockHashRanges);

			const hibp = new HaveIBeenPwned(apiKey, {
				cache: {
					enabled: false // Disable caching for tests
				}
			});

			await hibp.passwords.range('A1B2C01234', { addPadding: true });

			// Verify the second call had the Add-Padding header
			expect(fetchMock.mock.calls.length).toBe(2);
			expect(fetchMock.mock.calls[1][0]).toBe('https://api.pwnedpasswords.com/range/A1B2C');
			
			// Get the request options from the second call
			const requestOptions = fetchMock.mock.calls[1][1] || {};
			
			// Check if the Add-Padding header is present
			// Use any to avoid TypeScript errors with symbol properties
			const headers = requestOptions.headers as any;
			if (headers) {
				// Check for the Add-Padding header value
				if (headers instanceof Headers) {
					expect(headers.get('Add-Padding')).toBe('true');
				} else if (typeof headers === 'object') {
					// Handle the Symbol(map) structure we saw in the test output
					const headerMap = headers[Object.getOwnPropertySymbols(headers)[0]];
					if (headerMap && headerMap['Add-Padding']) {
						expect(headerMap['Add-Padding'][0]).toBe('true');
					} else {
						fail('Add-Padding header not found');
					}
				}
			} else {
				fail('Headers not found in request options');
			}
		});

		it('should not find a password hash in breaches', async () => {
			// Setup mock for the password range API call
			fetchMock.mockResponseOnce(mockHashRanges);

			const hibp = new HaveIBeenPwned(apiKey, {
				cache: {
					enabled: false // Disable caching for tests
				}
			});

			// This hash suffix (NOTFOUND) is not in our mock data, so it should return 0
			const result = await hibp.passwords.range('A1B2CNOTFOUND');
			expect(result).toBe(0); // Not found
		});
	});

	describe('check', () => {
		it('should check a plaintext password', async () => {
			// Setup mock for the password range API call - should match what sha1('password123') will request
			fetchMock.mockResponseOnce(mockHashRanges);

			const hibp = new HaveIBeenPwned(apiKey, {
				cache: {
					enabled: false // Disable caching for tests
				}
			});

			// Mock the actual hash generation to return a predictable value
			// that matches one of our mock entries - prefix A1B2C, suffix 34567
			const originalSha1 = hibp.passwords['sha1'];
			hibp.passwords['sha1'] = async () => 'A1B2C34567';
			
			const result = await hibp.passwords.check('password123');
			
			// Restore the original method
			hibp.passwords['sha1'] = originalSha1;

			// Verify the API call - don't need to check exact URL since we mocked the hash
			expect(fetchMock.mock.calls.length).toBe(2);
			
			// Check result matches our mock data (count=2 for 34567 suffix)
			expect(result).toBe(2);
		});

		it('should throw an error for NTLM mode which is not implemented', async () => {
			const hibp = new HaveIBeenPwned(apiKey, {
				cache: {
					enabled: false // Disable caching for tests
				}
			});

			await expect(
				// @ts-ignore - Testing invalid parameter
				hibp.passwords.check('password123', { mode: 'ntlm' })
			).rejects.toThrow(/NTLM (hash generation|mode) is not (implemented|supported)/);
		});
	});
}); 