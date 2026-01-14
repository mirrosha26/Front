'use client';

import { Suspense } from 'react';

export default function SignUpLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div>Загрузка...</div>}>{children}</Suspense>;
}
