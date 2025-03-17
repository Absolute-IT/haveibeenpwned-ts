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
 * Base class for API endpoint wrappers.
 * Provides common functionality for all endpoint classes.
 */
abstract class EndpointBase {
	/**
	 * Create a new endpoint instance.
	 * 
	 * @param client - The HaveIBeenPwned client instance
	 */
	constructor(protected readonly client: HaveIBeenPwned) {}
	
	/**
	 * Make a request to the API without using the cache.
	 * 
	 * @param path - The path to request
	 * @param options - The options for the request
	 * @returns The response from the API
	 */
	protected async requestNoCache(path: string, options: RequestOptions = {}): Promise<unknown> {
		return this.client.requestNoCache(path, options);
	}
	
	/**
	 * Update the cache with data.
	 * 
	 * @param path - The path used for the request
	 * @param params - The parameters used for the request
	 * @param data - The data to cache
	 */
	protected async updateCache(path: string, params: Record<string, any> | undefined, data: unknown): Promise<void> {
		return this.client.updateCache(path, params, data);
	}
}

/**
 * Have I Been Pwned API client.
 * Provides methods to interact with the Have I Been Pwned API.
 * 
 * @see https://haveibeenpwned.com/API/v3
 *
 * @example
 * ```ts
 * // Basic usage with default configuration
 * const hibp = new HaveIBeenPwned(process.env.API_KEY!);
 * const status = await hibp.subscription.status();
 * 
 * // Usage with custom options and caching configuration
 * const hibpCustom = new HaveIBeenPwned(process.env.API_KEY!, {
 *   baseUrl: "https://haveibeenpwned.com/api/v3/",
 *   userAgent: "MyApp/1.0",
 *   cache: {
 *     enabled: true,
 *     ttl: 3600000 // 1 hour
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
	 * 
	 * @param apiKey - The API key to use for the client
	 * @param options - Additional options for the client
	 * @throws Error if no API key is provided
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
	}
	
	/**
	 * Configure caching options for the client.
	 * 
	 * @param options - Cache configuration options
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
	 * Check for the latest breach and update cache invalidation date.
	 * This is called automatically by the client when needed.
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
	 * Clear all cached data.
	 */
	async clearCache(): Promise<void> {
		await this.cacheManager.clearCache();
	}
	
	/**
	 * Get the subscription endpoint instance.
	 * @returns The subscription endpoint instance
	 */
	get subscription(): Subscription {
		if (!this._subscription) {
			this._subscription = new Subscription(this);
		}
		return this._subscription;
	}

	/**
	 * Get the breach endpoint instance.
	 * @returns The breach endpoint instance
	 */
	get breach(): Breach {
		if (!this._breach) {
			this._breach = new Breach(this);
		}
		return this._breach;
	}

	/**
	 * Get the data endpoint instance.
	 * @returns The data endpoint instance
	 */
	get data(): Data {
		if (!this._data) {
			this._data = new Data(this);
		}
		return this._data;
	}

	/**
	 * Get the stealer log endpoint instance.
	 * @returns The stealer log endpoint instance
	 */
	get stealerLog(): StealerLog {
		if (!this._stealerLog) {
			this._stealerLog = new StealerLog(this);
		}
		return this._stealerLog;
	}

	/**
	 * Get the breached account endpoint instance.
	 * @returns The breached account endpoint instance
	 */
	get breached(): Breached {
		if (!this._breached) {
			this._breached = new Breached(this);
		}
		return this._breached;
	}

	/**
	 * Get the paste endpoint instance.
	 * @returns The paste endpoint instance
	 */
	get paste(): Paste {
		if (!this._paste) {
			this._paste = new Paste(this);
		}
		return this._paste;
	}

	/**
	 * Get the passwords endpoint instance.
	 * @returns The passwords endpoint instance
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
	 * Make a request to the Have I Been Pwned API.
	 * First attempts to retrieve from cache, then falls back to live API request if needed.
	 * 
	 * @param path - The path to request
	 * @param options - The options for the request, including optional query parameters
	 * @returns The response from the API or cache
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
	 * @param path - The path to request
	 * @param options - The options for the request, including optional query parameters
	 * @returns The response from the API
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
			Object.entries(options.headers).forEach(([key, value]) => {
				headers.set(key, value);
			});
		}
		
		// Final options for fetch
		const fetchOptions: RequestInit = {
			...options,
			headers
		};
		
		return fetch(url.toString(), fetchOptions)
			.then(response => {
				// Handle common error responses
				if (!response.ok) {
					// In the Have I Been Pwned API, 404 always indicates "not found" (empty result set)
					// So we should return null rather than throwing an error
					if (response.status === 404) {
						return null;
					}
					
					// Handle other non-error status codes if they're in the ignore list
					const ignoreStatusCodes = options.ignoreStatusCodes || [];
					if (ignoreStatusCodes.includes(response.status)) {
						// Handle 204 No Content
						if (response.status === 204) {
							return null;
						}
						
						// Handle other ignored status codes
						return null;
					}
					
					// Otherwise, handle the error
					this.handleErrorResponse(response);
				}
				
				// For successful responses, try to parse as JSON
				return response.text().then(text => {
					// If the response is empty or whitespace only, return null
					if (!text || text.trim() === "") {
						return null;
					}
					
					try {
						// Try to parse as JSON
						return JSON.parse(text);
					} catch (e) {
						// If it's not valid JSON, return the text as-is
						return text;
					}
				});
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

/**
 * Breach-related API endpoints.
 * Provides methods to get information about specific breaches.
 * 
 * @see https://haveibeenpwned.com/API/v3#BreachesForASingleSite
 */
class Breach extends EndpointBase {
	/**
	 * Get all breaches in the system.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#AllBreaches
	 * @param options - Options for filtering the breaches
	 * @param options.domain - Filter by domain
	 * @param options.isSpamList - Filter by whether the breach is from a spam list
	 * @returns An array of breaches
	 */
	async all(options?: BreachAllOptions): Promise<BreachModel[]> {
		const { domain, isSpamList } = options ?? {};
		
		const response = await this.client.request("breaches", {
			method: "GET",
			params: {
				domain,
				isSpamList
			}
		});

		return response as BreachModel[];
	}

	/**
	 * Get a specific breach by name.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#SingleBreach
	 * @param name - The name of the breach to get
	 * @returns The breach details or null if not found
	 */
	async name(name: string): Promise<BreachModel | null> {
		const response = await this.client.request(`breach/${encodeURIComponent(name)}`, {
			method: "GET",
		});

		return response as BreachModel | null;
	}

	/**
	 * Get the latest breach.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#LatestBreach
	 * @returns The latest breach or null if none found
	 */
	async latest(): Promise<BreachModel | null> {
		const response = await this.client.request("latestbreach", {
			method: "GET",
		});

		return response as BreachModel | null;
	}
}

/**
 * Data class-related API endpoints.
 * Provides methods to get information about data classes found in breaches.
 * 
 * @see https://haveibeenpwned.com/API/v3#AllDataClasses
 */
class Data extends EndpointBase {
	/**
	 * Get all data classes in the system.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#AllDataClasses
	 * @returns An array of data classes
	 */
	async classes() {
		const response = await this.client.request("dataclasses", {
			method: "GET",
		});

		return response;
	}
}

/**
 * Breached account-related API endpoints.
 * Provides methods to check if accounts or domains have been found in data breaches.
 * 
 * @see https://haveibeenpwned.com/API/v3#BreachedAccount
 */
class Breached extends EndpointBase {
	// Store the latest breach date we've seen to avoid unnecessary requests
	private lastKnownBreachDate: string | null = null;
	
	/**
	 * Get breach information for a specific account.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#BreachedAccount
	 * @param account - The account (email address) to check
	 * @param options - Options for the request
	 * @param options.truncateResponse - Whether to truncate the response
	 * @param options.domain - Filter by domain
	 * @param options.includeUnverified - Whether to include unverified breaches
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
	 * Get breach information for a specific domain.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#BreachedDomain
	 * @param domain - The domain to check
	 * @param forceFresh - Whether to force a fresh request instead of using cached data
	 * @returns Information about breaches for the domain as a map of email to breach names, or null if none found
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
					// The regular request method will use the cache if available
					const response = await this.client.request(`breacheddomain/${encodeURIComponent(domain)}`, {
						method: "GET",
					});
					
					return response as Map<string, string[]> | null;
				}
				
				// Update our latest known breach date
				this.lastKnownBreachDate = latestBreach.AddedDate;
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
 * Stealer log-related API endpoints.
 * Provides methods to check if accounts or domains have been found in malware stealer logs.
 * 
 * @see https://haveibeenpwned.com/API/v3#StealerLogsOverview
 */
class StealerLog extends EndpointBase {
	/**
	 * Get stealer log information for a specific email address.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#StealerLogsForEmail
	 * @param email - The email address to check
	 * @returns An array of stealer log names containing the email, or null if none found
	 */
	async email(email: string): Promise<string[] | null> {
		const response = await this.client.request(`stealerlogsbyemail/${encodeURIComponent(email)}`, {
			method: "GET",
		});

		return response as string[] | null;
	}

	/**
	 * Get stealer log information for a specific website domain.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#StealerLogsForWebsite
	 * @param domain - The domain to check
	 * @returns An array of stealer log names containing credentials for the domain, or null if none found
	 */
	async website(domain: string): Promise<string[] | null> {
		const response = await this.client.request(`stealerlogsbywebsitedomain/${encodeURIComponent(domain)}`, {
			method: "GET",
		});

		return response as string[] | null;
	}

	/**
	 * Get stealer log information for all emails from a specific domain.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#StealerLogsForEmailDomain
	 * @param domain - The email domain to check
	 * @returns A map of emails to stealer log names containing them, or null if none found
	 */
	async emailDomain(domain: string): Promise<Map<string, string[]> | null> {
		const response = await this.client.request(`stealerlogsbyemaildomain/${encodeURIComponent(domain)}`, {
			method: "GET",
		});

		return response as Map<string, string[]> | null;
	}
}

/**
 * Paste-related API endpoints.
 * Provides methods to check if accounts have been found in pastes from paste sites.
 * 
 * @see https://haveibeenpwned.com/API/v3#Pastes
 */
class Paste extends EndpointBase {
	/**
	 * Get paste information for a specific email address.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#PastesForAccount
	 * @param email - The email address to check
	 * @returns Information about pastes containing the email, or null if none found
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
 * Password-related API endpoints.
 * Provides methods to check if passwords have been exposed in data breaches.
 * 
 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
class Passwords extends EndpointBase {
	/**
	 * Check if a password hash has been found in a data breach using the k-Anonymity model.
	 * Only the first 5 characters of the hash are sent to the API.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
	 * @param passwordHash - The SHA-1 or NTLM hash of the password to check
	 * @param options - Options for the request
	 * @param options.addPadding - Whether to add padding to the response to prevent traffic analysis
	 * @param options.mode - The hash mode, either 'sha1' (default) or 'ntlm'
	 * @returns The number of times the password appears in the data set, or 0 if not found
	 * @throws Error if the password hash is less than 5 characters
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
	 * This is a convenience method that hashes the password and then checks the hash.
	 * 
	 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
	 * @param password - The plaintext password to check
	 * @param options - Options for the request
	 * @param options.addPadding - Whether to add padding to the response to prevent traffic analysis
	 * @param options.mode - The hash mode, either 'sha1' (default) or 'ntlm'
	 * @returns The number of times the password appears in the data set, or 0 if not found
	 * @throws Error if NTLM hash mode is requested (not implemented)
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
	 * @param text - The text to hash
	 * @returns The SHA-1 hash of the text in uppercase hexadecimal
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
		// Ensure the path doesn't start with a slash to avoid double slashes
		const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
		
		// Create a URL object to handle proper URL construction and encoding
		const url = new URL(normalizedPath, this.client.getPasswordsBaseUrl());
		
		// Add query parameters if provided
		if (options?.queryParams) {
			Object.entries(options.queryParams).forEach(([key, value]) => {
				url.searchParams.append(key, value);
			});
		}
		
		// Create headers
		const normalizedHeaders = new Headers({
			"user-agent": this.client.getUserAgent(),
		});
		
		// Add any custom headers from options
		if (options?.headers) {
			Object.entries(options.headers).forEach(([key, value]) => {
				normalizedHeaders.set(key, value);
			});
		}
		
		// Make the request
		const response = await fetch(url.toString(), {
			method: "GET",
			headers: normalizedHeaders
		});
		
		// Handle errors
		if (!response.ok) {
			// In the Have I Been Pwned API, 404 always indicates "not found" (empty result set)
			if (response.status === 404) {
				return "";
			}
			
			// Throw an error with status information for other error codes
			throw new Error(`Passwords API request failed: ${response.status} ${response.statusText}`);
		}
		
		// Return the response text
		return response.text();
	}
}