const https = require('https');
const data = JSON.stringify({
  licenseKey: 'TLR-176B-E780-8829', // From the user's screenshot
  deviceId: 'test_device_123',
  deviceName: 'Test Phone',
  confirmTransfer: true
});

const req = https.request({
  hostname: 'tailor-backend-six.vercel.app',
  port: 443,
  path: '/api/auth/activate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
