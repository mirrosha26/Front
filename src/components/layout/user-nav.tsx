'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import {
  IconUser,
  IconShield,
  IconBell,
  IconKey,
  IconLogout
} from '@tabler/icons-react';

export function UserNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-lg focus-visible-primary p-0'>
            <div className='relative h-8 w-8'>
              <Avatar className='h-8 w-8 rounded-lg border-2 border-primary/40 hover:border-primary/60 dark:border-primary/60 dark:hover:border-primary/80 transition-colors duration-200 overflow-hidden'>
                <AvatarImage
                  src={user.avatar || undefined}
                  alt={`${user.first_name} ${user.last_name}`}
                  className='rounded-none'
                />
                <AvatarFallback className='rounded-none bg-primary/10 text-primary/60'>
                  {user.first_name?.[0]?.toUpperCase() || ''}
                  {user.last_name?.[0]?.toUpperCase() || ''}
                </AvatarFallback>
              </Avatar>
              {/* Маленькая аватарка в углу - показывает группу если есть */}
              {user.group && (
                <div className='absolute -bottom-1 -right-1'>
                  <Avatar className='h-4.5 w-4.5 rounded-md overflow-hidden flex items-center justify-center'>
                    <AvatarImage
                      src={user.group.logo || undefined}
                      alt={user.group.name}
                      className='rounded-none'
                    />
                    <AvatarFallback className='rounded-none bg-primary/20 text-[10px] font-medium text-primary/80 flex items-center justify-center leading-none p-0'>
                      {user.group.name?.[0]?.toUpperCase() || 'G'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-56'
          align='end'
          sideOffset={10}
          forceMount
        >
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-medium'>
                {user.first_name} {user.last_name}
              </p>
              <p className='text-muted-foreground text-xs leading-none'>
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push('/app/profile')}>
              <IconUser className='mr-2 h-4 w-4' />
              Профиль
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/app/profile/security')}
            >
              <IconShield className='mr-2 h-4 w-4' />
              Безопасность
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/app/profile/notifications')}
            >
              <IconBell className='mr-2 h-4 w-4' />
              Уведомления
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/app/profile/client-tokens')}
            >
              <IconKey className='mr-2 h-4 w-4' />
              API Токены
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout?.()}>
            <IconLogout className='mr-2 h-4 w-4' />
            Выход
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}
