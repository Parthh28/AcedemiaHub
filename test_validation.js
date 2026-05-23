const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/reviews',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
// Sending empty body to trigger Zod validation
req.write(JSON.stringify({}));
req.end();
