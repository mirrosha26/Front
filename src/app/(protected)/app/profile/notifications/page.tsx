import { Metadata } from 'next';
import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const metadata: Metadata = {
  title: 'Уведомления | Профиль',
  description: 'Configure your notification preferences and digest settings'
};

export default function NotificationsPage() {
  return <ProfileViewPage />;
}
