import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { CardPreviewComponent } from '../cards/card-preview';
import { CardPreview, CardVariant } from '../../types/cards';
import { useFolders } from '@/features/folders/contexts/folders-context';
import { AvatarSkeleton } from '../ui/avatar-skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

interface CardsListProps {
  cards: CardPreview[];
  isLoading?: boolean;
  variant?: CardVariant;
  emptyMessage?: string;
  onToggleSave?: (cardId: number) => void;
  onDelete?: (cardId: number) => void;
  onRestore?: (cardId: number) => void;
  onDeleteNote?: (cardId: number) => void;
  onStatusChange?: (cardId: number, isLiked: boolean) => void;
  onOpenInvestorModal?: (participantId: string, participantSlug: string) => void;
  hideDeleteButton?: boolean;
  currentFolderId?: string | null;
  chunkSize?: number;
}

export const CardsList: React.FC<CardsListProps> = ({
  cards: initialCards,
  isLoading = false,
  variant = 'default',
  emptyMessage = 'No cards found',
  onToggleSave,
  onDelete,
  onRestore,
  onDeleteNote,
  onStatusChange,
  onOpenInvestorModal,
  hideDeleteButton = false,
  currentFolderId = null,
  chunkSize = 50
}) => {
  const [visibleCards, setVisibleCards] = useState<CardPreview[]>(initialCards);
  const [initialCardsState, setInitialCardsState] =
    useState<CardPreview[]>(initialCards);
  const [hasCompletedFirstLoad, setHasCompletedFirstLoad] = useState(false);

  // Conditionally use useFolders only for variants that work with folders
  const folderContext =
    variant === 'saved' ? useFolders() : { selectedFolderKey: null };

  const { selectedFolderKey } = folderContext;

  // Update cards state when input data changes
  useEffect(() => {
    setVisibleCards(initialCards);
    setInitialCardsState(initialCards);

    if (!isLoading && initialCards !== undefined) {
      setHasCompletedFirstLoad(true);
    }
  }, [initialCards, isLoading]);

  // Мемоизируем обработчик удаления
  const handleDelete = useCallback(
    (cardId: number) => {
      if (currentFolderId && currentFolderId !== 'default') {
        setVisibleCards((prev) => prev.filter((c) => c.id !== cardId));
      }
      if (onDelete) onDelete(cardId);
    },
    [currentFolderId, onDelete, visibleCards.length]
  );

  // Listen for card removal from folder events only if this is a folder variant
  useEffect(() => {
    if (variant !== 'saved') {
      return;
    }

    const handleCardRemovedFromFolder = (event: CustomEvent) => {
      const { cardId, folderId } = event.detail;

      if (currentFolderId && currentFolderId === String(folderId)) {
        setVisibleCards((prev) => prev.filter((card) => card.id !== cardId));
      }
    };

    const handleFolderDeleted = (event: CustomEvent) => {
      const { folderId } = event.detail;

      if (currentFolderId && currentFolderId === String(folderId)) {
        setVisibleCards([]);
      }
    };

    window.addEventListener(
      'card-removed-from-folder',
      handleCardRemovedFromFolder as EventListener
    );
    window.addEventListener(
      'folder-deleted',
      handleFolderDeleted as EventListener
    );

    return () => {
      window.removeEventListener(
        'card-removed-from-folder',
        handleCardRemovedFromFolder as EventListener
      );
      window.removeEventListener(
        'folder-deleted',
        handleFolderDeleted as EventListener
      );
    };
  }, [currentFolderId, variant]);

  // Мемоизируем рендеринг карточек - теперь рендерим все карточки сразу чанками
  const renderedCards = useMemo(() => {
    // Дедуплицируем карточки по ID
    const uniqueCards = visibleCards.reduce((acc, card) => {
      if (!acc.find((existingCard) => existingCard.id === card.id)) {
        acc.push(card);
      }
      return acc;
    }, [] as CardPreview[]);

    // Рендерим все карточки - убираем ограничение по renderedCount
    return uniqueCards.map((card, index) => (
      <CardPreviewComponent
        key={`card-${card.id}-${index}`}
        card={card}
        variant={variant}
        onToggleSave={onToggleSave}
        onDelete={handleDelete}
        onRestore={onRestore}
        onDeleteNote={onDeleteNote}
        onStatusChange={onStatusChange}
        onOpenInvestorModal={onOpenInvestorModal}
        index={index}
        hideDeleteButton={hideDeleteButton}
        currentFolderId={currentFolderId}
      />
    ));
  }, [
    visibleCards,
    variant,
    onToggleSave,
    handleDelete,
    onRestore,
    onDeleteNote,
    onStatusChange,
    hideDeleteButton,
    currentFolderId
  ]);

  // Показываем скелетон если первая загрузка еще не завершена
  if (
    (!hasCompletedFirstLoad && visibleCards.length === 0) ||
    (initialCards.length > 0 && visibleCards.length === 0)
  ) {
    return (
      <div className='smooth-fade-in space-y-4 w-full'>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className='bg-card hover:bg-accent/40 px-3 py-3 w-full rounded-lg border'>
            <div className='flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:gap-3 w-full'>
              {/* Project section skeleton */}
              <div className='flex items-start space-x-3 lg:col-span-6'>
                <AvatarSkeleton />
                <div className='min-w-0 flex-1 space-y-2'>
                  <div className='h-4 w-3/4 rounded bg-muted/50' />
                  <div className='h-3 w-full rounded bg-muted/50' />
                  <div className='h-3 w-2/3 rounded bg-muted/50' />
                </div>
              </div>

              {/* Categories section skeleton */}
              <div className='flex items-start lg:col-span-3'>
                <div className='flex flex-wrap gap-1.5'>
                  <div className='h-5 w-16 rounded bg-muted/50' />
                  <div className='h-5 w-20 rounded bg-muted/50' />
                </div>
              </div>

              {/* Actions section skeleton */}
              <div className='flex items-center justify-between lg:col-span-3 lg:flex-col lg:items-end lg:justify-between lg:gap-3'>
                <div className='flex gap-1.5'>
                  <div className='h-8 w-8 rounded bg-muted/50' />
                  <div className='h-8 w-8 rounded bg-muted/50' />
                  <div className='h-8 w-8 rounded bg-muted/50' />
                </div>
                <AvatarSkeleton count={2} size='sm' />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Показываем пустое состояние
  if (hasCompletedFirstLoad && visibleCards.length === 0) {
    return (
      <div className='smooth-slide-up flex h-32 items-center justify-center rounded-lg border bg-white dark:bg-zinc-800/50'>
        <p className='text-muted-foreground text-sm'>{emptyMessage}</p>
      </div>
    );
  }

  // Показываем список карточек - убираем внутренний sentinel
  return (
    <div className='smooth-fade-in w-full overflow-hidden rounded-lg border bg-card'>
      {renderedCards}
    </div>
  );
};
