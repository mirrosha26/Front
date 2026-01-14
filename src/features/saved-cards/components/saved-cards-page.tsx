'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SavedCardsGraphQLProvider } from '../contexts/saved-cards-graphql-context';
import { useSavedCardsGraphQLActions } from '../hooks/use-saved-cards-graphql';
import { CardsList } from '@/features/shared/components/lists';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconRefresh, IconArrowUp, IconLoader2 } from '@tabler/icons-react';
import { useCardOperations } from '@/features/shared/contexts/card-operations-context';
import { FoldersList } from '@/features/folders/components/folders-list';
import { InfiniteScroll } from '@/features/shared/components/infinite-scroll/infinite-scroll';
import { SearchInput } from '@/features/shared/components/feeds/search-input';
import { AvatarSkeleton } from '@/features/shared/components/ui/avatar-skeleton';
import { InvestorDetailModal } from '@/features/investors/components/public/investor-detail-modal';

// Internal component that uses the GraphQL context
function SavedCardsContent() {
  const {
    savedCards,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    folderKey,
    searchQuery,
    loadPage,
    searchCards,
    currentFilters,
    fetchSavedCards,
    handleToggleFavorite,
    handleDelete,
    handleRemoveCard,
    changeFolderKey,
    resetFilters,
    loadMore
  } = useSavedCardsGraphQLActions();

  // deleteCard is now handled by the GraphQL context

  const [currentInputValue, setCurrentInputValue] = useState(searchQuery);
  const [selectedFolderKey, setSelectedFolderKey] = useState<string | null>(
    folderKey || 'default'
  );
  const [isFolderChanging, setIsFolderChanging] = useState(false);

  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Investor modal state
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [investorModalSlug, setInvestorModalSlug] = useState<string>('');

  // Мемоизируем обработчики для стабильности
  const memoizedHandleToggleFavorite = useCallback(
    (cardId: number) => {
      console.log('❤️ SavedCardsPage: toggling favorite for card:', cardId);
      return handleToggleFavorite(cardId);
    },
    [handleToggleFavorite]
  );

  const memoizedHandleDelete = useCallback(
    async (cardId: number) => {
      console.log('🗑️ SavedCardsPage: deleting card:', cardId);
      await handleDelete(cardId);
    },
    [handleDelete]
  );

  // Function to load next batch of data
  const handleLoadMore = useCallback(async () => {
    if (hasNextPage && !isLoading && !isFolderChanging) {
      await loadMore();
    }
  }, [hasNextPage, isLoading, isFolderChanging, loadMore]);

  // Search handler
  const handleSearch = (query: string) => {
    setCurrentInputValue(query);
    searchCards(query);
  };

  // Clear search handler
  const handleClearSearch = () => {
    setCurrentInputValue('');
    searchCards('');
  };

  // Refresh data handler
  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Reset to first page and reload
      await resetFilters();
      setCurrentInputValue('');

      // Scroll to top after a short delay
      setTimeout(() => {
        const scrollElement = scrollAreaRef.current?.querySelector(
          '[data-radix-scroll-area-viewport]'
        );
        if (scrollElement) {
          scrollElement.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }, 100);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Обработчик выбора папки with loading feedback
  const handleFolderSelect = async (folderKey: string | null) => {
    console.log('📁 Folder selected:', folderKey);

    // Set folder changing state to show loading feedback
    setIsFolderChanging(true);

    try {
      if (folderKey === 'all' || folderKey === null) {
        setSelectedFolderKey(null);
        await changeFolderKey('default');
      } else if (folderKey === 'default') {
        setSelectedFolderKey('default');
        await changeFolderKey('default');
      } else {
        setSelectedFolderKey(folderKey);
        await changeFolderKey(folderKey);
      }
    } finally {
      setIsFolderChanging(false);
    }
  };

  // Event handling is now managed by the GraphQL context

  // Отслеживаем прокрутку внутри ScrollArea
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    );

    if (!scrollElement) return;

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;
      setShowScrollToTop(scrollTop > 300);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Функция для прокрутки наверх внутри ScrollArea
  const scrollToTop = () => {
    const scrollElement = scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    );
    if (scrollElement) {
      scrollElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Function to open investor modal
  const handleOpenInvestorModal = useCallback((participantId: string, participantSlug: string) => {
    setInvestorModalSlug(participantSlug);
    setIsInvestorModalOpen(true);
  }, []);

  // Function to close investor modal
  const handleCloseInvestorModal = useCallback(() => {
    setIsInvestorModalOpen(false);
    setInvestorModalSlug('');
  }, []);

  // Determine if we should show loading state
  const shouldShowLoading =
    (isLoading || isRefreshing || isFolderChanging) && savedCards.length === 0;
  const shouldShowFolderChangeLoading =
    isFolderChanging && savedCards.length > 0;

  return (
    <div className='flex h-[calc(100vh-4rem)] overflow-hidden'>
      {/* Левая боковая панель с папками */}
      <div className='bg-background h-full w-60 flex-shrink-0 border-r p-4'>
        <FoldersList
          onFolderSelect={handleFolderSelect}
          selectedFolderKey={selectedFolderKey || 'default'}
        />
      </div>

      {/* Основная область с карточками */}
      <div className='flex h-full flex-1 flex-col'>
        {/* Заголовок и поиск - делаем липкими */}
        <div className='bg-background sticky top-0 z-10 flex items-center justify-between px-6 pt-4 pb-4'>
          <h1 className='text-2xl font-bold tracking-tight'>Сохраненные карточки</h1>

          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleRefresh}
              disabled={isRefreshing || isFolderChanging}
            >
              <IconRefresh
                className={`h-4 w-4 ${isRefreshing || isFolderChanging ? 'animate-spin' : ''}`}
              />
            </Button>

            <SearchInput
              onSearch={handleSearch}
              onClear={handleClearSearch}
              placeholder='Поиск...'
              initialValue={searchQuery}
              onValueChange={setCurrentInputValue}
            />
          </div>
        </div>

        {/* Folder change loading indicator */}
        {shouldShowFolderChangeLoading && (
          <div className='mb-4 px-6'>
            <div className='rounded-md border px-4 py-2'>
              <div className='flex items-center gap-2'>
                <IconLoader2 className='h-4 w-4 animate-spin' />
                <span className='text-sm '>
                  Загрузка содержимого папки...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Область списка карточек */}
        <div className='min-h-0 flex-1 px-6 py-4'>
          <ScrollArea ref={scrollAreaRef} className='h-full'>
            <div className='space-y-4'>
              {/* Show loading skeletons when initially loading and no cards */}
              {isLoading && savedCards.length === 0 ? (
                <div className='space-y-4'>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className='enhanced-pulse'>
                      <div className='flex gap-4 rounded-lg border p-4 transition-transform duration-200'>
                        <div className='bg-muted h-16 w-16 flex-shrink-0 rounded-lg'></div>
                        <div className='flex-1 space-y-2'>
                          <div className='bg-muted h-4 w-3/4 rounded'></div>
                          <div className='bg-muted h-3 w-1/2 rounded'></div>
                          <div className='flex gap-2'>
                            <div className='bg-muted h-5 w-16 rounded-full'></div>
                            <div className='bg-muted h-5 w-20 rounded-full'></div>
                          </div>
                        </div>
                        <div className='flex flex-col gap-2'>
                          <AvatarSkeleton count={3} size='sm' spacing='separate' />
                          <AvatarSkeleton count={4} size='lg' spacing='loose' />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <CardsList
                    cards={savedCards.map((card) => ({
                      ...card,
                      id: parseInt(card.id) || 0,
                      categories:
                        card.categories?.map((cat) => ({
                          ...cat,
                          id: parseInt(cat.id) || 0
                        })) || [],
                      categories_list:
                        card.categories?.map((cat) => ({
                          ...cat,
                          id: parseInt(card.id) || 0
                        })) || []
                    }))}
                    isLoading={false} // Don't show loading inside CardsList when we have cards
                    variant='saved'
                    emptyMessage='Сохраненные карточки не найдены'
                    onToggleSave={memoizedHandleToggleFavorite}
                    onDelete={memoizedHandleDelete}
                    onOpenInvestorModal={handleOpenInvestorModal}
                    chunkSize={10}
                  />

                  {/* Infinite scroll component */}
                  {savedCards.length > 0 && (
                    <InfiniteScroll
                      hasMore={hasNextPage}
                      isLoading={isLoading && !isFolderChanging} // Don't show pagination loading during folder changes
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalCount={totalCount}
                      currentCount={savedCards.length}
                      onLoadMore={handleLoadMore}
                      completedText={`Все карточки загружены`}
                    />
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Кнопка "Наверх" */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          size='icon'
          variant='default'
          className='bg-primary hover:bg-primary/90 fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full shadow-lg hover:scale-110'
          aria-label='Прокрутить наверх'
        >
          <IconArrowUp className='text-primary-foreground h-5 w-5' />
        </Button>
      )}

      {/* Investor Detail Modal */}
      {investorModalSlug && (
        <InvestorDetailModal
          isOpen={isInvestorModalOpen}
          onClose={handleCloseInvestorModal}
          slug={investorModalSlug}
        />
      )}
    </div>
  );
}

// Main component that provides the GraphQL context
export function SavedCardsPage() {
  const searchParams = useSearchParams();
  const initialFolderKey = searchParams.get('folder_key') || 'default';

  return (
    <SavedCardsGraphQLProvider initialFolderKey={initialFolderKey}>
      <SavedCardsContent />
    </SavedCardsGraphQLProvider>
  );
}
