const https = require('https');
const data = JSON.stringify({ password: '2426' });

const loginReq = https.request({
  hostname: 'tailor-backend-six.vercel.app', port: 443, path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const json = JSON.parse(body);
    if (!json.token) return console.log('Login failed:', body);

    const data2 = JSON.stringify({ licenseKey: 'FAKE', deviceId: '123' });
    const actReq = https.request({
      hostname: 'tailor-backend-six.vercel.app', port: 443, path: '/api/auth/activate', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data2.length }
    }, res2 => {
      let body2 = ''; res2.on('data', d => body2 += d); res2.on('end', () => console.log('Activate:', res2.statusCode, body2));
    });
    actReq.write(data2); actReq.end();
  });
});
loginReq.write(data); loginReq.end();
