import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join ColocDZ | Sign Up',
  description: 'Create an account on ColocDZ to find roommates, list spaces, and verify your profile.',
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
