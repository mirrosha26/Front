import { Metadata } from 'next';
import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const metadata: Metadata = {
  title: 'API Токены | Профиль',
  description: 'Manage your API tokens for accessing the API'
};

export default function ClientTokensPage() {
  return <ProfileViewPage />;
}


