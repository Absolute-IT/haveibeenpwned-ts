# Have I Been Pwned API Tests

This directory contains test files for the Have I Been Pwned API client. The tests are divided into two categories:

1. **Unit Tests** - These mock the API responses and test the client functionality without making real API calls.
2. **Live API Tests** - These make real API calls to the Have I Been Pwned API using test accounts.

## Running the Tests

### Unit Tests

To run all the unit tests:

```bash
npm test
```

### Live API Tests

The live API tests are disabled by default to prevent accidental API calls. To run them, you need to:

1. Set your API key in the `.env` file or as an environment variable:

```bash
# In .env file
API_KEY=your-hibp-api-key
```

2. Enable the live tests by setting the `ENABLE_LIVE_TESTS` environment variable:

```bash
# Run all tests including live API tests
ENABLE_LIVE_TESTS=true npm test

# Run only the integration tests
ENABLE_LIVE_TESTS=true npx jest Integration

# Run only the live API examples
ENABLE_LIVE_TESTS=true npx jest LiveApiExamples
```

## Test Accounts

The live API tests use special test accounts on the domain `hibp-integration-tests.com`. These accounts are designed to demonstrate different behaviors of the API:

| Account | Description |
|---------|-------------|
| account-exists@hibp-integration-tests.com | Returns one breach and one paste |
| multiple-breaches@hibp-integration-tests.com | Returns three breaches |
| not-active-and-active-breach@hibp-integration-tests.com | Returns one breach (Adobe). An inactive breach also exists in the underlying data |
| not-active-breach@hibp-integration-tests.com | Returns no breaches. An inactive breach exists in the underlying data |
| opt-out@hibp-integration-tests.com | Returns no breaches/pastes. This account is opted out of both in the underlying data |
| opt-out-breach@hibp-integration-tests.com | Returns no breaches/pastes. This account is opted out of breaches in the underlying data |
| paste-sensitive-breach@hibp-integration-tests.com | Returns no breaches and one paste. A sensitive breach exists in the underlying data |
| permanent-opt-out@hibp-integration-tests.com | Returns no breaches/pastes. This account is permanently opted out of both |
| sensitive-and-other-breaches@hibp-integration-tests.com | Returns two non-sensitive breaches and no pastes. A sensitive breach exists in the underlying data |
| sensitive-breach@hibp-integration-tests.com | Returns no breaches/pastes. A sensitive breach exists in the underlying data |
| spam-list-only@hibp-integration-tests.com | Returns a single breach flagged as a spam list |
| spam-list-and-others@hibp-integration-tests.com | Returns multiple breaches, one flagged as a spam list |
| subscription-free-and-other-breaches@hibp-integration-tests.com | Returns a subscription-free breach and two other breaches |
| stealer-log@hibp-integration-tests.com | Returns a single stealer log breach and contains a domain in a stealer log |
| subscription-free-breach@hibp-integration-tests.com | Returns a single breach flagged as subscription-free |
| unverified-breach@hibp-integration-tests.com | Returns one unverified breach and no pastes |

## API Rate Limits

Note that the Have I Been Pwned API enforces rate limits. The standard rate limit is 1 request per 1.5 seconds (40 requests per minute). Be aware of these limits when running the live API tests, especially if you're running them repeatedly.

## API Key

For the live tests to work, you need a valid API key from Have I Been Pwned. You can purchase one from [https://haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key). 