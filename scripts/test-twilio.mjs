/**
 * Twilio diagnostic script
 * Run with: node --env-file=.env scripts/test-twilio.mjs +213XXXXXXXXX
 */

import twilio from 'twilio';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const MESSAGING_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

const targetPhone = process.argv[2];

if (!targetPhone) {
  console.error('\n❌  Usage: node scripts/test-twilio.mjs +213XXXXXXXXX\n');
  process.exit(1);
}

console.log('\n🔍  Twilio Diagnostic Report');
console.log('─'.repeat(40));
console.log('ACCOUNT_SID       :', ACCOUNT_SID ? `${ACCOUNT_SID.slice(0, 6)}...` : '❌ MISSING');
console.log('AUTH_TOKEN        :', AUTH_TOKEN ? `${AUTH_TOKEN.slice(0, 6)}...` : '❌ MISSING');
console.log('MESSAGING_SERVICE :', MESSAGING_SID || '❌ MISSING');
console.log('Target number     :', targetPhone);
console.log('─'.repeat(40));

if (!ACCOUNT_SID || !AUTH_TOKEN || !MESSAGING_SID) {
  console.error('\n❌  One or more env variables are missing. Check your .env file.\n');
  process.exit(1);
}

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// 1. Verify account status
console.log('\n[1/3] Checking Twilio account status...');
try {
  const account = await client.api.accounts(ACCOUNT_SID).fetch();
  console.log('✅  Account found');
  console.log('    Status :', account.status);
  console.log('    Type   :', account.type);
  if (account.status !== 'active') {
    console.warn('\n⚠️   Account is NOT active! Status is:', account.status);
    console.warn('    → Go to https://console.twilio.com and check your account.\n');
  }
} catch (e) {
  console.error('❌  Failed to fetch account:', e.message);
  process.exit(1);
}

// 2. Verify messaging service
console.log('\n[2/3] Checking Messaging Service...');
try {
  const service = await client.messaging.v1.services(MESSAGING_SID).fetch();
  console.log('✅  Messaging Service found');
  console.log('    Name       :', service.friendlyName);
  console.log('    Inbound    :', service.inboundRequestUrl || '(none)');
} catch (e) {
  console.error('❌  Failed to fetch Messaging Service:', e.message);
  console.error('    → Make sure the Messaging Service SID is correct in .env');
  process.exit(1);
}

// 3. Send a real test message
console.log('\n[3/3] Sending test SMS to', targetPhone, '...');
try {
  const msg = await client.messages.create({
    body: 'ColocDZ test message — your verification system is working! ✅',
    messagingServiceSid: MESSAGING_SID,
    to: targetPhone,
  });
  console.log('✅  Message sent!');
  console.log('    SID    :', msg.sid);
  console.log('    Status :', msg.status);
  console.log('\n🎉  Everything looks good. Check your phone for the SMS.\n');
} catch (e) {
  console.error('\n❌  Failed to send SMS:', e.message);
  console.error('    Code:', e.code);

  if (e.code === 21608) {
    console.error('\n⚠️   TRIAL ACCOUNT RESTRICTION:');
    console.error('    Your Twilio account is in trial mode.');
    console.error('    You can only send to verified numbers.');
    console.error('    → Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    console.error('    → Add', targetPhone, 'as a verified number.\n');
  } else if (e.code === 21211) {
    console.error('\n⚠️   INVALID PHONE NUMBER FORMAT.');
    console.error('    Make sure you use E.164 format: +213XXXXXXXXX\n');
  } else if (e.code === 20003) {
    console.error('\n⚠️   AUTHENTICATION FAILED.');
    console.error('    Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env\n');
  }
  process.exit(1);
}
