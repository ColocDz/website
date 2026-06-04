import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Your Account | ColocDZ',
  description: 'Access your roommate matches, settings, and direct chat on ColocDZ.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
