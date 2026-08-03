import https from 'https';

const PROD_URL = 'https://colocdz.com';

function makeRequest(path: string, method: string = 'GET', bodyData: any = null): Promise<{ status: number; headers: any; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, PROD_URL);
    const postData = bodyData ? JSON.stringify(bodyData) : null;

    const reqHeaders: any = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    };

    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode || 0, headers: res.headers, body: parsed });
      });
    });

    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function testLiveServer() {
  console.log('==================================================');
  console.log('Testing https://colocdz.com API Endpoints');
  console.log('==================================================\n');

  console.log('[1] Testing /api/debug ...');
  const debugRes = await makeRequest('/api/debug');
  console.log('Status:', debugRes.status);
  console.log('Body:', JSON.stringify(debugRes.body, null, 2), '\n');

  console.log('[2] Testing Signup for asma25860@gmail.com ...');
  const signupRes = await makeRequest('/api/auth/sign-up/email', 'POST', {
    email: 'asma25860@gmail.com',
    password: 'Password123!',
    name: 'asma',
  });
  console.log('Signup Status:', signupRes.status);
  console.log('Signup Headers:', signupRes.headers['set-cookie'] || 'No cookie set');
  console.log('Signup Body:', JSON.stringify(signupRes.body, null, 2), '\n');
}

testLiveServer();
