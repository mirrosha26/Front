import { Sticker, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoteButtonProps {
  onClick: () => void;
  hasNote: boolean;
  isLoading?: boolean;
  className?: string;
  variant?: 'preview' | 'details';
}

export const NoteButton = ({
  onClick,
  hasNote,
  isLoading = false,
  className,
  variant = 'preview'
}: NoteButtonProps) => {
  const defaultClassName =
    variant === 'preview'
      ? 'h-7 w-7 rounded-full p-0 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      : 'h-9 w-9 flex-shrink-0 rounded-full p-0 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800';

  const iconSize = variant === 'preview' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={onClick}
      disabled={isLoading}
      className={className || defaultClassName}
    >
      {hasNote ? (
        <Sticker className={`${iconSize} text-primary`} />
      ) : (
        <StickyNote className={iconSize} />
      )}
    </Button>
  );
};
