import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ColocDz',
  description: 'Access your roommate matches, settings, and direct chat on ColocDz.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
