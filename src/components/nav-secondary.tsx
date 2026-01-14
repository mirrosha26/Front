'use client';

import { usePathname } from 'next/navigation';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface NavSecondaryProps {
  items: {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  className?: string;
}

export function NavSecondary({ items, className }: NavSecondaryProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup className={cn(className)}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.url || pathname.startsWith(item.url + '/');
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  size="sm"
                >
                  <a href={item.url}>
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
} 