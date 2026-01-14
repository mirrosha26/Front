import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: {
    template: '%s |',
    default: 'Вход'
  },
  description: 'Система аутентификации и регистрации пользователей.'
};

export default async function Page() {
  return (
    <div suppressHydrationWarning>
      <SignInViewPage />
    </div>
  );
}
