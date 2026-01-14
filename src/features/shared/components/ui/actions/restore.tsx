import { IconArrowBackUp, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface RestoreButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
  variant?: 'preview' | 'details';
}

export const RestoreButton = ({
  onClick,
  isLoading = false,
  className,
  variant = 'preview'
}: RestoreButtonProps) => {
  // Определяем стили в зависимости от варианта
  const defaultClassName =
    variant === 'preview'
      ? 'h-7 w-7 rounded-full p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
      : 'h-9 w-9 flex-shrink-0 rounded-full p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700';

  // Определяем размер иконки в зависимости от варианта
  const iconSize = variant === 'preview' ? 'h-4 w-4' : 'h-5 w-5';

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
            {isLoading ? (
              <IconLoader2 className={`${iconSize} animate-spin text-zinc-500`} />
            ) : (
              <IconArrowBackUp className={iconSize} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Восстановить карточку</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
