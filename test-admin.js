const https = require('https');
const data = JSON.stringify({ password: '2426' });
const req = https.request({
  hostname: 'tailor-backend-six.vercel.app',
  port: 443,
  path: '/api/admin/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});
req.on('error', error => console.error(error));
req.write(data);
req.end();
