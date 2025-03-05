import HaveIBeenPwned from '../src/index.js';
import fetchMock from 'jest-fetch-mock';
import { config } from 'dotenv';

// Load environment variables
config();

describe('StealerLog', () => {
	const apiKey = process.env.API_KEY || '58b1febd04414585afdd514b74f4499f';
	let hibp: HaveIBeenPwned;

	// Mock stealer log data
	const mockEmailDomains = ['example.org', 'example.net'];

	const mockWebsiteDomains = ['user1@domain.com', 'user2@domain.com'];

	const mockEmailDomainMap = {
		'domain1.com': ['user1@example.com', 'user2@example.com'],
		'domain2.com': ['user3@example.com', 'user4@example.com']
	};

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

	describe('email', () => {
		it('should get stealer log domains for an email', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockEmailDomains));

			const domains = await hibp.stealerLog.email('test@example.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/stealerlogsbyemail/test%40example.com',
				expect.anything()
			);
			expect(domains).toEqual(mockEmailDomains);
		});

		it('should return null for emails without stealer logs', async () => {
			fetchMock.mockResponseOnce('', { status: 404 });

			const domains = await hibp.stealerLog.email('secure@example.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/stealerlogsbyemail/secure%40example.com',
				expect.anything()
			);
			expect(domains).toBeNull();
		});

		it('should handle URL encoding in email addresses', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockEmailDomains));

			const domains = await hibp.stealerLog.email('test+tag@example.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/stealerlogsbyemail/test%2Btag%40example.com',
				expect.anything()
			);
			expect(domains).toEqual(mockEmailDomains);
		});
	});

	describe('website', () => {
		it('should get stealer log emails for a website domain', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockWebsiteDomains));

			const emails = await hibp.stealerLog.website('example.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/stealerlogsbywebsitedomain/example.com',
				expect.anything()
			);
			expect(emails).toEqual(mockWebsiteDomains);
		});

		it('should return null for websites without stealer logs', async () => {
			fetchMock.mockResponseOnce('', { status: 404 });

			const emails = await hibp.stealerLog.website('secure-domain.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/stealerlogsbywebsitedomain/secure-domain.com',
				expect.anything()
			);
			expect(emails).toBeNull();
		});
	});

	describe('emailDomain', () => {
		it('should get stealer log information for an email domain', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockEmailDomainMap));

			const map = await hibp.stealerLog.emailDomain('example.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/stealerlogsbyemaildomain/example.com',
				expect.anything()
			);
			expect(map).toEqual(mockEmailDomainMap);
		});

		it('should return null for email domains without stealer logs', async () => {
			fetchMock.mockResponseOnce('', { status: 404 });

			const map = await hibp.stealerLog.emailDomain('secure-domain.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/stealerlogsbyemaildomain/secure-domain.com',
				expect.anything()
			);
			expect(map).toBeNull();
		});
	});
}); 