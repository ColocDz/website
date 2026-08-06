async function testMta() {
  const apiKey = '421cf632-67e8-537c-abcd-b4c0db54b4ed';
  try {
    const res = await fetch('https://api.mobile-text-alerts.com/v3/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: '213558123456'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testMta();
