const https = require('https');
const data = JSON.stringify({ licenseKey: 'FAKE-1234', deviceId: '123' });
const req = https.request({
  hostname: 'tailor-backend-six.vercel.app', port: 443, path: '/api/auth/activate', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});
req.write(data); req.end();
