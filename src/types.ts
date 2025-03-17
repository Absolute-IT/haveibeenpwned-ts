/**
 * Request options for the HIBP API
 */
export interface RequestOptions extends RequestInit {
	params?: Record<string, string | boolean | number | undefined>;
	/**
	 * HTTP status codes that should not cause an error to be thrown
	 */
	ignoreStatusCodes?: number[];
}

/**
 * Options for configuring the HaveIBeenPwned client
 */
export interface HaveIBeenPwnedOptions {
	/**
	 * Base URL for the API
	 */
	baseUrl?: string;
	
	/**
	 * User agent to use for requests
	 */
	userAgent?: string;
	
	/**
	 * Base URL for the passwords API
	 */
	passwordsBaseUrl?: string;
	
	/**
	 * Cache configuration
	 */
	cache?: CacheOptions;
}

/**
 * Options for configuring the cache
 */
export interface CacheOptions {
	/**
	 * Whether to enable caching
	 * @default true
	 */
	enabled?: boolean;
	
	/**
	 * Directory to store cache files
	 * If not specified, the default platform-specific cache directory will be used
	 */
	directory?: string;
	
	/**
	 * Time to live in milliseconds
	 * If not specified, cache will be invalidated based on the latest breach date
	 */
	ttl?: number;
}

/**
 * Cache configuration used internally by the cache manager
 */
export interface CacheConfig {
	/**
	 * Whether to enable caching
	 * @default true
	 */
	enabled: boolean;
	
	/**
	 * Directory to store cache files
	 * If not specified, the default platform-specific cache directory will be used
	 */
	directory?: string;
	
	/**
	 * Time to live in milliseconds
	 * If not specified, cache will be invalidated based on the latest breach date
	 */
	ttl?: number;
}

/**
 * Metadata about a cached item
 */
export interface CacheMetadata {
	/**
	 * Timestamp when the cache was created
	 */
	timestamp: number;
	
	/**
	 * Latest breach date when the cache was created
	 */
	latestBreachAddedDate?: string;
}

/**
 * Structure of a cached item
 */
export interface CacheItem<T> {
	/**
	 * The cached data
	 */
	data: T;
	
	/**
	 * Metadata about the cached item
	 */
	metadata: CacheMetadata;
}

/**
 * Represents a breach from the HIBP API
 * @see https://haveibeenpwned.com/API/v3#BreachModel
 * @example
 * ```json
 * {
 * 	Name: "Adobe",
 * 	Title: "Adobe",
 * 	Domain: "adobe.com",	
 * 	BreachDate: "2013-10-03",
 * 	AddedDate: "2013-10-03",
 * 	ModifiedDate: "2013-10-03",
 * 	PwnCount: 1000000,
 * 	Description: "Adobe was breached in 2013",
 * 	IsVerified: true,
 * 	IsFabricated: false,
 * 	IsSensitive: false,
 * 	IsRetired: false,
 * 	IsSpamList: false,
 * 	IsMalware: false,
 * 	IsSubscriptionFree: false,
 * 	IsStealerLog: false,
 * }
 * ```
 */
export interface BreachModel {
	/** The name of the breach */
	Name: string;
	/** The title of the breach */
	Title?: string;
	/** The domain of the breached site */
	Domain?: string;
	/** The date the breach occurred */
	BreachDate?: string;
	/** The date the breach was added to HIBP */
	AddedDate?: string;
	/** The date the breach was modified */
	ModifiedDate?: string;
	/** The number of accounts affected by the breach */
	PwnCount?: number;
	/** HTML description of the breach */
	Description?: string;
	/** URL to the logo of the breached site */
	LogoPath?: string;
	/** Types of data included in the breach */
	DataClasses?: string[];
	/** Whether the breach has been verified */
	IsVerified?: boolean;
	/** Whether the breach has been fabricated */
	IsFabricated?: boolean;
	/** Whether the breach contains sensitive data */
	IsSensitive?: boolean;
	/** Whether the breach has been retired */
	IsRetired?: boolean;
	/** Whether the breach is from a spam list */
	IsSpamList?: boolean;
	/** Whether the breach is from malware */
	IsMalware?: boolean;
	/** Whether the breach is available to free subscribers */
	IsSubscriptionFree?: boolean;
	/** Whether the breach is from a stealer log */
	IsStealerLog?: boolean;
}

/**
 * Represents a paste from the HIBP API
 * @see https://haveibeenpwned.com/API/v3#PasteModel
 * @example
 * ```json
 * {
 * 	Source: "Pastebin",
 * 	Id: "1234567890",
 * 	Title: "Paste Title",
 * 	Date: "2021-01-01T00:00:00Z",
 * 	EmailCount: 100,
 * }
 * ```
 */
export interface PasteModel {
	Source: string;
	Id: string;
	Title?: string;
	Date?: Date;
	EmailCount: number;
}

/**
 * Options for the breached all endpoint	
 * @see https://haveibeenpwned.com/API/v3#BreachAll
 * @example
 * ```ts
 * const data = await hibp.breached.all({
 * 	domain: "example.com",
 * 	isSpamList: true,
 * });
 * ```
 */
export interface BreachAllOptions {
	// The domain to filter by
	domain?: string;
	// Whether to include spam list breaches
	isSpamList?: boolean;
}

/**
 * Options for the breached account endpoint
 * @see https://haveibeenpwned.com/API/v3#BreachedAccount
 * @example
 * ```ts
 * const data = await hibp.breached.account("all", {
 * 	truncateResponse: false,
 * 	domain: "example.com",
 * 	includeUnverified: true,
 * });
 * ```
 */
export interface BreachedAccountOptions {
	// Whether to truncate the response
	truncateResponse?: boolean;
	// The domain to filter by
	domain?: string;
	// Whether to include unverified breaches
	includeUnverified?: boolean;
}

/**
 * The response from the subscription status endpoint.
 * @see https://haveibeenpwned.com/API/v3#SubscriptionStatus
 * @example
 * ```json
 * {
 * 	SubscribedUntil: '2025-03-28T06:49:17',
 * 	SubscriptionName: 'Pwned 5',
 * 	Description: 'Domains with unlimited breached addresses, a rate limited API key allowing 1000 email address searches per minute and stealer log searches',
 * 	DomainSearchMaxBreachedAccounts: null,
 * 	Rpm: 1000
 * }
 * ```
 */
export interface SubscriptionStatusResponse {
	SubscribedUntil: string;
	SubscriptionName: string;
	Description: string;
	DomainSearchMaxBreachedAccounts: number | null;
	Rpm: number;
}

/**
 * The response from the subscribed domains endpoint.
 * @see https://haveibeenpwned.com/API/v3#SubscribedDomains
 * @example
 * ```json
 * {
 * 	DomainName: "example.com",
 * 	PwnCount: 1000000,
 * 	PwnCountExcludingSpamLists: 1000000,
 * 	PwnCountExcludingSpamListsAtLastSubscriptionRenewal: 1000000,
 * 	NextSubscriptionRenewal: "2025-03-28T06:49:17",
 * }
 * ```
 */
export interface SubscribedDomainsResponse {
	DomainName: string;
	PwnCount: number;
	PwnCountExcludingSpamLists: number;
	PwnCountExcludingSpamListsAtLastSubscriptionRenewal: number;
	NextSubscriptionRenewal: string;
}
