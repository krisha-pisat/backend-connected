/**
 * Quick test script to verify /api/mock/generate route works
 * Run: node test-mock-route.js
 */

const http = require('http');

const postData = JSON.stringify({
  count: 1,
  includeRepeated: false
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/mock/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing POST /api/mock/generate...\n');

const req = http.request(options, (res) => {
  let data = '';

  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('\nResponse:', JSON.stringify(parsed, null, 2));
      
      if (parsed.success) {
        console.log('\n✅ Route is working!');
      } else {
        console.log('\n❌ Route returned error:', parsed.message);
      }
    } catch (e) {
      console.log('\n❌ Failed to parse response:', data);
    }
    process.exit(res.statusCode === 200 || res.statusCode === 201 ? 0 : 1);
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:', error.message);
  console.error('\nMake sure the server is running on port 5000!');
  process.exit(1);
});

req.write(postData);
req.end();
