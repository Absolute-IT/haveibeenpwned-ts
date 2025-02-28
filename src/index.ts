import { CacheManager } from "./cache.js";

import type { 
	BreachedAccountOptions, 
	BreachAllOptions, 
	BreachModel, 
	RequestOptions, 
	SubscriptionStatusResponse, 
	SubscribedDomainsResponse, 
	PasteModel, 
	HaveIBeenPwnedOptions, 
	CacheOptions, 
	CacheConfig 
} from "./types";

export type { 
	BreachedAccountOptions, 
	BreachAllOptions, 
	BreachModel, 
	SubscriptionStatusResponse, 
	SubscribedDomainsResponse, 
	PasteModel, 
	HaveIBeenPwnedOptions, 
	CacheOptions
};

/**
 * Base class for API endpoint wrappers
 */
abstract class EndpointBase {
	constructor(protected readonly client: HaveIBeenPwned) {}
	
	/**
	 * Request data without using the cache
	 */
	protected async requestNoCache(path: string, options: RequestOptions = {}): Promise<unknown> {
		return this.client.requestNoCache(path, options);
	}
	
	/**
	 * Update the cache with data
	 */
	protected async updateCache(path: string, params: Record<string, any> | undefined, data: unknown): Promise<void> {
		return this.client.updateCache(path, params, data);
	}
}

/**
 * Have I Been Pwned API client.
 * @see https://haveibeenpwned.com/API/v3
 *
 * @example
 * ```ts
 * // Basic usage with default configuration
 * const hibp = new HaveIBeenPwned(process.env.API_KEY!);
 * const data = await hibp.subscription.status();
 * console.log(data);
 * 
 * // Usage with custom options and caching configuration
 * const hibpCustom = new HaveIBeenPwned(process.env.API_KEY!, {
 *   baseUrl: "https://haveibeenpwned.com/api/v3/",
 *   userAgent: "my-custom-app/1.0",
 *   cache: {
 *     enabled: true,
 *     directory: "/custom/cache/path",
 *     ttl: 3600000 // 1 hour in milliseconds
 *   }
 * });
 * ```
 */
export default class HaveIBeenPwned {
	private readonly apiKey: string;
	private baseUrl = "https://haveibeenpwned.com/api/v3/";
	private passwordsBaseUrl = "https://api.pwnedpasswords.com/";
	private userAgent = "haveibeenpwned-ts";
	private cacheManager: CacheManager;
	
	// Private storage for lazy-loaded endpoint instances
	private _breached?: Breached;
	private _data?: Data;
	private _breach?: Breach;
	private _stealerLog?: StealerLog;
	private _paste?: Paste;
	private _subscription?: Subscription;
	private _passwords?: Passwords;
	
	/**
	 * Create a new Have I Been Pwned API client.
	 * @param apiKey The API key to use for the client.
	 * @param options Additional options for the client.
	 */
	constructor(apiKey: string, options?: HaveIBeenPwnedOptions) {
		if (!apiKey) {
			throw new Error("API key is required");
		}
		
		this.apiKey = apiKey;
		
		// Ensure baseUrl always has a trailing slash
		if (options?.baseUrl) {
			this.baseUrl = options.baseUrl.endsWith("/") ? options.baseUrl : `${options.baseUrl}/`;
		}

		if (options?.passwordsBaseUrl) {
			this.passwordsBaseUrl = options.passwordsBaseUrl.endsWith("/") ? options.passwordsBaseUrl : `${options.passwordsBaseUrl}/`;
		}
		
		this.userAgent = options?.userAgent ?? "haveibeenpwned-ts";
		
		// Initialize the cache manager
		const cacheConfig: CacheConfig = {
			enabled: options?.cache?.enabled ?? true,
			directory: options?.cache?.directory,
			ttl: options?.cache?.ttl
		};
		this.cacheManager = new CacheManager(cacheConfig);
		
		// Initialize by checking the latest breach in the background
		this.checkLatestBreach().catch(err => {
			console.error("Failed to fetch latest breach for cache initialization:", err);
		});
	}
	
	/**
	 * Configure caching options
	 * @param options Cache configuration options
	 */
	configureCaching(options: CacheOptions): void {
		const cacheConfig: CacheConfig = {
			enabled: options.enabled ?? true,
			directory: options.directory,
			ttl: options.ttl
		};
		this.cacheManager = new CacheManager(cacheConfig);
		
		// Re-initialize by checking the latest breach
		this.checkLatestBreach().catch(err => {
			console.error("Failed to fetch latest breach for cache initialization:", err);
		});
	}
	
	/**
	 * Check the latest breach and update cache manager.
	 * This helps determine whether cached data is still valid.
	 */
	private async checkLatestBreach(): Promise<void> {
		try {
			// This needs to bypass the cache mechanism to avoid infinite recursion
			const response = await this.requestNoCache("latestbreach", {
				method: "GET",
			});
			
			const latestBreach = response as BreachModel | null;
			
			if (latestBreach && latestBreach.AddedDate) {
				this.cacheManager.setLatestBreachDate(latestBreach.AddedDate);
			} else {
				this.cacheManager.setLatestBreachDate(null);
			}
		} catch (error) {
			console.error("Error checking latest breach:", error);
			this.cacheManager.setLatestBreachDate(null);
		}
	}
	
	/**
	 * Clear the cache
	 */
	async clearCache(): Promise<void> {
		await this.cacheManager.clearCache();
	}
	
	/**
	 * Lazy-loaded access to subscription endpoints
	 */
	get subscription(): Subscription {
		if (!this._subscription) {
			this._subscription = new Subscription(this);
		}
		return this._subscription;
	}

	get breach(): Breach {
		if (!this._breach) {
			this._breach = new Breach(this);
		}
		return this._breach;
	}

	get data(): Data {
		if (!this._data) {
			this._data = new Data(this);
		}
		return this._data;
	}

	get stealerLog(): StealerLog {
		if (!this._stealerLog) {
			this._stealerLog = new StealerLog(this);
		}
		return this._stealerLog;
	}

	get breached(): Breached {
		if (!this._breached) {
			this._breached = new Breached(this);
		}
		return this._breached;
	}

	get paste(): Paste {
		if (!this._paste) {
			this._paste = new Paste(this);
		}
		return this._paste;
	}

	/**
	 * Lazy-loaded access to password endpoints
	 */
	get passwords(): Passwords {
		if (!this._passwords) {
			this._passwords = new Passwords(this);
		}
		return this._passwords;
	}

	/**
	 * Get the user agent being used for requests
	 */
	getUserAgent(): string {
		return this.userAgent;
	}

	/**
	 * Get the base URL for password-related requests
	 */
	getPasswordsBaseUrl(): string {
		return this.passwordsBaseUrl;
	}

	/**
	 * Make a request to the Have I Been Pwned API with caching.
	 * @param path The path to request.
	 * @param options The options for the request, including optional query parameters.
	 * @returns The response from the API.
	 */
	async request(path: string, options: RequestOptions = {}): Promise<unknown> {
		// Try to get from cache first
		const cacheKey = path;
		const cachedData = await this.cacheManager.get(cacheKey, options.params);
		
		if (cachedData !== null) {
			return cachedData;
		}
		
		// If not in cache or expired, make the actual request
		const response = await this.requestNoCache(path, options);
		
		// Cache the response if it's not null
		if (response !== null) {
			await this.cacheManager.set(cacheKey, options.params, response);
		}
		
		return response;
	}
	
	/**
	 * Make a request to the Have I Been Pwned API without using the cache.
	 * Internal method that can be accessed by endpoint classes.
	 * 
	 * @param path The path to request.
	 * @param options The options for the request, including optional query parameters.
	 * @returns The response from the API.
	 */
	requestNoCache(path: string, options: RequestOptions = {}): Promise<unknown> {
		// Ensure the path doesn't start with a slash to avoid double slashes
		const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
		
		// Create a URL object to handle proper URL construction and encoding
		const url = new URL(normalizedPath, this.baseUrl);
		
		// Add query parameters if provided
		if (options.params) {
			Object.entries(options.params).forEach(([key, value]) => {
				if (value !== undefined) {
					url.searchParams.append(key, String(value));
				}
			});
			
			// Remove params from options to avoid sending it in the fetch request
			const { params, ...fetchOptions } = options;
			options = fetchOptions;
		}
		
		// Create a new Headers object for proper header handling
		const headers = new Headers();
		
		// Add our required headers
		headers.set("hibp-api-key", this.apiKey);
		headers.set("user-agent", this.userAgent);
		
		// Add any custom headers from options
		if (options.headers) {
			const customHeaders = options.headers as Record<string, string>;
			Object.entries(customHeaders).forEach(([key, value]) => {
				headers.set(key, value);
			});
		}
		
		// Remove headers from options to avoid conflicts
		const { headers: _, ...fetchOptions } = options;
		
		return fetch(url.toString(), {
			...fetchOptions,
			headers,
		}).then(response => {
			// Handle 404 responses specially - they indicate "not found" rather than an error
			if (response.status === 404) {
				return null;
			}
	
			// Handle other error responses
			this.handleErrorResponse(response);
	
			// If we've reached here, the response is OK
			if (response.status === 204) {
				// No content
				return null;
			}
	
			return response.json();
		});
	}

	/**
	 * Handle error responses from the API.
	 * @param response The response from the API.
	 * @throws Error if the response indicates an error.
	 */
	private handleErrorResponse(response: Response): void {
		if (response.ok) {
			return;
		}

		let errorMessage: string;

		switch (response.status) {
			case 400:
				errorMessage = "Bad request - The input does not comply with an acceptable format";
				break;
			case 401:
				errorMessage = "Unauthorized - Invalid API key";
				break;
			case 403:
				errorMessage = "Forbidden - No user agent has been specified in the request";
				break;
			case 429:
				errorMessage = "Too many requests - The rate limit has been exceeded";
				break;
			case 500:
				errorMessage = "Internal server error";
				break;
			case 503:
				errorMessage = "Service unavailable - The underlying service is not available";
				break;
			default:
				errorMessage = `Unexpected status code: ${response.status} ${response.statusText}`;
		}

		throw new Error(errorMessage);
	}

	/**
	 * Update the cache with the given data
	 * 
	 * @param path The path associated with the data
	 * @param params Parameters used for the request
	 * @param data Data to cache
	 */
	updateCache(path: string, params: Record<string, any> | undefined, data: unknown): Promise<void> {
		return this.cacheManager.set(path, params, data);
	}
}

class Breach extends EndpointBase {
	/**
	 * Get all breaches.
	 * @see https://haveibeenpwned.com/API/v3#AllBreaches
	 * @param options Options for the request.
	 * @returns All breaches.
	 */
	async all(options?: BreachAllOptions): Promise<BreachModel[]> {
		const { domain, isSpamList = false } = options ?? {};

		const response = await this.client.request("breaches", {
			method: "GET",
			params: {
				Domain: domain,
				IsSpamList: isSpamList,
			},
		});

		return response as BreachModel[];
	}
	
	/**
	 * Get a breach by name.
	 * @see https://haveibeenpwned.com/API/v3#SingleBreach
	 * @param name The name of the breach to get.
	 * @returns The breach.
	 */
	async name(name: string): Promise<BreachModel | null> {
		const response = await this.client.request(`breach/${encodeURIComponent(name)}`, {
			method: "GET",
		});

		return response as BreachModel | null;
	}

	/**
	 * Get the latest breach.
	 * @see https://haveibeenpwned.com/API/v3#LatestBreach
	 * @returns The latest breach.
	 */
	async latest(): Promise<BreachModel | null> {
		const response = await this.client.request("latestbreach", {
			method: "GET",
		});

		return response as BreachModel | null;
	}
}

class Data extends EndpointBase {
	async classes() {
		const response = await this.client.request("dataclasses", {
			method: "GET",
		});

		return response;
	}
}

/**
 * Breached-related API endpoints
 * @see https://haveibeenpwned.com/API/v3#BreachedAccount
 */
class Breached extends EndpointBase {
	// Store the latest breach date we've seen to avoid unnecessary requests
	private lastKnownBreachDate: string | null = null;
	
	/**
	 * Get breach information for a specific account
	 * @see https://haveibeenpwned.com/API/v3#BreachedAccount
	 * @param account The account (email address) to check
	 * @param options Options for the request
	 * @returns Information about breaches for the account, or null if none found
	 */
	async account(account: string = "all", options?: BreachedAccountOptions): Promise<BreachModel[] | null> {
		const { truncateResponse = true, domain, includeUnverified = false } = options ?? {};
		
		const response = await this.client.request(`breachedaccount/${encodeURIComponent(account)}`, {
			method: "GET",
			params: {
				truncateResponse,
				domain,
				// Use proper case per API documentation
				IncludeUnverified: includeUnverified,
			}
		});

		return response as BreachModel[] | null;
	}

	/**
	 * Get breach information for a specific domain
	 * @see https://haveibeenpwned.com/API/v3#BreachedDomain
	 * @param domain The domain to check
	 * @param forceFresh Whether to force a fresh request
	 * @returns Information about breaches for the domain, or null if none found
	 */
	async domain(domain: string, forceFresh = false): Promise<Map<string, string[]> | null> {
		// For domain searches, we want to follow the API docs recommendation:
		// "To optimise your querying, you can aggressively query the unauthenticated most recent breach API 
		// (it's heavily cached at Cloudflare) and once a new breach is seen, query the domain search API."
		
		if (!forceFresh) {
			// Get the latest breach to check if we need to refresh
			const latestBreach = await this.client.breach.latest();
			
			if (latestBreach?.AddedDate) {
				// If we have a previously known breach date and the latest breach date is the same,
				// we can safely use the cached data
				if (this.lastKnownBreachDate && this.lastKnownBreachDate >= latestBreach.AddedDate) {
					console.log("Latest breach hasn't changed, using cached data if available");
					
					// The regular request method will use the cache if available
					const response = await this.client.request(`breacheddomain/${encodeURIComponent(domain)}`, {
						method: "GET",
					});
					
					return response as Map<string, string[]> | null;
				}
				
				// Update our latest known breach date
				this.lastKnownBreachDate = latestBreach.AddedDate;
				console.log(`New breach detected, fetching fresh data. Latest breach date: ${latestBreach.AddedDate}`);
			}
		}
		
		// If we're here, either forceFresh was true or we detected a new breach
		// Bypass cache and get fresh data
		const path = `breacheddomain/${encodeURIComponent(domain)}`;
		const response = await this.requestNoCache(path, {
			method: "GET",
		});
		
		// Store in cache for future requests
		await this.updateCache(path, undefined, response);
		
		return response as Map<string, string[]> | null;
	}
}

/**
 * Stealer log-related API endpoints
 * @see https://haveibeenpwned.com/API/v3#StealerLogsOverview
 */
class StealerLog extends EndpointBase {
	/**
	 * Get stealer log information for a specific email address
	 * @see https://haveibeenpwned.com/API/v3#StealerLogsForEmail
	 * @param email The email address to check
	 * @returns Information about websites where the email's credentials were stolen, or null if none found
	 */	
	async email(email: string): Promise<string[] | null> {
		const response = await this.client.request(`stealerlogsbyemail/${encodeURIComponent(email)}`, {
			method: "GET",
		});

		return response as string[] | null;
	}

	/**
	 * Get stealer log information for a specific website domain
	 * @see https://haveibeenpwned.com/API/v3#StealerLogsByWebsiteDomain
	 * @param domain The website domain to check
	 * @returns Information about websites where the email's credentials were stolen, or null if none found
	 */	
	async website(domain: string): Promise<string[] | null> {
		const response = await this.client.request(`stealerlogsbywebsitedomain/${encodeURIComponent(domain)}`, {
			method: "GET",
		});

		return response as string[] | null;
	}

	/**
	 * Get stealer log information for a specific email domain
	 * @see https://haveibeenpwned.com/API/v3#StealerLogsByEmailDomain
	 * @param domain The email domain to check
	 * @returns Information about websites where the email's credentials were stolen, or null if none found
	 */	
	async emailDomain(domain: string): Promise<Map<string, string[]> | null> {
		const response = await this.client.request(`stealerlogsbyemaildomain/${encodeURIComponent(domain)}`, {
			method: "GET",
		});

		return response as Map<string, string[]> | null;
	}
}

/**
 * Paste-related API endpoints
 * @see https://haveibeenpwned.com/API/v3#PasteModel
 */
class Paste extends EndpointBase {
	/**
	 * Get paste information for a specific account
	 * @see https://haveibeenpwned.com/API/v3#PasteAccount
	 * @param email The email address to check
	 * @returns Information about pastes for the account, or null if none found
	 */
	async account(email: string): Promise<PasteModel[] | null> {
		const response = await this.client.request(`pasteaccount/${encodeURIComponent(email)}`, {
			method: "GET",
		});

		return response as PasteModel[] | null;
	}
}

/**
 * Subscription-related API endpoints
 */
class Subscription extends EndpointBase {
	/**
	 * Get the subscription status for the API key.
	 * @see https://haveibeenpwned.com/API/v3#SubscriptionStatus
	 * @returns The subscription status for the API key.
	 */
	async status(): Promise<SubscriptionStatusResponse> {
		const response = await this.client.request("subscription/status", {
			method: "GET",
		});

		return response as SubscriptionStatusResponse;
	}

	/**
	 * Get the subscribed domains for the API key.
	 * @see https://haveibeenpwned.com/API/v3#SubscribedDomains
	 * @returns The subscribed domains for the API key.
	 */	
	async domains(): Promise<SubscribedDomainsResponse[]> {
		const response = await this.client.request("subscribeddomains", {
			method: "GET",
		});

		return response as SubscribedDomainsResponse[];
	}
}

/**
 * Password-related API endpoints
 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
class Passwords extends EndpointBase {
	/**
	 * Check if a password has been found in a data breach using the k-Anonymity model.
	 * Only the first 5 characters of the hash are sent to the API.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
	 * @param passwordHash - The SHA-1 or NTLM hash of the password to check
	 * @param options - Options for the request
	 * @returns The number of times the password appears in the data set, or 0 if not found
	 */
	async range(
		passwordHash: string, 
		options?: { 
			addPadding?: boolean; 
			mode?: 'ntlm' | 'sha1';
		}
	): Promise<number> {
		const { addPadding = false, mode } = options ?? {};
		
		// Ensure the hash is at least 5 characters long
		if (passwordHash.length < 5) {
			throw new Error("Password hash must be at least 5 characters long");
		}
		
		// Extract the prefix and suffix
		const prefix = passwordHash.substring(0, 5).toUpperCase();
		const suffix = passwordHash.substring(5).toUpperCase();
		
		// Prepare query parameters if mode is specified
		const queryParams = mode === 'ntlm' ? { mode: 'ntlm' } : undefined;
		
		// Prepare headers for padding
		const headers: Record<string, string> = {};
		if (addPadding) {
			headers['Add-Padding'] = 'true';
		}
		
		// Make the request to the passwords API
		const response = await this.requestPasswordsApi(`range/${prefix}`, {
			queryParams,
			headers
		});
		
		// If no ranges were found (shouldn't happen according to docs, but just in case)
		if (!response) {
			return 0;
		}
		
		// Parse the response to find the matching suffix
		const responseText = response as string;
		const lines = responseText.split('\n');
		
		// Look for our suffix in the response
		for (const line of lines) {
			// Skip empty lines
			if (!line.trim()) continue;
			
			const [hashSuffix, countStr] = line.split(':');
			
			// Skip padded entries (they always have count 0)
			if (countStr.trim() === '0' && addPadding) {
				continue;
			}
			
			if (hashSuffix === suffix) {
				return parseInt(countStr.trim(), 10);
			}
		}
		
		// If we didn't find the suffix, the password hasn't been pwned
		return 0;
	}
	
	/**
	 * Check if a password has been found in a data breach.
	 * This is a convenience method that creates a hash of the password
	 * and checks if it appears in the Pwned Passwords database.
	 * 
	 * @param password The plaintext password to check
	 * @param options Options for the request
	 * @returns The number of times the password appears in the data set, or 0 if not found
	 */
	async check(
		password: string, 
		options?: { 
			addPadding?: boolean; 
			mode?: 'ntlm' | 'sha1';
		}
	): Promise<number> {
		const { mode = 'sha1' } = options ?? {};
		
		// Create the appropriate hash of the password
		let passwordHash: string;
		if (mode === 'ntlm') {
			// For NTLM, we might need to implement an NTLM hash function
			// or use a library. For now, throw an error.
			throw new Error('NTLM hash generation is not implemented. Please provide a pre-computed NTLM hash to the range method.');
		} else {
			// Default to SHA-1
			passwordHash = await this.sha1(password);
		}
		
		// Check if the hash appears in the Pwned Passwords database
		return this.range(passwordHash, options);
	}
	
	/**
	 * Create a SHA-1 hash of a string.
	 * 
	 * @param text The text to hash
	 * @returns The SHA-1 hash of the text
	 */
	private async sha1(text: string): Promise<string> {
		// Convert the string to a Uint8Array
		const encoder = new TextEncoder();
		const data = encoder.encode(text);
		
		// Hash the data
		const hashBuffer = await crypto.subtle.digest('SHA-1', data);
		
		// Convert the hash to a hex string
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		
		return hashHex.toUpperCase();
	}
	
	/**
	 * Make a request to the Pwned Passwords API.
	 * This is similar to the main request method but handles the different base URL and response format.
	 * 
	 * @param path The path to request
	 * @param options Options for the request including headers and query parameters
	 * @returns The response as text
	 */
	private async requestPasswordsApi(
		path: string, 
		options?: { 
			queryParams?: Record<string, string>;
			headers?: Record<string, string>;
		}
	): Promise<string> {
		const { queryParams, headers: customHeaders } = options ?? {};
		
		// Ensure the path doesn't start with a slash to avoid double slashes
		const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
		
		// Create a URL object to handle proper URL construction and encoding
		const url = new URL(normalizedPath, this.client.getPasswordsBaseUrl());
		
		// Add query parameters if provided
		if (queryParams) {
			Object.entries(queryParams).forEach(([key, value]) => {
				url.searchParams.append(key, value);
			});
		}
		
		// Create headers with required user agent but no API key (Passwords API doesn't use an API key)
		const headers = new Headers({
			"user-agent": this.client.getUserAgent()
		});
		
		// Add any custom headers
		if (customHeaders) {
			Object.entries(customHeaders).forEach(([key, value]) => {
				headers.set(key, value);
			});
		}
		
		// Make the request
		const response = await fetch(url.toString(), {
			method: "GET",
			headers,
		});
		
		// Handle error responses
		if (!response.ok) {
			let errorMessage: string;
			
			switch (response.status) {
				case 429:
					errorMessage = "Too many requests - The rate limit has been exceeded";
					break;
				case 500:
					errorMessage = "Internal server error";
					break;
				case 503:
					errorMessage = "Service unavailable - The underlying service is not available";
					break;
				default:
					errorMessage = `Unexpected status code: ${response.status} ${response.statusText}`;
			}
			
			throw new Error(errorMessage);
		}
		
		// Return the response as text
		return response.text();
	}
}