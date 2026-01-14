'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { IconUser, IconShield, IconBell, IconKey } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ProfileInfoTab } from './profile-info-tab';
import { SecurityTab } from './security-tab';
import { NotificationsTab } from './notifications-tab';
import { ClientTokensTab } from './client-tokens-tab';

export default function ProfileViewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userTypes, setUserTypes] = useState<
    { value: string; label: string }[]
  >([]);

  // Определяем активный таб на основе URL
  const activeTab = pathname.includes('/security')
    ? 'security'
    : pathname.includes('/notifications')
      ? 'notifications'
      : pathname.includes('/client-tokens')
        ? 'client-tokens'
      : 'profile';

  // Загрузка типов пользователей из API
  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const response = await fetch('/api/auth/meta');
        if (!response.ok) {
          throw new Error('Error loading user types');
        }
        const data = await response.json();
        if (data.user_types && Array.isArray(data.user_types)) {
          setUserTypes(data.user_types);
        }
      } catch (error) {
        console.error('Error loading metadata:', error);
      }
    };

    fetchUserTypes();
  }, []);

  // Обработчики для переключения табов через маршрутизацию
  const handleTabChange = (tab: string) => {
    if (tab === 'profile') {
      router.push('/app/profile');
    } else if (tab === 'security') {
      router.push('/app/profile/security');
    } else if (tab === 'notifications') {
      router.push('/app/profile/notifications');
    } else if (tab === 'client-tokens') {
      router.push('/app/profile/client-tokens');
    }
  };

  return (
    <div className='container mx-auto w-full px-4 py-8 sm:px-6 h-full flex flex-col'>
      <div className='divide-border flex flex-col md:flex-row md:divide-x flex-1 min-h-0'>
        {/* Sidebar с табами */}
        <div className='mb-6 w-full pt-3 md:mb-0 md:w-64 md:pr-6'>
          <div className='sticky top-20'>
            <div className='mb-4'>
              <h2 className='text-xl font-bold'>Настройки</h2>
              <p className='text-muted-foreground text-sm'>
                Управляйте профилем и настройками
              </p>
            </div>
            <Separator className='mb-4' />
            <nav className='flex flex-col space-y-1'>
              <button
                className={cn(
                  'hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer',
                  activeTab === 'profile'
                    ? 'bg-muted font-medium'
                    : 'text-muted-foreground font-normal'
                )}
                onClick={() => handleTabChange('profile')}
              >
                <IconUser className='h-4 w-4' />
                Профиль
              </button>
              <button
                className={cn(
                  'hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer',
                  activeTab === 'security'
                    ? 'bg-muted font-medium'
                    : 'text-muted-foreground font-normal'
                )}
                onClick={() => handleTabChange('security')}
              >
                <IconShield className='h-4 w-4' />
                Безопасность
              </button>
              <button
                className={cn(
                  'hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer',
                  activeTab === 'notifications'
                    ? 'bg-muted font-medium'
                    : 'text-muted-foreground font-normal'
                )}
                onClick={() => handleTabChange('notifications')}
              >
                <IconBell className='h-4 w-4' />
                Уведомления
              </button>
              <button
                className={cn(
                  'hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer',
                  activeTab === 'client-tokens'
                    ? 'bg-muted font-medium'
                    : 'text-muted-foreground font-normal'
                )}
                onClick={() => handleTabChange('client-tokens')}
              >
                <IconKey className='h-4 w-4' />
                API Токены
              </button>
            </nav>
          </div>
        </div>

        {/* Основной контент */}
        <div className='flex-1 md:pl-6 flex flex-col min-h-0'>
          <div className='flex-1 overflow-y-auto hover:overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:hover:scrollbar-track-gray-800'>
            <div className='rounded-lg border p-6 '>
              {activeTab === 'profile' && (
                <ProfileInfoTab user={user} userTypes={userTypes} />
              )}

              {activeTab === 'security' && <SecurityTab />}

              {activeTab === 'notifications' && <NotificationsTab />}

              {activeTab === 'client-tokens' && <ClientTokensTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
