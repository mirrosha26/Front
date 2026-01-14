'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

interface AvatarProps
  extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  variant?: 'default' | 'private' | 'followed' | 'more' | 'favorites';
}

function Avatar({ className, variant = 'default', ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      className={cn(
        'bg-background relative flex size-8 shrink-0 overflow-hidden rounded-full',
        variant === 'private' &&
          'border-2 border-lime-500 bg-white dark:bg-zinc-900',
        variant === 'followed' &&
          'border-2 border-primary bg-white dark:bg-zinc-900',
        variant === 'favorites' &&
          'border-2 border-yellow-500 bg-white dark:bg-zinc-900',
        variant === 'more' &&
          'border-primary bg-primary text-primary-foreground border-2',
        variant === 'default' &&
          'border-muted border-2 bg-white dark:bg-zinc-900',
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot='avatar-image'
      className={cn(
        'aspect-square size-full h-full w-full object-cover',
        className
      )}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot='avatar-fallback'
      className={cn(
        'flex size-full h-full w-full items-center justify-center rounded-full',
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
