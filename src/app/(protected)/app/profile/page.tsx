import { Metadata } from 'next';
import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const metadata: Metadata = {
  title: 'Профиль',
  description: 'Просмотр и редактирование информации профиля'
};

export default function ProfilePage() {
  return <ProfileViewPage />;
}
