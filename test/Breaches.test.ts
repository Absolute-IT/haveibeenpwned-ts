import "dotenv/config";
import HaveIBeenPwned from '../src/index.js';
import { before } from "node:test";

describe("Breaches", () => {
	const apiKey = process.env.API_KEY;
	let hibp: HaveIBeenPwned;

	if (!apiKey) {
		throw new Error("API key is required");
	}

	hibp = new HaveIBeenPwned(apiKey, {
		cache: {
			enabled: false
		}
	});

	it("account exists", async () => {
		const result = await hibp.breached.account("account-exists@hibp-integration-tests.com");
		expect(result).toBeDefined();
		expect(result).toBeInstanceOf(Array);
		expect(result?.length).toBeGreaterThan(0);
	});

	it("account does not exist", async () => {
		const result = await hibp.breached.account("account-does-not-exist@hibp-integration-tests.com");
		expect(result).toBeDefined();
		expect(result).toBe(null);
	});

	it("multiple breaches", async () => {
		const result = await hibp.breached.account("multiple-breaches@hibp-integration-tests.com");
		expect(result).toBeDefined();
		expect(result).toBeInstanceOf(Array);
		expect(result?.length).toBe(3);
	});

	it("opt-out", async () => {
		const result = await hibp.breached.account("opt-out@hibp-integration-tests.com");
		expect(result).toBeDefined();
		expect(result).toBeInstanceOf(Array);
		expect(result?.length).toBe(0);
	});
});