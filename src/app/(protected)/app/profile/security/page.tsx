import { Metadata } from 'next';
import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const metadata: Metadata = {
  title: 'Настройки | Профиль',
  description: 'Manage your account security settings'
};

export default function SecurityPage() {
  return <ProfileViewPage />;
}
