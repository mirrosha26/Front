import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feeds',
  description: 'Browse and manage your feeds and signals'
};

export default function FeedsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
