import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ColocDz',
  description: 'Chat directly with potential roommates, landlords, and house shares on ColocDz.',
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
