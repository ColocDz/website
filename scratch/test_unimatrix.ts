async function runTest() {
  const accessKeyId = 'S1QejJjBK5F6YCWsfpbRMR';
  const to = '+213558137964';
  const otpCode = '951357';

  console.log('--- Test 3: otp.send with intent: login ---');
  try {
    const res3 = await fetch(`https://api.unimtx.com/?action=otp.send&accessKeyId=${encodeURIComponent(accessKeyId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, code: otpCode, intent: 'login', channel: 'auto' })
    });
    const data3 = await res3.json();
    console.log('Status 3:', res3.status, data3);
  } catch (e: any) {
    console.error('Error 3:', e.message);
  }
}

runTest();
