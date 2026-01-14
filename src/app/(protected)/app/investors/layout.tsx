import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Investors',
  description: 'Browse and manage investors on the platform'
};

export default function InvestorsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='h-full'>
      {children}
    </div>
  );
}
