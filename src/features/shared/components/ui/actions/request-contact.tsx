import React from 'react';
import { IconUsers } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface RequestContactButtonProps {
  onClick: () => void;
  hasTicket?: boolean;
  isLoading?: boolean;
  variant?: 'card' | 'details';
}

export const RequestContactButton: React.FC<RequestContactButtonProps> = ({
  onClick,
  hasTicket = false,
  isLoading = false,
  variant = 'card'
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='relative'>
            {hasTicket && (
              <div className='bg-primary absolute -top-1 -right-1 z-10 h-3 w-3 rounded-full border border-white dark:border-zinc-900'></div>
            )}
            <Button
              variant='ghost'
              size='sm'
              onClick={onClick}
              disabled={isLoading}
              className={
                variant === 'details'
                  ? 'h-9 w-9 flex-shrink-0 rounded-full border border-zinc-200 p-0 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
                  : 'h-8 w-8 flex-shrink-0 rounded-full p-0'
              }
            >
              <IconUsers
                className={variant === 'details' ? 'h-4.5 w-4.5' : 'h-4 w-4'}
              />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {hasTicket
            ? 'Contact request already submitted'
            : 'Request founder contacts'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
