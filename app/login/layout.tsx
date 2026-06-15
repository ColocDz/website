import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Your Account | ColocDz',
  description: 'Access your roommate matches, settings, and direct chat on ColocDz.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
