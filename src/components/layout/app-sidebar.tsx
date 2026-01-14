'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { navItems } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from '@/contexts/auth-context';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconPhotoUp,
  IconUser,
  IconShield,
  IconKey
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { state } = useSidebar();

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2'>
            <Avatar className='h-8 w-8 overflow-hidden rounded-lg'>
              <AvatarImage
                src='/logo/compact/logo.png'
                className='h-full w-full max-h-8 max-w-8 object-contain p-0'
              />
            </Avatar>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;

              // Проверяем активность элемента с учетом дополнительных путей
              const isItemActive = pathname === item.url;

              // Проверяем, есть ли активный подэлемент
              const hasActiveSubItem = item.items?.some(
                (subItem) =>
                  pathname === subItem.url ||
                  (subItem.activePaths &&
                    subItem.activePaths.includes(pathname))
              );

              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={
                    isItemActive || hasActiveSubItem || item.isActive
                  }
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    {state === 'collapsed' ? (
                      // В сжатом состоянии - кликабельная ссылка
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isItemActive || hasActiveSubItem}
                      >
                        <Link href={item.url}>
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      // В развернутом состоянии - разделенная функциональность
                      <div className='flex items-center'>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          isActive={isItemActive}
                          className='flex-1'
                        >
                          <Link href={item.url}>
                            {item.icon && <Icon />}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            size='sm'
                            className='h-8 w-8 p-0 hover:bg-sidebar-accent'
                          >
                            <IconChevronRight className='h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      </div>
                    )}
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items
                          ?.filter((subItem) => {
                          // Скрываем "CRM" если у пользователя нет группы
                          if (subItem.url === '/app/leads/crm') {
                            return !!user?.group;
                          }
                            return true;
                          })
                          ?.map((subItem) => {
                          // Проверяем активность подэлемента, включая activePaths
                          const isSubItemActive =
                            pathname === subItem.url ||
                            (subItem.activePaths &&
                              subItem.activePaths.includes(pathname));

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubItemActive}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user && (
                    <div className='flex items-center gap-2'>
                      <div className='relative h-8 w-8'>
                        <Avatar className='h-8 w-8 rounded-lg border-2 border-primary/30 hover:border-primary/60 dark:border-primary/60 dark:hover:border-primary/60 transition-colors duration-200 overflow-hidden'>
                        {user.avatar && (
                          <AvatarImage
                            src={user.avatar}
                            alt={`${user?.first_name} ${user?.last_name}`}
                              className='rounded-none'
                          />
                        )}
                          <AvatarFallback className='rounded-none bg-primary/10 text-primary/60'>
                          {user?.first_name?.[0]}
                          {user?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                        {/* Маленькая аватарка в углу - показывает группу если есть */}
                        {user.group && (
                          <div className='absolute -bottom-1 -right-1'>
                            <Avatar className='h-4.5 w-4.5 rounded-md overflow-hidden flex items-center justify-center'>
                              {user.group.logo && (
                                <AvatarImage
                                  src={user.group.logo}
                                  alt={user.group.name}
                                  className='rounded-none'
                                />
                              )}
                              <AvatarFallback className='rounded-none bg-primary/20 text-[10px] font-medium text-primary/80 flex items-center justify-center leading-none p-0'>
                                {user.group.name?.[0]?.toUpperCase() || 'G'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                      </div>
                      <div className='flex flex-col text-sm'>
                        <span className='font-medium'>
                          {user?.first_name} {user?.last_name}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          {user?.email}
                        </span>
                      </div>
                    </div>
                  )}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user && (
                      <div className='flex items-center gap-2'>
                        <div className='relative h-8 w-8'>
                          <Avatar className='h-8 w-8 rounded-lg border-2 border-primary/30 dark:border-primary/60 transition-colors duration-200 overflow-hidden'>
                            <AvatarImage
                              src={user.avatar || undefined}
                              alt={`${user?.first_name} ${user?.last_name}`}
                              className='rounded-none'
                            />
                            <AvatarFallback className='rounded-none bg-primary/10 text-primary/60'>
                              {user?.first_name?.[0]?.toUpperCase() || ''}
                              {user?.last_name?.[0]?.toUpperCase() || ''}
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
                        <div className='flex flex-col text-sm'>
                          <span className='font-medium'>
                            {user?.first_name} {user?.last_name}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            {user?.email}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/app/profile')}
                  >
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
