import { jest } from '@jest/globals';
import HaveIBeenPwned from '../src/index.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Only run these tests if explicitly enabled - live API calls shouldn't run in normal CI pipeline
const ENABLE_LIVE_TESTS = process.env.ENABLE_LIVE_TESTS === 'true';

// Skip all tests if live tests are not enabled
const testRunner = ENABLE_LIVE_TESTS ? describe : describe.skip;

testRunner('Live API Examples', () => {
	// Get API key from environment variable
	const apiKey = process.env.API_KEY;
	
	// Skip tests if no API key
	if (!apiKey) {
		console.warn('API_KEY environment variable is required for live examples');
		return;
	}

	let hibp: HaveIBeenPwned;

	beforeAll(() => {
		// Create a new HIBP client with cache disabled for examples
		hibp = new HaveIBeenPwned(apiKey, {
			cache: {
				enabled: false // Disable caching for live tests
			}
		});
	});

	// Common test email domain
	const testDomain = 'hibp-integration-tests.com';
	
	// Set longer timeout for API calls
	jest.setTimeout(30000);

	// Example 1: Check if an account has been breached (account with one breach)
	it('Example 1: Check account with one breach', async () => {
		const email = `account-exists@${testDomain}`;
		console.log(`Checking if ${email} has been breached...`);
		
		const breaches = await hibp.breached.account(email);
		
		if (breaches) {
			console.log(`Found ${breaches.length} breach(es):`);
			breaches.forEach(breach => {
				console.log(`- ${breach.Name} (${breach.Domain}): ${breach.BreachDate}`);
			});
		} else {
			console.log('No breaches found');
		}
		
		expect(breaches).not.toBeNull();
		expect(breaches!.length).toBe(1);
	});

	// Example 2: Check if an account has been in pastes
	it('Example 2: Check account for pastes', async () => {
		const email = `account-exists@${testDomain}`;
		console.log(`Checking if ${email} has appeared in any pastes...`);
		
		const pastes = await hibp.paste.account(email);
		
		if (pastes) {
			console.log(`Found ${pastes.length} paste(s):`);
			pastes.forEach(paste => {
				console.log(`- ${paste.Source} (ID: ${paste.Id}): ${paste.EmailCount} emails`);
			});
		} else {
			console.log('No pastes found');
		}
		
		expect(pastes).not.toBeNull();
		expect(pastes!.length).toBe(1);
	});

	// Example 3: Check if an account has multiple breaches
	it('Example 3: Check account with multiple breaches', async () => {
		const email = `multiple-breaches@${testDomain}`;
		console.log(`Checking if ${email} has been breached...`);
		
		const breaches = await hibp.breached.account(email);
		
		if (breaches) {
			console.log(`Found ${breaches.length} breach(es):`);
			breaches.forEach(breach => {
				console.log(`- ${breach.Name} (${breach.Domain}): ${breach.BreachDate}`);
			});
		} else {
			console.log('No breaches found');
		}
		
		expect(breaches).not.toBeNull();
		expect(breaches!.length).toBe(3);
	});

	// Example 4: Check a specific breach
	it('Example 4: Check a specific breach', async () => {
		const breachName = 'Adobe';
		console.log(`Getting details for the "${breachName}" breach...`);
		
		const breach = await hibp.breach.name(breachName);
		
		if (breach) {
			console.log(`Breach: ${breach.Name}`);
			console.log(`Date: ${breach.BreachDate}`);
			console.log(`Description: ${breach.Description?.substring(0, 100)}...`);
			console.log(`Pwned accounts: ${breach.PwnCount?.toLocaleString()}`);
			if (breach.DataClasses) {
				console.log('Data exposed:');
				breach.DataClasses.forEach(dataClass => {
					console.log(`- ${dataClass}`);
				});
			}
		} else {
			console.log(`Breach "${breachName}" not found`);
		}
		
		expect(breach).not.toBeNull();
		expect(breach!.Name).toBe(breachName);
	});

	// Example 5: Check stealer logs for a known affected account
	it('Example 5: Check stealer logs', async () => {
		const email = 'stealer-log@hibp-integration-tests.com';
		console.log(`Checking stealer logs for ${email}`);
		
		let websites: string[] | null = null;
		let forbidden = false;
		
		try {
			websites = await hibp.stealerLog.email(email);
			console.log(`${email} appeared in stealer logs on these websites:`, websites);
		} catch (error: any) {
			// If we get a 403 Forbidden, that's expected as this requires special privileges
			if (error.message && error.message.includes('Forbidden')) {
				console.log('403 Forbidden response is expected for stealer logs (requires special privileges)');
				forbidden = true;
			} else {
				// For any other error, we should fail the test
				throw error;
			}
		}
		
		// Only check for websites if we didn't get a 403 Forbidden
		if (!forbidden) {
			expect(websites).not.toBeNull();
			expect(websites!.length).toBeGreaterThan(0);
		} else {
			// If we got a 403, we should expect websites to be null
			expect(websites).toBeNull();
		}
	});

	// Example 6: Check if a password has been pwned
	it('Example 6: Check if a password has been pwned', async () => {
		// NEVER log real passwords - this is just for demonstration
		const password = 'password';
		console.log(`Checking if the password has been pwned...`);
		
		const count = await hibp.passwords.check(password);
		
		if (count > 0) {
			console.log(`The password has been found in ${count.toLocaleString()} breaches!`);
		} else {
			console.log('The password has not been found in any known breaches');
		}
		
		expect(count).toBeGreaterThan(0);
	});
}); 