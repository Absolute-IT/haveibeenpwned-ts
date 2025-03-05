import HaveIBeenPwned from '../src/index.js';
import fetchMock from 'jest-fetch-mock';
import { config } from 'dotenv';
import type { PasteModel } from '../src/types';

// Load environment variables
config();

describe('Paste', () => {
	const apiKey = process.env.API_KEY || '58b1febd04414585afdd514b74f4499f';
	let hibp: HaveIBeenPwned;

	// Mock paste data
	const mockPastes: PasteModel[] = [
		{
			Source: 'Pastebin',
			Id: 'AbCdEfGh',
			Title: 'Leaked Data',
			Date: new Date('2021-01-01T00:00:00Z'),
			EmailCount: 1000
		},
		{
			Source: 'Pastebin',
			Id: 'XyZaBcDe',
			Title: 'More Leaked Data',
			Date: new Date('2022-02-15T00:00:00Z'),
			EmailCount: 500
		}
	];
	
	// Helper function to compare pastes with date handling
	const comparePastes = (actual: PasteModel[] | null, expected: PasteModel[]) => {
		if (actual === null) {
			expect(actual).toBeNull();
			return;
		}
		
		expect(actual.length).toEqual(expected.length);
		
		for (let i = 0; i < actual.length; i++) {
			const actualPaste = actual[i];
			const expectedPaste = expected[i];
			
			// Compare non-date properties
			expect(actualPaste.Source).toEqual(expectedPaste.Source);
			expect(actualPaste.Id).toEqual(expectedPaste.Id);
			expect(actualPaste.Title).toEqual(expectedPaste.Title);
			expect(actualPaste.EmailCount).toEqual(expectedPaste.EmailCount);
			
			// Handle date comparison (string or Date object)
			const actualDate = actualPaste.Date instanceof Date ? 
				actualPaste.Date : 
				new Date(actualPaste.Date as unknown as string);
				
			const expectedDate = expectedPaste.Date instanceof Date ? 
				expectedPaste.Date : 
				new Date(expectedPaste.Date as unknown as string);
				
			expect(actualDate.toISOString()).toEqual(expectedDate.toISOString());
		}
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

	describe('account', () => {
		it('should get pastes for an account', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockPastes));
			
			const pastes = await hibp.paste.account('test@example.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/pasteaccount/test%40example.com',
				expect.anything()
			);
			
			comparePastes(pastes, mockPastes);
		});

		it('should return null for accounts without pastes', async () => {
			fetchMock.mockResponseOnce('', { status: 404 });
			
			const pastes = await hibp.paste.account('secure@example.com');
			
			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/pasteaccount/secure%40example.com',
				expect.anything()
			);
			
			expect(pastes).toBeNull();
		});

		it('should handle URL encoding in email addresses', async () => {
			fetchMock.mockResponseOnce(JSON.stringify(mockPastes));

			await hibp.paste.account('test+tag@example.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/pasteaccount/test%2Btag%40example.com',
				expect.anything()
			);
		});

		it('should test with the pre-defined "account-exists" test account', async () => {
			// This test account should return one paste according to documentation
			const testAccountPastes = [mockPastes[0]];
			fetchMock.mockResponseOnce(JSON.stringify(testAccountPastes));

			const pastes = await hibp.paste.account('account-exists@hibp-integration-tests.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/pasteaccount/account-exists%40hibp-integration-tests.com',
				expect.anything()
			);
			
			comparePastes(pastes, testAccountPastes);
		});

		it('should test with the pre-defined "paste-sensitive-breach" test account', async () => {
			// This test account should return one paste according to documentation
			const testAccountPastes = [mockPastes[0]];
			fetchMock.mockResponseOnce(JSON.stringify(testAccountPastes));

			const pastes = await hibp.paste.account('paste-sensitive-breach@hibp-integration-tests.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/pasteaccount/paste-sensitive-breach%40hibp-integration-tests.com',
				expect.anything()
			);
			
			comparePastes(pastes, testAccountPastes);
		});

		it('should test with the pre-defined "opt-out" test account', async () => {
			// This test account should return no pastes according to documentation
			fetchMock.mockResponseOnce('', { status: 404 });

			const pastes = await hibp.paste.account('opt-out@hibp-integration-tests.com');

			expect(fetchMock).toHaveBeenNthCalledWith(2,
				'https://haveibeenpwned.com/api/v3/pasteaccount/opt-out%40hibp-integration-tests.com',
				expect.anything()
			);
			expect(pastes).toBeNull();
		});
	});
}); 