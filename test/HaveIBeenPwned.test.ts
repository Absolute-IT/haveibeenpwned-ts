import "dotenv/config";
import HaveIBeenPwned from '../src/index.js';

describe("HaveIBeenPwned", () => {
	const apiKey = process.env.API_KEY;
	let hibp: HaveIBeenPwned;

	beforeEach(() => {
		if (!apiKey) {
			throw new Error("API key is required");
		}

		hibp = new HaveIBeenPwned(apiKey, {
			cache: {
				enabled: false
			}
		});
	});

	it("should be defined", () => {
		expect(hibp).toBeDefined();
	});
});

