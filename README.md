# Have I Been Pwned API Client

[![Version](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/Zei33/ea274423cad68ec583a39cd12d8f9441/raw/wanikani-api-version.json)](https://github.com/Zei33/wanikani-api/releases)
[![License](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/Zei33/ea274423cad68ec583a39cd12d8f9441/raw/wanikani-api-license.json)](https://github.com/Zei33/wanikani-api/blob/main/LICENSE.md)
[![Build](https://github.com/Zei33/wanikani-api/actions/workflows/ci.yml/badge.svg)](https://github.com/Zei33/wanikani-api/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/Zei33/ea274423cad68ec583a39cd12d8f9441/raw/wanikani-api-junit-tests.json)](https://github.com/Zei33/wanikani-api/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/Zei33/ea274423cad68ec583a39cd12d8f9441/raw/wanikani-api-lcov-coverage.json)](https://github.com/Zei33/wanikani-api/actions/workflows/ci.yml)

A comprehensive and type-safe TypeScript client for the [Have I Been Pwned (HIBP) API v3](https://haveibeenpwned.com/API/v3).

## Features

- 📚 Complete coverage of HIBP API v3 endpoints
- 🔑 Secure API key handling
- ⚡ Intelligent caching for improved performance
- 🔄 Automatic cache invalidation based on latest breach date
- 💾 Persistent caching with configurable TTL
- 🔒 Support for password breach checking (k-Anonymity)
- 📱 TypeScript types for all API responses
- ⚙️ Configurable user agent, API URLs, and caching behavior

## Installation

```bash
# Using npm
npm install haveibeenpwned

# Using yarn
yarn add haveibeenpwned

# Using pnpm
pnpm install haveibeenpwned
```

## Usage

```typescript
import HaveIBeenPwned from 'haveibeenpwned';

// Initialize the client with your API key
const hibp = new HaveIBeenPwned('your-api-key');

// Check if an account has been breached
const breaches = await hibp.breached.account('user@example.com');
console.log(breaches);

// Check if a password has been compromised
const timesPasswordPwned = await hibp.passwords.check('password123');
console.log(`This password has been seen ${timesPasswordPwned} times in data breaches`);
```

## API Reference

### Client Initialization

```typescript
import HaveIBeenPwned from 'haveibeenpwned';

// Basic initialization
const hibp = new HaveIBeenPwned('your-api-key');

// Advanced initialization with options
const hibp = new HaveIBeenPwned('your-api-key', {
	baseUrl: 'https://haveibeenpwned.com/api/v3/', // Custom API base URL
	userAgent: 'MyApp/1.0', // Custom User-Agent header
	passwordsBaseUrl: 'https://api.pwnedpasswords.com/', // Custom passwords API URL
	cache: {
		enabled: true, // Enable/disable caching
		directory: '/custom/cache/path', // Custom cache directory
		ttl: 86400000 // Custom TTL in milliseconds (24 hours)
	}
});
```

### Breaches

#### Get All Breaches

[API Documentation: AllBreaches](https://haveibeenpwned.com/API/v3#AllBreaches)

```typescript
// Get all breaches
const allBreaches = await hibp.breach.all();

// Filter breaches by domain
const domainBreaches = await hibp.breach.all({ domain: 'adobe.com' });

// Exclude spam list breaches
const nonSpamBreaches = await hibp.breach.all({ isSpamList: false });
```

#### Get a Single Breach

[API Documentation: SingleBreach](https://haveibeenpwned.com/API/v3#SingleBreach)

```typescript
// Get breach by name
const breach = await hibp.breach.name('Adobe');
```

#### Get Latest Breach

[API Documentation: LatestBreach](https://haveibeenpwned.com/API/v3#LatestBreach)

```typescript
// Get the most recently added breach
const latestBreach = await hibp.breach.latest();
```

### Breached Accounts

[API Documentation: BreachedAccount](https://haveibeenpwned.com/API/v3#BreachedAccount)

```typescript
// Check if an account has been breached
const breaches = await hibp.breached.account('user@example.com');

// Include unverified breaches
const allBreaches = await hibp.breached.account('user@example.com', { 
	includeUnverified: true 
});

// Filter by domain
const domainBreaches = await hibp.breached.account('user@example.com', { 
	domain: 'adobe.com' 
});

// Truncate the response (reduces API request size)
const truncatedBreaches = await hibp.breached.account('user@example.com', { 
	truncateResponse: true 
});
```

### Domain Searches

[API Documentation: BreachedDomain](https://haveibeenpwned.com/API/v3#BreachedDomain)

```typescript
// Search for breached email addresses in a domain
const domainResults = await hibp.breached.domain('example.com');
// Returns a Map of email addresses to breach names
```

### Stealer Logs

[API Documentation: StealerLogsOverview](https://haveibeenpwned.com/API/v3#StealerLogsOverview)

```typescript
// Check if an email is in a stealer log
const stealerLogs = await hibp.stealerLog.email('user@example.com');

// Check if a website appears in stealer logs
const websiteLogs = await hibp.stealerLog.website('example.com');

// Check if an email domain appears in stealer logs
const emailDomainLogs = await hibp.stealerLog.emailDomain('example.com');
```

### Pastes

[API Documentation: PasteAccount](https://haveibeenpwned.com/API/v3#PasteAccount)

```typescript
// Get pastes for an account
const pastes = await hibp.paste.account('user@example.com');
```

### Passwords

[API Documentation: PwnedPasswords](https://haveibeenpwned.com/API/v3#PwnedPasswords)

```typescript
// Check if a password has been compromised
const timesPasswordPwned = await hibp.passwords.check('password123');

// Check if a password hash has been compromised (SHA-1)
const timesHashPwned = await hibp.passwords.range('5BAA6');

// Advanced options
const timesPasswordPwned = await hibp.passwords.check('password123', {
	addPadding: true, // Add padding to the response (for privacy)
	mode: 'ntlm' // Use NTLM hashing instead of SHA-1
});
```

### Subscription Status

[API Documentation: SubscriptionStatus](https://haveibeenpwned.com/API/v3#SubscriptionStatus)

```typescript
// Get subscription status
const status = await hibp.subscription.status();

// Get subscribed domains
const domains = await hibp.subscription.domains();
```

### Data Classes

[API Documentation: DataClasses](https://haveibeenpwned.com/API/v3#DataClasses)

```typescript
// Get all data classes
const dataClasses = await hibp.data.classes();
```

## Caching

The client includes intelligent caching to reduce API calls and improve performance. By default, cache files are stored in a platform-specific directory and are invalidated when a new breach is detected.

```typescript
// Configure caching
hibp.configureCaching({
	enabled: true,
	directory: '/custom/cache/path',
	ttl: 3600000 // 1 hour
});

// Clear the cache
await hibp.clearCache();
```

## Error Handling

The client throws descriptive errors for various API responses:

```typescript
try {
	const breaches = await hibp.breached.account('user@example.com');
	// Process breaches
} catch (error) {
	if (error.message.includes('401')) {
		console.error('Invalid API key');
	} else if (error.message.includes('429')) {
		console.error('Rate limit exceeded');
	} else {
		console.error('An error occurred:', error.message);
	}
}
```

## License

GPL-3.0-or-later

## Author

Matthew Scott

