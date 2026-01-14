import { PublicProjectPage, PublicProjectProvider } from '@/features/public-project';

interface PublicPageProps {
  searchParams: { uuid?: string };
}

export default function PublicPage({ searchParams }: PublicPageProps) {
  return (
    <PublicProjectProvider>
      <PublicProjectPage uuid={searchParams.uuid} />
    </PublicProjectProvider>
  );
} 