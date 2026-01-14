import { IconHeart, IconHeartFilled, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface LikeButtonProps {
  onClick: () => void;
  isLiked: boolean;
  isLoading?: boolean;
  className?: string;
  variant?: 'preview' | 'details';
}

export const LikeButton = ({
  onClick,
  isLiked,
  isLoading = false,
  className,
  variant = 'preview'
}: LikeButtonProps) => {
  // Определяем стили в зависимости от варианта и состояния
  const defaultClassName =
    variant === 'preview'
      ? `h-7 w-7 rounded-full p-0 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800`
      : `h-9 w-9 flex-shrink-0 rounded-full p-0 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800`;

  // Определяем размер иконки в зависимости от варианта
  const iconSize = variant === 'preview' ? 'h-4 w-4' : 'h-5 w-5';

  // Определяем цвет иконки в зависимости от состояния лайка
  const iconClassName = isLiked ? 'text-red-500' : '';

  // Обработчик клика с предотвращением всплытия события
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔍 LikeButton clicked:', { isLiked, isLoading, variant });
    console.log('🚀 Calling onClick function...');
    onClick();
    console.log('✅ onClick function called');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleClick}
            disabled={isLoading}
            className={className || defaultClassName}
          >
            {isLoading ? (
              <IconLoader2 className={`${iconSize} animate-spin text-zinc-500`} />
            ) : isLiked ? (
              <IconHeartFilled className={`${iconSize} ${iconClassName}`} />
            ) : (
              <IconHeart className={iconSize} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isLiked ? 'Remove from favorites' : 'Add to favorites'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
