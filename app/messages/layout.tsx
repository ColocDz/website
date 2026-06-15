import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Inbox | ColocDz Messages',
  description: 'Chat directly with potential roommates, landlords, and house shares on ColocDz.',
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
