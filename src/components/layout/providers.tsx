'use client';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Динамический импорт AuthProvider с отключенным SSR
const AuthProviderClient = dynamic(
  () =>
    import('@/contexts/auth-context').then((mod) => ({
      default: mod.AuthProvider
    })),
  { ssr: false }
);

export default function Providers({
  activeThemeValue = 'default',
  children
}: {
  activeThemeValue?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme='dark'
      enableSystem
      disableTransitionOnChange
    >
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <AuthProviderClient>
          {mounted ? (
            children
          ) : (
            <div style={{ visibility: 'hidden' }}>{children}</div>
          )}
        </AuthProviderClient>
      </ActiveThemeProvider>
    </NextThemesProvider>
  );
}
