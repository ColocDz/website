import { createAuthClient } from "better-auth/react";

const getClientBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://colocdz.com';
};

export const authClient = createAuthClient({
  baseURL: getClientBaseUrl(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
