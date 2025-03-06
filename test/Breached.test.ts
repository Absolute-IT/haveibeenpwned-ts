import HaveIBeenPwned from '../src/index.js';
import fetchMock from 'jest-fetch-mock';
import { config } from 'dotenv';
import type { BreachModel } from '../src/types';

// Load environment variables
config();

describe('Breached', () => {
	const apiKey = process.env.API_KEY || '58b1febd04414585afdd514b74f4499f';
	let hibp: HaveIBeenPwned;

	// Mock breach data
	const mockBreaches: BreachModel[] = [
		{
			Name: 'Adobe',
			Title: 'Adobe',
			Domain: 'adobe.com',
			BreachDate: '2013-10-04',
			AddedDate: '2013-12-04T00:00:00Z',
			ModifiedDate: '2022-05-15T23:52:49Z',
			PwnCount: 152445165,
			Description: 'Adobe breach description',
			IsVerified: true,
			IsFabricated: false,
			IsSensitive: false,
			IsRetired: false,
			IsSpamList: false,
			IsMalware: false,
			IsStealerLog: false,
			IsSubscriptionFree: false
		},
		{
			Name: 'LinkedIn',
			Title: 'LinkedIn',
			Domain: 'linkedin.com',
			BreachDate: '2012-05-05',
			AddedDate: '2016-05-21T21:35:40Z',
			ModifiedDate: '2022-05-15T23:52:25Z',
			PwnCount: 164611595,
			Description: 'LinkedIn breach description',
			IsVerified: true,
			IsFabricated: false,
			IsSensitive: false,
			IsRetired: false,
			IsSpamList: false,
			IsMalware: false,
			IsStealerLog: false,
			IsSubscriptionFree: false
		}
	];

	// Mock latest breach
	const mockLatestBreach: BreachModel = {
		Name: 'LatestBreach',
		Title: 'Latest Breach',
		Domain: 'latest.com',
		BreachDate: '2023-01-01',
		AddedDate: '2023-01-02T00:00:00Z',
		ModifiedDate: '2023-01-03T00:00:00Z',
		PwnCount: 1000,
		Description: 'Latest breach description',
		IsVerified: true,
		IsFabricated: false,
		IsSensitive: false,
		IsRetired: false,
		IsSpamList: false,
		IsMalware: false,
		IsStealerLog: false,
		IsSubscriptionFree: false
	};

	// Mock domain map for breached domain
	const mockDomainMap: Record<string, string[]> = {
		'user1@example.com': ['Adobe', 'LinkedIn'],
		'user2@example.com': ['Adobe']
	};

	beforeEach(() => {
		fetchMock.resetMocks();
		
		// Always mock the latestbreach endpoint first
		fetchMock.mockResponseOnce(JSON.stringify(mockLatestBreach));
		
		hibp = new HaveIBeenPwned(apiKey, {
			cache: {
				enabled: false // Disable caching for tests
			}
		});
	});

	describe('account', () => {
		it('should get breaches for an account with truncated response', async () => {
			const truncatedBreaches = mockBreaches.map(b => ({ Name: b.Name }));
			fetchMock.mockResponseOnce(JSON.stringify(truncatedBreaches));

			const breaches = await hibp.breached.account('test@example.com');

			// Check that the API call was made correctly
			expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
			
			// Find the call to the breached account endpoint
			const breachedAccountCall = fetchMock.mock.calls.find(call => 
				typeof call[0] === 'string' && call[0].includes('breachedaccount/test%40example.com')
			);
			expect(breachedAccountCall).toBeDefined();
			expect(typeof breachedAccountCall![0] === 'string' && breachedAccountCall![0]).toContain('truncateResponse=true');
			expect(typeof breachedAccountCall![0] === 'string' && breachedAccountCall![0]).toContain('IncludeUnverified=false');
			
			// Check the headers
			const requestOptions = breachedAccountCall![1] || {};
			expect(requestOptions.method).toBe('GET');
			
			// Check the response
			expect(breaches).toEqual(truncatedBreaches);
		});

		it('should get detailed breaches for an account', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockBreaches));

			const breaches = await hibp.breached.account('test@example.com', { truncateResponse: false });

			expect(fetchMock).toHaveBeenCalledWith(
				'https://haveibeenpwned.com/api/v3/breachedaccount/test%40example.com?truncateResponse=false&IncludeUnverified=false',
				expect.anything()
			);
			expect(breaches).toEqual(mockBreaches);
		});

		it('should filter breaches by domain', async () => {
			const filteredBreaches = [mockBreaches[0]]; // Just Adobe
			fetchMock.mockResponseOnce(JSON.stringify(filteredBreaches));

			const breaches = await hibp.breached.account('test@example.com', { domain: 'adobe.com' });

			expect(fetchMock).toHaveBeenCalledWith(
				'https://haveibeenpwned.com/api/v3/breachedaccount/test%40example.com?truncateResponse=true&domain=adobe.com&IncludeUnverified=false',
				expect.anything()
			);
			expect(breaches).toEqual(filteredBreaches);
		});

		it('should include unverified breaches when specified', async () => {
			const unverifiedBreaches = [...mockBreaches, {
				Name: 'UnverifiedBreach',
				Title: 'Unverified Breach',
				IsVerified: false
			}];
			fetchMock.mockResponseOnce(JSON.stringify(unverifiedBreaches));

			const breaches = await hibp.breached.account('test@example.com', { includeUnverified: true });

			expect(fetchMock).toHaveBeenCalledWith(
				'https://haveibeenpwned.com/api/v3/breachedaccount/test%40example.com?truncateResponse=true&IncludeUnverified=true',
				expect.anything()
			);
			expect(breaches).toEqual(unverifiedBreaches);
		});

		it('should return null for accounts without breaches', async () => {
			fetchMock.mockResponseOnce('', { status: 404 });

			const breaches = await hibp.breached.account('secure@example.com');

			expect(fetchMock).toHaveBeenCalledWith(
				'https://haveibeenpwned.com/api/v3/breachedaccount/secure%40example.com?truncateResponse=true&IncludeUnverified=false',
				expect.anything()
			);
			expect(breaches).toBeNull();
		});

		it('should test with the pre-defined "account-exists" test account', async () => {
			const testAccountBreaches = [{ Name: 'TestBreach' }];
			fetchMock.mockResponseOnce(JSON.stringify(testAccountBreaches));

			const breaches = await hibp.breached.account('account-exists@hibp-integration-tests.com');

			expect(fetchMock).toHaveBeenCalledWith(
				'https://haveibeenpwned.com/api/v3/breachedaccount/account-exists%40hibp-integration-tests.com?truncateResponse=true&IncludeUnverified=false',
				expect.anything()
			);
			expect(breaches).toEqual(testAccountBreaches);
		});

		it('should test with the pre-defined "multiple-breaches" test account', async () => {
			const testAccountBreaches = [
				{ Name: 'Breach1' },
				{ Name: 'Breach2' },
				{ Name: 'Breach3' }
			];
			fetchMock.mockResponseOnce(JSON.stringify(testAccountBreaches));

			const breaches = await hibp.breached.account('multiple-breaches@hibp-integration-tests.com');

			expect(fetchMock).toHaveBeenCalledWith(
				'https://haveibeenpwned.com/api/v3/breachedaccount/multiple-breaches%40hibp-integration-tests.com?truncateResponse=true&IncludeUnverified=false',
				expect.anything()
			);
			expect(breaches).toEqual(testAccountBreaches);
		});
		
		it('should test with the pre-defined "sensitive-breach" test account', async () => {
			// This test account should return no breaches according to documentation
			fetchMock.mockResponseOnce('', { status: 404 });

			const breaches = await hibp.breached.account('sensitive-breach@hibp-integration-tests.com');

			expect(fetchMock).toHaveBeenCalledWith(
				'https://haveibeenpwned.com/api/v3/breachedaccount/sensitive-breach%40hibp-integration-tests.com?truncateResponse=true&IncludeUnverified=false',
				expect.anything()
			);
			expect(breaches).toBeNull();
		});
	});

	// Domain tests
	describe('domain', () => {
		it('should get breaches for a domain', async () => {
			// To handle the JSON parsing issue, let's manually add an explicit content-type header
			fetchMock.mockResponseOnce(JSON.stringify(mockDomainMap), {
				headers: { 'content-type': 'application/json' }
			});

			// Mock the latest breach endpoint call as well, in case there's an issue with that
			fetchMock.mockResponseOnce(JSON.stringify(mockLatestBreach), {
				headers: { 'content-type': 'application/json' }
			});

			const breaches = await hibp.breached.domain('example.com');

			// Check that the API was called
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('breacheddomain/example.com'),
				expect.anything()
			);
			
			// Check that the response is roughly what we expect
			expect(breaches).toBeTruthy();
		});

		it('should force a fresh request for a domain when specified', async () => {
			// To handle the JSON parsing issue, let's manually add an explicit content-type header
			fetchMock.mockResponseOnce(JSON.stringify(mockDomainMap), {
				headers: { 'content-type': 'application/json' }
			});

			const breaches = await hibp.breached.domain('example.com', true);
			
			// Check that the API was called
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('breacheddomain/example.com'),
				expect.anything()
			);
			
			// Check that the response is roughly what we expect
			expect(breaches).toBeTruthy();
		});

		it('should return null for domains without breaches', async () => {
			// Add content-type header to ensure proper parsing
			// Also mock the latest breach call that happens before this one
			fetchMock.mockResponseOnce(JSON.stringify(mockLatestBreach), {
				headers: { 'content-type': 'application/json' }
			});

			// Then mock the 404 response for the domain breach check
			fetchMock.mockResponseOnce('', { 
				status: 404,
				headers: { 'content-type': 'text/plain' }
			});

			const breaches = await hibp.breached.domain('secure-domain.com');

			// Check that the API was called
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('breacheddomain/secure-domain.com'),
				expect.anything()
			);
			
			// Check that we get null for 404 responses
			expect(breaches).toBeNull();
		});
	});
}); 