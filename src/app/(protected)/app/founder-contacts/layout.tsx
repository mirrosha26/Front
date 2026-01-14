import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Контакты',
    default: 'Контакты основателей'
  },
  description: 'View and manage your founder contacts'
};

export default function FounderContactsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
