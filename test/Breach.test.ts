import HaveIBeenPwned from '../src/index.js';
import fetchMock from 'jest-fetch-mock';
import { config } from 'dotenv';
import type { BreachModel } from '../src/types';

// Load environment variables
config();

describe('Breach', () => {
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
			LogoPath: 'https://logos.haveibeenpwned.com/Adobe.png',
			DataClasses: ['Email addresses', 'Password hints', 'Passwords', 'Usernames'],
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
			LogoPath: 'https://logos.haveibeenpwned.com/LinkedIn.png',
			DataClasses: ['Email addresses', 'Passwords'],
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

	describe('all', () => {
		it('should get all breaches', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockBreaches));
			
			const breaches = await hibp.breach.all();
			
			// Check that the second API call is the one we're expecting
			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/breaches?IsSpamList=false',
				expect.anything()
			);
			expect(breaches).toEqual(mockBreaches);
		});

		it('should filter breaches by domain', async () => {
			const filteredBreaches = [mockBreaches[0]]; // Just Adobe
			fetchMock.mockResponseOnce(JSON.stringify(filteredBreaches));
			
			const breaches = await hibp.breach.all({ domain: 'adobe.com' });
			
			// Check that the second API call is the one we're expecting
			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/breaches?Domain=adobe.com&IsSpamList=false',
				expect.anything()
			);
			expect(breaches).toEqual(filteredBreaches);
		});

		it('should filter breaches by spam list', async () => {
			const spamBreaches = [
				{
					...mockBreaches[0],
					IsSpamList: true
				}
			];
			fetchMock.mockResponseOnce(JSON.stringify(spamBreaches));

			const breaches = await hibp.breach.all({ isSpamList: true });

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/breaches?IsSpamList=true',
				expect.anything()
			);
			expect(breaches).toEqual(spamBreaches);
		});
	});

	describe('name', () => {
		it('should get a breach by name', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockBreaches[0]));
			
			const breach = await hibp.breach.name('Adobe');
			
			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/breach/Adobe',
				expect.anything()
			);
			expect(breach).toEqual(mockBreaches[0]);
		});
		
		it('should return null for non-existent breach', async () => {
			fetchMock.mockResponseOnce('', { status: 404 });
			
			const breach = await hibp.breach.name('NonExistentBreach');
			
			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/breach/NonExistentBreach',
				expect.anything()
			);
			expect(breach).toBeNull();
		});

		it('should handle URL encoding in breach names', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockBreaches[0]));

			await hibp.breach.name('Breach With Spaces');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/breach/Breach%20With%20Spaces',
				expect.anything()
			);
		});
	});

	describe('latest', () => {
		it('should get the latest breach', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockBreaches[0]));
			
			const breach = await hibp.breach.latest();
			
			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/latestbreach',
				expect.anything()
			);
			expect(breach).toEqual(mockBreaches[0]);
		});

		it('should return null if there are no breaches', async () => {
			fetchMock.mockResponseOnce('', { status: 404 });

			const breach = await hibp.breach.latest();

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/latestbreach',
				expect.anything()
			);
			expect(breach).toBeNull();
		});
	});
}); 