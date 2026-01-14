import * as React from 'react';
import { cn } from '@/lib/utils';

const Empty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col items-center justify-center py-6', className)}
    {...props}
  />
));
Empty.displayName = 'Empty';

const EmptyHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col items-center gap-2 text-center', className)}
    {...props}
  />
));
EmptyHeader.displayName = 'EmptyHeader';

const EmptyMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'icon' | 'image';
  }
>(({ className, variant = 'icon', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-center',
      variant === 'icon' && 'mb-2',
      variant === 'image' && 'mb-3',
      className
    )}
    {...props}
  />
));
EmptyMedia.displayName = 'EmptyMedia';

const EmptyTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
EmptyTitle.displayName = 'EmptyTitle';

const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-muted-foreground text-xs', className)}
    {...props}
  />
));
EmptyDescription.displayName = 'EmptyDescription';

const EmptyContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mt-3', className)}
    {...props}
  />
));
EmptyContent.displayName = 'EmptyContent';

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
};

