async function testMta() {
  const apiKey = '421cf632-67e8-537c-abcd-b4c0db54b4ed';
  try {
    const res = await fetch('https://api.mobile-text-alerts.com/v3/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscribers: ['213550000000'],
        message: 'Test from ColocDz'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testMta();
