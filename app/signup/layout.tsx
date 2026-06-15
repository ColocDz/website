import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join ColocDz | Sign Up',
  description: 'Create an account on ColocDz to find roommates, list spaces, and verify your profile.',
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
