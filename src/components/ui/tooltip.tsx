'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

const tooltipVariants = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  muted: 'bg-muted text-muted-foreground',
  theme: 'bg-background text-foreground'
};

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot='tooltip-provider'
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot='tooltip' {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot='tooltip-trigger' {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  variant?: keyof typeof tooltipVariants;
}) {
  // Проверяем, существует ли указанный вариант в tooltipVariants
  const variantExists = variant in tooltipVariants;

  // Если вариант не существует, не отображаем компонент
  if (!variantExists) return null;

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot='tooltip-content'
        sideOffset={sideOffset}
        className={cn(
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance shadow-md',
          tooltipVariants[variant],
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className={cn(
            'z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]',
            variant === 'default'
              ? 'bg-primary fill-primary'
              : variant === 'secondary'
                ? 'bg-secondary fill-secondary'
                : variant === 'destructive'
                  ? 'bg-destructive fill-destructive'
                  : variant === 'theme'
                    ? 'bg-background fill-background'
                    : 'bg-muted fill-muted'
          )}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

// Примеры использования:
//
// 1. Стандартный вариант (primary):
// <Tooltip>
//   <TooltipTrigger asChild>
//     <Button>Наведите курсор</Button>
//   </TooltipTrigger>
//   <TooltipContent>
//     <p>Стандартный тултип</p>
//   </TooltipContent>
// </Tooltip>
//
// 2. Вторичный вариант:
// <Tooltip>
//   <TooltipTrigger asChild>
//     <Button variant="outline">Наведите курсор</Button>
//   </TooltipTrigger>
//   <TooltipContent variant="secondary">
//     <p>Вторичный тултип</p>
//   </TooltipContent>
// </Tooltip>
//
// 3. Деструктивный вариант:
// <Tooltip>
//   <TooltipTrigger asChild>
//     <Button variant="destructive">Наведите курсор</Button>
//   </TooltipTrigger>
//   <TooltipContent variant="destructive">
//     <p>Деструктивный тултип</p>
//   </TooltipContent>
// </Tooltip>
//
// 4. Приглушенный вариант:
// <Tooltip>
//   <TooltipTrigger asChild>
//     <Button variant="ghost">Наведите курсор</Button>
//   </TooltipTrigger>
//   <TooltipContent variant="muted">
//     <p>Приглушенный тултип</p>
//   </TooltipContent>
// </Tooltip>
//
// 5. Вариант темы:
// <Tooltip>
//   <TooltipTrigger asChild>
//     <Button variant="outline">Наведите курсор</Button>
//   </TooltipTrigger>
//   <TooltipContent variant="theme">
//     <p>Тултип в стиле текущей темы</p>
//   </TooltipContent>
// </Tooltip>
