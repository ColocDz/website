import { auth } from './auth';
import { headers } from 'next/headers';

export async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    return session;
  } catch (e) {
    return null;
  }
}
