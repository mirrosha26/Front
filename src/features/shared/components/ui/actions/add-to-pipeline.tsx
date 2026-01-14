'use client';

import React from 'react';
import { IconPlus, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AddToPipelineButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  variant?: 'preview' | 'details';
  className?: string;
}

export const AddToPipelineButton: React.FC<AddToPipelineButtonProps> = ({
  onClick,
  isLoading = false,
  variant = 'preview',
  className
}) => {
  const buttonSize = variant === 'preview' ? 'h-7 w-7' : 'h-9 w-9';
  const iconSize = variant === 'preview' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            disabled={isLoading}
            className={cn(
              buttonSize,
              'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100',
              'border border-zinc-200 dark:border-zinc-700 rounded-md',
              className
            )}
          >
            {isLoading ? (
              <IconLoader2 className={cn(iconSize, 'animate-spin')} />
            ) : (
              <IconPlus className={iconSize} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Take to work</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


