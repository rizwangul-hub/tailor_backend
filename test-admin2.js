const https = require('https');
const req = https.request({
  hostname: 'tailor-backend-six.vercel.app', port: 443, path: '/api/admin/licenses', method: 'GET',
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});
req.end();
