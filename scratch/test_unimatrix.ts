import crypto from 'crypto';

export async function sendUnimatrixSms({
  accessKeyId,
  accessKeySecret,
  to,
  otpCode
}: {
  accessKeyId: string;
  accessKeySecret?: string;
  to: string;
  otpCode: string;
}) {
  let apiUrl = `https://api.unimtx.com/?action=sms.message.send&accessKeyId=${encodeURIComponent(accessKeyId)}`;

  if (accessKeySecret) {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(8).toString('hex');
    const algorithm = 'hmac-sha256';

    const paramsToSign: Record<string, string> = {
      accessKeyId,
      action: 'sms.message.send',
      algorithm,
      nonce,
      timestamp: timestamp.toString(),
    };

    const sortedKeys = Object.keys(paramsToSign).sort();
    const stringToSign = sortedKeys.map(k => `${k}=${paramsToSign[k]}`).join('&');
    const signature = crypto.createHmac('sha256', accessKeySecret).update(stringToSign).digest('base64');

    apiUrl = `https://api.unimtx.com/?action=sms.message.send&accessKeyId=${encodeURIComponent(accessKeyId)}&algorithm=${algorithm}&timestamp=${timestamp}&nonce=${nonce}&signature=${encodeURIComponent(signature)}`;
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to,
      text: `Your ColocDZ verification code is: ${otpCode}. Valid for 10 minutes.`
    })
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
