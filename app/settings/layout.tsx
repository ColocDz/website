import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Settings | ColocDZ',
  description: 'Manage your profile details, verification status, security, and notification settings.',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
