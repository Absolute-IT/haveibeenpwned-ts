import HaveIBeenPwned from '../src/index.js';
import fetchMock from 'jest-fetch-mock';
import { config } from 'dotenv';

// Load environment variables
config();

describe('Data', () => {
	const apiKey = process.env.API_KEY || '58b1febd04414585afdd514b74f4499f';
	let hibp: HaveIBeenPwned;

	// Mock data classes response
	const mockDataClasses = [
		'Email addresses',
		'Passwords',
		'Names',
		'Phone numbers',
		'Dates of birth'
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

	describe('classes', () => {
		it('should get all data classes', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockDataClasses));
			
			const dataClasses = await hibp.data.classes();
			
			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/dataclasses',
				expect.anything()
			);
			
			expect(dataClasses).toEqual(mockDataClasses);
		});

		it('should return an empty array if no data classes exist', async () => {
			fetchMock.mockResponseOnce(JSON.stringify([]));

			const dataClasses = await hibp.data.classes();

			expect(fetchMock).toHaveBeenCalledWith(
				'https://haveibeenpwned.com/api/v3/dataclasses',
				expect.anything()
			);
			expect(dataClasses).toEqual([]);
		});

		it('should handle errors', async () => {
			fetchMock.mockResponseOnce('', { status: 500 });

			await expect(hibp.data.classes()).rejects.toThrow('Internal server error');
		});
	});
});