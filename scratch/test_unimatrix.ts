async function runTest() {
  const accessKeyId = 'S1QejJjBK5F6YCWsfpbRMR';
  const to = '+213558137964';
  const otpCode = '852963';

  console.log('--- Test 1: otp.send ---');
  try {
    const res1 = await fetch(`https://api.unimtx.com/?action=otp.send&accessKeyId=${encodeURIComponent(accessKeyId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, code: otpCode })
    });
    const data1 = await res1.json();
    console.log('Status 1:', res1.status, data1);
  } catch (e: any) {
    console.error('Error 1:', e.message);
  }

  console.log('--- Test 2: sms.message.send with content ---');
  try {
    const res2 = await fetch(`https://api.unimtx.com/?action=sms.message.send&accessKeyId=${encodeURIComponent(accessKeyId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, content: `Your verification code is ${otpCode}, valid for 10 minutes.` })
    });
    const data2 = await res2.json();
    console.log('Status 2:', res2.status, data2);
  } catch (e: any) {
    console.error('Error 2:', e.message);
  }
}

runTest();
