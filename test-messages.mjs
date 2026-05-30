// Test script to verify messaging API end-to-end
const BASE = 'http://localhost:3000';

async function test() {
  // Step 1: Sign in as Ahmed
  console.log('--- Step 1: Signing in as Ahmed ---');
  const signInRes = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': BASE },
    body: JSON.stringify({ email: 'ahmed@test.com', password: 'Test1234!' }),
    redirect: 'manual',
  });
  
  console.log('Sign-in status:', signInRes.status);
  const signInBody = await signInRes.json().catch(() => null);
  console.log('Sign-in body:', JSON.stringify(signInBody, null, 2));
  
  // Extract cookies
  const setCookies = signInRes.headers.getSetCookie?.() || [];
  console.log('Set-Cookie headers:', setCookies);
  
  const cookieStr = setCookies.map(c => c.split(';')[0]).join('; ');
  console.log('Cookie string:', cookieStr);
  
  if (!cookieStr) {
    console.error('ERROR: No cookies received from sign-in!');
    return;
  }
  
  // Step 2: Check session
  console.log('\n--- Step 2: Checking session ---');
  const sessionRes = await fetch(`${BASE}/api/auth/get-session`, {
    headers: { Cookie: cookieStr },
  });
  const sessionData = await sessionRes.json();
  console.log('Session:', JSON.stringify(sessionData, null, 2));
  
  // Step 3: Get Fatima's user ID
  console.log('\n--- Step 3: Getting Fatima user ID ---');
  // We need to find Fatima's ID. Let's check posts to find her authorId
  const postsRes = await fetch(`${BASE}/api/posts`);
  const posts = await postsRes.json();
  const fatimaPost = posts.find(p => p.author?.name === 'Fatima');
  console.log('Fatima post found:', fatimaPost ? `"${fatimaPost.title}" by authorId: ${fatimaPost.authorId}` : 'NOT FOUND');
  
  if (!fatimaPost) {
    console.error('ERROR: Could not find Fatima\'s post');
    return;
  }
  
  const fatimaId = fatimaPost.authorId;
  
  // Step 4: Send a message to Fatima
  console.log('\n--- Step 4: Sending message to Fatima ---');
  const sendRes = await fetch(`${BASE}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieStr },
    body: JSON.stringify({
      receiverId: fatimaId,
      content: 'Hi Fatima! I am interested in your property listing.',
    }),
  });
  console.log('Send message status:', sendRes.status);
  const sendBody = await sendRes.json();
  console.log('Send response:', JSON.stringify(sendBody, null, 2));
  
  // Step 5: Fetch conversations
  console.log('\n--- Step 5: Fetching conversations list ---');
  const convsRes = await fetch(`${BASE}/api/messages`, {
    headers: { Cookie: cookieStr },
  });
  console.log('Conversations status:', convsRes.status);
  const convs = await convsRes.json();
  console.log('Conversations:', JSON.stringify(convs, null, 2));
  
  // Step 6: Fetch messages from the conversation
  if (convs.length > 0) {
    const convId = convs[0].id;
    console.log(`\n--- Step 6: Fetching messages for conversation ${convId} ---`);
    const msgsRes = await fetch(`${BASE}/api/messages/${convId}`, {
      headers: { Cookie: cookieStr },
    });
    console.log('Messages status:', msgsRes.status);
    const msgs = await msgsRes.json();
    console.log('Messages:', JSON.stringify(msgs, null, 2));
  } else {
    console.log('\n--- Step 6: SKIPPED - no conversations found ---');
  }
}

test().catch(console.error);
