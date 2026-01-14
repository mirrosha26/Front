import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Регистрация',
  description: 'Создайте аккаунт для доступа'
};

export default async function Page() {
  return <SignUpViewPage />;
}
