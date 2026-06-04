import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Roommates & Rooms in Algeria | ColocDZ',
  description: 'Search and find verified roommates, shared apartments, and housing offers across all 58 wilayas in Algeria.',
  openGraph: {
    title: 'ColocDZ - Roommate Finder',
    description: 'Find verified roommates and shared housing in Algeria.',
    type: 'website',
  },
};

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
