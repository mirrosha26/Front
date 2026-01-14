import React from 'react';
import { IconLoader2 } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  overlayClassName?: string;
  spinnerClassName?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  size = 'md',
  className,
  overlayClassName,
  spinnerClassName
}) => {
  if (!isVisible) return null;

  const sizeConfig = {
    sm: { spinner: 'h-3 w-3', container: 'p-1.5' },
    md: { spinner: 'h-4 w-4', container: 'p-2' },
    lg: { spinner: 'h-5 w-5', container: 'p-2.5' }
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center',
        'bg-white/50 backdrop-blur-[1px] dark:bg-zinc-900/50',
        overlayClassName
      )}
    >
      <div
        className={cn(
          'rounded-full border border-zinc-200 dark:border-zinc-700',
          'bg-white shadow-sm dark:bg-zinc-800',
          config.container,
          className
        )}
      >
        <IconLoader2
          className={cn(
            'animate-spin text-zinc-600 dark:text-zinc-400',
            config.spinner,
            spinnerClassName
          )}
        />
      </div>
    </div>
  );
};
