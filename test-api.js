// Simple script to test the API directly
const apiKey = '58b1febd04414585afdd514b74f4499f';

async function testApi() {
	console.log('Testing API directly...');
	
	try {
		// Test with global fetch
		console.log('Testing with global fetch:');
		
		const response = await fetch('https://haveibeenpwned.com/api/v3/breach/Adobe', {
			headers: {
				'hibp-api-key': apiKey,
				'user-agent': 'haveibeenpwned-ts',
				'Accept': 'application/json'
			}
		});
		
		console.log('Response status:', response.status);
		console.log('Response headers:', Object.fromEntries(response.headers.entries()));
		
		const text = await response.text();
		console.log('Response text length:', text.length);
		console.log('Response text preview:', text.substring(0, 100) + '...');
		
		if (text) {
			try {
				const json = JSON.parse(text);
				console.log('Parsed JSON:', json.Name);
			} catch (e) {
				console.error('Error parsing JSON:', e);
			}
		}
	} catch (error) {
		console.error('Fetch error:', error);
	}
}

testApi(); 