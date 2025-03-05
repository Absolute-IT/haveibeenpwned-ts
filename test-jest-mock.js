// Test script for Jest fetch mock
// This needs to be run with Jest

import fetchMock from 'jest-fetch-mock';

describe('Jest fetch mock test', () => {
	beforeAll(() => {
		fetchMock.enableMocks();
	});
	
	beforeEach(() => {
		fetchMock.resetMocks();
	});
	
	it('should pass through to real fetch', async () => {
		// Configure fetch mock to pass through to real fetch
		fetchMock.mockImplementation(async (url, options) => {
			console.log('Mock fetch called with URL:', url);
			console.log('Mock fetch options:', options);
			
			// Use the real fetch
			const realFetch = globalThis.fetch;
			const response = await realFetch(url, options);
			
			// Log response details
			console.log('Real fetch response status:', response.status);
			console.log('Real fetch response headers:', Object.fromEntries(response.headers.entries()));
			
			// Clone the response to avoid consuming it
			const clonedResponse = response.clone();
			const text = await clonedResponse.text();
			console.log('Real fetch response text length:', text.length);
			console.log('Real fetch response text preview:', text ? text.substring(0, 100) + '...' : 'empty');
			
			// Return a new response with the same data
			return new Response(text, {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers
			});
		});
		
		// Make the request
		const apiKey = '58b1febd04414585afdd514b74f4499f';
		const response = await fetch('https://haveibeenpwned.com/api/v3/breach/Adobe', {
			headers: {
				'hibp-api-key': apiKey,
				'user-agent': 'haveibeenpwned-ts',
				'Accept': 'application/json'
			}
		});
		
		// Log and verify the response
		console.log('Test response status:', response.status);
		console.log('Test response headers:', Object.fromEntries(response.headers.entries()));
		
		const text = await response.text();
		console.log('Test response text length:', text.length);
		console.log('Test response text preview:', text ? text.substring(0, 100) + '...' : 'empty');
		
		expect(response.status).toBe(200);
		expect(text.length).toBeGreaterThan(0);
		
		if (text) {
			try {
				const json = JSON.parse(text);
				console.log('Parsed JSON:', json.Name);
				expect(json.Name).toBe('Adobe');
			} catch (e) {
				console.error('Error parsing JSON:', e);
				fail('Failed to parse JSON');
			}
		}
	});
}); 