import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import Providers from '@/components/layout/providers';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { CardOperationsProvider } from '@/features/shared/contexts/card-operations-context';
import { ApolloProviderWrapper } from '@/components/providers/apollo-provider';
import { VersionCheck } from '@/components/version-check';
import { fontVariables } from '@/lib/font';

export const metadata: Metadata = {
  title: {
    default: 'Platform',
    template: '%s'
  },
  description:
    'Platform for discovering, tracking, and analyzing promising startups and investment opportunities.',
  icons: {
    icon: '/logo/compact/logo.png'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'bg-background min-h-screen font-sans antialiased',
          fontVariables
        )}
      >
        <VersionCheck />
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
          <AuthProvider>
            <ApolloProviderWrapper>
              <CardOperationsProvider>
                <Providers activeThemeValue='default'>
                  {children}
                  <Toaster richColors />
                </Providers>
              </CardOperationsProvider>
            </ApolloProviderWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
