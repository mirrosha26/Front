import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Signals',
  description: 'Browse and manage your signals and saved cards'
};

export default function LeadsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
