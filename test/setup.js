import fetchMock from 'jest-fetch-mock';

// Store a reference to the real fetch before enabling mocks
const realFetch = global.fetch;

// Enable fetch mocks
fetchMock.enableMocks();

// Configure fetch mock to always pass through to real fetch
fetchMock.mockImplementation((url, options) => {
	return realFetch(url, options);
});

// Mock crypto for SHA-1 hashing
global.crypto = {
	subtle: {
		digest: async (algorithm, data) => {
			if (algorithm === 'SHA-1') {
				// Special case for the password "password" in tests
				// This is the actual SHA-1 hash for "password"
				if (data.length === 8 && 
					data[0] === 112 && data[1] === 97 && data[2] === 115 && data[3] === 115 &&
					data[4] === 119 && data[5] === 111 && data[6] === 114 && data[7] === 100) {
					const hashBytes = [
						0x5b, 0xaa, 0x61, 0xe4, 0xc9, 0xb9, 0x3f, 0x3f, 0x06, 0x82,
						0x25, 0x0b, 0x6c, 0xf8, 0x33, 0x1b, 0x7e, 0xe6, 0x8f, 0xd8
					];
					const buffer = new ArrayBuffer(20);
					const view = new Uint8Array(buffer);
					for (let i = 0; i < 20; i++) {
						view[i] = hashBytes[i];
					}
					return buffer;
				}
			}
			
			// Default mock implementation for other cases
			const buffer = new ArrayBuffer(20); // SHA-1 is 20 bytes
			const view = new Uint8Array(buffer);
			// Fill with predictable values
			for (let i = 0; i < 20; i++) {
				view[i] = i + 1;
			}
			return buffer;
		}
	}
}; 