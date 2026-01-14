import { IconCopy } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface ShareButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
  variant?: 'preview' | 'details';
}

export const ShareButton = ({
  onClick,
  isLoading = false,
  className,
  variant = 'preview'
}: ShareButtonProps) => {
  // Определяем стили в зависимости от варианта
  const defaultClassName =
    variant === 'preview'
      ? 'h-7 w-7 rounded-full p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
      : 'h-9 w-9 flex-shrink-0 rounded-full p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700';

  // Определяем размер иконки в зависимости от варианта
  const iconSize = variant === 'preview' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            onClick={onClick}
            disabled={isLoading}
            className={className || defaultClassName}
          >
            <IconCopy className={iconSize} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy public link</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
