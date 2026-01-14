'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { useAuth } from '@/contexts/auth-context';
import { OnboardingProvider, OnboardingManager } from '@/features/onboarding';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Prevent redirect loops - don't redirect if we're already on auth page
    if (!isLoading && !isAuthenticated && !pathname?.startsWith('/auth')) {
      const callbackUrl = encodeURIComponent(pathname || '/app');
      router.push(`/auth/sign-in?callbackUrl=${callbackUrl}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className='flex h-screen w-screen items-center justify-center'>
        <Loader2 className='text-primary h-8 w-8 animate-spin' />
      </div>
    );
  }

  return isAuthenticated ? (
    <>
      {children}
      <OnboardingManager />
    </>
  ) : null;
}
export default function LayoutWrapper({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </OnboardingProvider>
  );
}
