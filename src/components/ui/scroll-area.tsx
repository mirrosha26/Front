'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { cn } from '@/lib/utils';

/**
 * ScrollArea Component with enhanced scrollbar customization
 * 
 * @example
 * // Basic usage
 * <ScrollArea className="h-96">
 *   <div>Content with default scrollbar</div>
 * </ScrollArea>
 * 
 * @example
 * // Custom scrollbar styling
 * <ScrollArea 
 *   className="h-96"
 *   scrollbar={{
 *     size: 8,
 *     className: "bg-zinc-200 dark:bg-zinc-500 rounded-full",
 *     thumbClassName: "bg-zinc-50 dark:bg-zinc-700 rounded-full border border-zinc-300 dark:border-zinc-600"
 *   }}
 * >
 *   <div>Content with custom scrollbar</div>
 * </ScrollArea>
 * 
 * @example
 * // Thin scrollbar
 * <ScrollArea 
 *   className="h-96"
 *   scrollbar={{
 *     size: 6,
 *     className: "bg-transparent",
 *     thumbClassName: "bg-zinc-300 dark:bg-zinc-600 rounded-full"
 *   }}
 * >
 *   <div>Content with thin scrollbar</div>
 * </ScrollArea>
 */

interface ScrollAreaProps extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
  scrollbar?: {
    size?: number;
    className?: string;
    thumbClassName?: string;
  };
}

function ScrollArea({
  className,
  children,
  scrollbar,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot='scroll-area'
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot='scroll-area-viewport'
        className='focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1'
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar scrollbar={scrollbar} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

interface ScrollBarProps extends React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  scrollbar?: {
    size?: number;
    className?: string;
    thumbClassName?: string;
  };
}

function ScrollBar({
  className,
  orientation = 'vertical',
  scrollbar,
  ...props
}: ScrollBarProps) {
  const size = scrollbar?.size || 2.5;
  
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot='scroll-area-scrollbar'
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none',
        orientation === 'vertical' &&
          `h-full w-${size} border-l border-l-transparent`,
        orientation === 'horizontal' &&
          `h-${size} flex-col border-t border-t-transparent`,
        scrollbar?.className,
        className
      )}
      style={{
        width: orientation === 'vertical' ? `${size * 4}px` : undefined,
        height: orientation === 'horizontal' ? `${size * 4}px` : undefined,
      }}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot='scroll-area-thumb'
        className={cn(
          'bg-border relative flex-1 rounded-full',
          scrollbar?.thumbClassName
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
