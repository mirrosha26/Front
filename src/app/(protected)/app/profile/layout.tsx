import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Профиль',
  description: 'Просмотр и редактирование информации профиля'
};

export default function ProfileLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
