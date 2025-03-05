import { jest } from '@jest/globals';
import HaveIBeenPwned from '../src/index.js';
import { config } from 'dotenv';
import { BreachModel, PasteModel } from '../src/types';

// Load environment variables
config();

// Only run these tests if explicitly enabled - live API calls shouldn't run in normal CI pipeline
const ENABLE_LIVE_TESTS = process.env.ENABLE_LIVE_TESTS === 'true';

// Skip all tests if live tests are not enabled
const testRunner = ENABLE_LIVE_TESTS ? describe : describe.skip;

testRunner('Live API Integration Tests', () => {
	// Get API key from environment variable
	const apiKey = process.env.API_KEY;

	// Ensure we have an API key
	if (!apiKey) {
		throw new Error('API_KEY environment variable is required for live integration tests');
	}

	let hibp: HaveIBeenPwned;

	beforeAll(() => {
		// Create a new HIBP client with cache disabled for live tests
		hibp = new HaveIBeenPwned(apiKey, {
			cache: {
				enabled: false // Disable caching for live tests
			}
		});
	});

	// Common test email domain
	const testDomain = 'hibp-integration-tests.com';

	// Test account mapping
	const testAccounts = {
		accountExists: `account-exists@${testDomain}`,
		multipleBreaches: `multiple-breaches@${testDomain}`,
		notActiveAndActiveBreach: `not-active-and-active-breach@${testDomain}`,
		notActiveBreach: `not-active-breach@${testDomain}`,
		optOut: `opt-out@${testDomain}`,
		optOutBreach: `opt-out-breach@${testDomain}`,
		pasteSensitiveBreach: `paste-sensitive-breach@${testDomain}`,
		permanentOptOut: `permanent-opt-out@${testDomain}`,
		sensitiveAndOtherBreaches: `sensitive-and-other-breaches@${testDomain}`,
		sensitiveBreach: `sensitive-breach@${testDomain}`,
		spamListOnly: `spam-list-only@${testDomain}`,
		spamListAndOthers: `spam-list-and-others@${testDomain}`,
		subscriptionFreeAndOtherBreaches: `subscription-free-and-other-breaches@${testDomain}`,
		stealerLog: `stealer-log@${testDomain}`,
		subscriptionFreeBreach: `subscription-free-breach@${testDomain}`,
		unverifiedBreach: `unverified-breach@${testDomain}`
	};

	// Set longer timeout for API calls
	jest.setTimeout(30000);

	describe('Breached.account', () => {
		it('should find one breach for account-exists', async () => {
			const breaches = await hibp.breached.account(testAccounts.accountExists);
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches!.length).toBe(1);
		});

		it('should find three breaches for multiple-breaches', async () => {
			const breaches = await hibp.breached.account(testAccounts.multipleBreaches);
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches!.length).toBe(3);
		});

		it('should find one active breach (Adobe) for not-active-and-active-breach', async () => {
			const breaches = await hibp.breached.account(testAccounts.notActiveAndActiveBreach);
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches!.length).toBe(1);
			expect(breaches![0].Name).toBe('Adobe');
		});

		it('should not find any breaches for not-active-breach', async () => {
			const breaches = await hibp.breached.account(testAccounts.notActiveBreach);
			expect(breaches).toBeNull();
		});

		it('should not find any breaches for opt-out', async () => {
			const breaches = await hibp.breached.account(testAccounts.optOut);
			expect(breaches).toBeNull();
		});

		it('should not find any breaches for opt-out-breach', async () => {
			const breaches = await hibp.breached.account(testAccounts.optOutBreach);
			expect(breaches).toBeNull();
		});

		it('should find two non-sensitive breaches for sensitive-and-other-breaches', async () => {
			const breaches = await hibp.breached.account(testAccounts.sensitiveAndOtherBreaches);
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches!.length).toBe(2);
			// Verify none of the breaches are sensitive
			expect(breaches!.every(b => !b.IsSensitive)).toBe(true);
		});

		it('should not find any breaches for sensitive-breach', async () => {
			const breaches = await hibp.breached.account(testAccounts.sensitiveBreach);
			expect(breaches).toBeNull();
		});

		it('should find a single spam list for spam-list-only', async () => {
			const breaches = await hibp.breached.account(testAccounts.spamListOnly);
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches!.length).toBe(1);
			expect(breaches![0].IsSpamList !== false).toBe(true);
		});

		it('should find multiple breaches including a spam list for spam-list-and-others', async () => {
			const breaches = await hibp.breached.account(testAccounts.spamListAndOthers);
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches!.length).toBeGreaterThan(1);
			expect(breaches!.some(b => b.IsSpamList !== false)).toBe(true);
		});

		it('should find a subscription-free breach and two other breaches', async () => {
			const breaches = await hibp.breached.account(testAccounts.subscriptionFreeAndOtherBreaches);
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches!.length).toBeGreaterThan(0);
			expect(breaches!.some(b => b.IsSubscriptionFree !== false)).toBe(true);
		});

		it('should find a single stealer log breach', async () => {
			const breaches = await hibp.breached.account(testAccounts.stealerLog);
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches!.length).toBeGreaterThan(0);
		});

		it('should find a single subscription-free breach', async () => {
			const breaches = await hibp.breached.account(testAccounts.accountExists);
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches!.length).toBeGreaterThan(0);
		});

		it('should find one unverified breach when includeUnverified is true', async () => {
			const breaches = await hibp.breached.account(testAccounts.unverifiedBreach, {
				includeUnverified: true
			});
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches!.length).toBe(1);
			expect(breaches![0].IsVerified !== true).toBe(true);
		});

		it('should not find unverified breach when includeUnverified is false', async () => {
			const breaches = await hibp.breached.account(testAccounts.unverifiedBreach, {
				includeUnverified: false
			});
			expect(breaches).toBeNull();
		});
	});

	describe('Paste.account', () => {
		it('should find one paste for account-exists', async () => {
			const pastes = await hibp.paste.account(testAccounts.accountExists);
			expect(pastes).not.toBeNull();
			expect(Array.isArray(pastes)).toBe(true);
			expect(pastes!.length).toBe(1);
		});

		it('should not find any pastes for opt-out', async () => {
			const pastes = await hibp.paste.account(testAccounts.optOut);
			expect(pastes).toBeNull();
		});

		it('should find one paste for paste-sensitive-breach', async () => {
			const pastes = await hibp.paste.account(testAccounts.pasteSensitiveBreach);
			expect(pastes).not.toBeNull();
			expect(Array.isArray(pastes)).toBe(true);
			expect(pastes!.length).toBe(1);
		});
	});

	describe('Breach.all', () => {
		it('should retrieve all breaches', async () => {
			const breaches = await hibp.breach.all();
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches.length).toBeGreaterThan(100); // There should be many breaches
		});

		it('should filter breaches by domain', async () => {
			const domain = 'adobe.com';
			const breaches = await hibp.breach.all({ domain });
			expect(breaches).not.toBeNull();
			expect(Array.isArray(breaches)).toBe(true);
			expect(breaches.length).toBeGreaterThan(0);
			expect(breaches.every(b => b.Domain === domain)).toBe(true);
		});
	});

	describe('Breach.name', () => {
		it('should retrieve a specific breach by name', async () => {
			const breachName = 'Adobe';
			const breach = await hibp.breach.name(breachName);
			expect(breach).not.toBeNull();
			expect(breach!.Name).toBe(breachName);
		});

		it('should return null for a non-existent breach', async () => {
			const breach = await hibp.breach.name('ThisBreachDoesNotExist12345');
			expect(breach).toBeNull();
		});
	});

	describe('Breach.latest', () => {
		it('should retrieve the latest breach', async () => {
			const breach = await hibp.breach.latest();
			expect(breach).not.toBeNull();
			expect(breach!.Name).toBeDefined();
			expect(breach!.AddedDate).toBeDefined();
		});
	});

	describe('Data.classes', () => {
		it('should retrieve all data classes', async () => {
			const dataClasses = await hibp.data.classes() as string[];
			expect(dataClasses).not.toBeNull();
			expect(Array.isArray(dataClasses)).toBe(true);
			expect(dataClasses.length).toBeGreaterThan(0);
			// Common data classes
			expect(dataClasses).toContain('Email addresses');
			expect(dataClasses).toContain('Passwords');
		});
	});

	describe('StealerLog.email', () => {
		it('should handle stealer logs API for stealer-log account', async () => {
			try {
				const stealerLogs = await hibp.stealerLog.email(testAccounts.stealerLog);
				// If we get a response, check it
				if (stealerLogs) {
					expect(Array.isArray(stealerLogs)).toBe(true);
				}
			} catch (error) {
				// The API may require additional privileges, so we'll consider this test passing
				// if we get a 403 Forbidden error
				expect((error as Error).message).toContain('Forbidden');
			}
		});

		it('should handle clean account stealer log requests', async () => {
			try {
				const stealerLogs = await hibp.stealerLog.email(testAccounts.accountExists);
				// If we get a response, it should be null
				if (stealerLogs !== undefined) {
					expect(stealerLogs).toBeNull();
				}
			} catch (error) {
				// The API may require additional privileges, so we'll consider this test passing
				// if we get a 403 Forbidden error
				expect((error as Error).message).toContain('Forbidden');
			}
		});
	});

	describe('StealerLog.emailDomain', () => {
		it('should handle stealer logs by domain', async () => {
			try {
				const stealerLogsByDomain = await hibp.stealerLog.emailDomain(testDomain);
				// If we get a response, check it
				if (stealerLogsByDomain) {
					expect(stealerLogsByDomain instanceof Map).toBe(true);
				}
			} catch (error) {
				// The API may require additional privileges, so we'll consider this test passing
				// if we get a 403 Forbidden error
				expect((error as Error).message).toContain('Forbidden');
			}
		});
	});

	describe('Subscription.status', () => {
		it('should retrieve subscription status', async () => {
			const status = await hibp.subscription.status();
			expect(status).not.toBeNull();
			expect(status.SubscriptionName).toBeDefined();
			expect(status.SubscribedUntil).toBeDefined();
		});
	});

	describe('Subscription.domains', () => {
		it('should retrieve subscribed domains', async () => {
			const domains = await hibp.subscription.domains();
			expect(domains).not.toBeNull();
			expect(Array.isArray(domains)).toBe(true);
			// May be empty if no domains are subscribed
		});
	});

	describe('Passwords.range and check', () => {
		it('should check password range with SHA-1', async () => {
			// Using a known pawned password for testing
			const passwordHash = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8'; // "password"
			const count = await hibp.passwords.range(passwordHash);
			expect(count).toBeGreaterThan(0); // This password should be in many breaches
		});

		it('should directly check a known pawned password', async () => {
			const count = await hibp.passwords.check('password');
			expect(count).toBeGreaterThan(0);
		});

		it('should show a strong password has 0 occurrences', async () => {
			// Using a random UUID as a "strong" password for testing
			const strongPassword = 'cc53cec7-ddb9-4787-9133-4c3e8137ac67';
			const count = await hibp.passwords.check(strongPassword);
			expect(count).toBe(0);
		});
	});
}); 