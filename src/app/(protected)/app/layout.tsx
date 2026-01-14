import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <KBar>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset className='overflow-visible h-screen'>
          <Header />
          {/* page main content */}
          <div className='h-[calc(100vh-4rem)]'>
            {children}
          </div>
          {/* page main content ends */}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
