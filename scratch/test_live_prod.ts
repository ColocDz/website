async function testProd() {
  try {
    const res = await fetch('https://colocdz.com/', { redirect: 'manual' });
    console.log('Main Page HTTP Status:', res.status);
    const text = await res.text();
    console.log('Main Page Output Snippet:', text.substring(0, 300));
  } catch (e: any) {
    console.error('Error fetching main page:', e.message);
  }
}

testProd();
