import HaveIBeenPwned from '../src/index.js';
import fetchMock from 'jest-fetch-mock';
import { config } from 'dotenv';
import type { SubscriptionStatusResponse, SubscribedDomainsResponse } from '../src/types';

// Load environment variables
config();

describe('Subscription', () => {
	const apiKey = process.env.API_KEY || '58b1febd04414585afdd514b74f4499f';
	let hibp: HaveIBeenPwned;

	// Mock subscription status data
	const mockSubscriptionStatus: SubscriptionStatusResponse = {
		SubscribedUntil: '2025-03-28T06:49:17',
		SubscriptionName: 'Pwned 5',
		Description: 'Domains with unlimited breached addresses, a rate limited API key allowing 1000 email address searches per minute and stealer log searches',
		DomainSearchMaxBreachedAccounts: null,
		Rpm: 1000
	};

	// Mock subscribed domains data
	const mockSubscribedDomains: SubscribedDomainsResponse[] = [
		{
			DomainName: 'example.com',
			PwnCount: 1000000,
			PwnCountExcludingSpamLists: 950000,
			PwnCountExcludingSpamListsAtLastSubscriptionRenewal: 900000,
			NextSubscriptionRenewal: '2025-03-28T06:49:17'
		},
		{
			DomainName: 'another-example.com',
			PwnCount: 500000,
			PwnCountExcludingSpamLists: 480000,
			PwnCountExcludingSpamListsAtLastSubscriptionRenewal: 450000,
			NextSubscriptionRenewal: '2025-03-28T06:49:17'
		}
	];

	beforeEach(() => {
		fetchMock.resetMocks();
		
		// Mock the latestbreach API call that happens on initialization with an empty response
		// to prevent it from affecting other tests
		fetchMock.mockResponseOnce('{}');
		
		hibp = new HaveIBeenPwned(apiKey, {
			cache: {
				enabled: false // Disable caching for tests
			}
		});
	});

	describe('status', () => {
		it('should get subscription status', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockSubscriptionStatus));
			
			const status = await hibp.subscription.status();
			
			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/subscription/status',
				expect.anything()
			);
			
			expect(status).toEqual(mockSubscriptionStatus);
		});

		it('should handle 401 unauthorized errors for invalid API keys', async () => {
			fetchMock.mockResponseOnce('', { status: 401 });

			await expect(hibp.subscription.status()).rejects.toThrow('Unauthorized');
		});
	});

	describe('domains', () => {
		it('should get subscribed domains', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockSubscribedDomains));
			
			const domains = await hibp.subscription.domains();
			
			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/subscribeddomains',
				expect.anything()
			);
			
			expect(domains).toEqual(mockSubscribedDomains);
		});

		it('should return an empty array if no domains are subscribed', async () => {
			fetchMock.mockResponseOnce(JSON.stringify([]));

			const domains = await hibp.subscription.domains();

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/subscribeddomains',
				expect.anything()
			);
			expect(domains).toEqual([]);
		});

		it('should handle 401 unauthorized errors for invalid API keys', async () => {
			fetchMock.mockResponseOnce('', { status: 401 });

			await expect(hibp.subscription.domains()).rejects.toThrow('Unauthorized');
		});
	});
}); 