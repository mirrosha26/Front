'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NotesCardsGraphQLProvider } from '../contexts/notes-cards-graphql-context';
import { useNotesCardsGraphQLActions } from '../hooks/use-notes-cards-graphql';
import { CardsList } from '@/features/shared/components/lists';
import { Button } from '@/components/ui/button';
import { IconRefresh, IconArrowUp } from '@tabler/icons-react';
import { InfiniteScroll } from '@/features/shared/components/infinite-scroll/infinite-scroll';
import { SearchInput } from '@/features/shared/components/feeds/search-input';
import { AvatarSkeleton } from '@/features/shared/components/ui/avatar-skeleton';
import { InvestorDetailModal } from '@/features/investors/components/public/investor-detail-modal';

// Internal component that uses the GraphQL context
function NotesCardsContent() {
  const {
    notesCards,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    searchCards,
    currentFilters,
    fetchNotesCards,
    handleDeleteNote,
    handleToggleFavorite,
    resetFilters,
    loadMore
  } = useNotesCardsGraphQLActions();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentInputValue, setCurrentInputValue] = useState('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Investor modal state
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [investorModalSlug, setInvestorModalSlug] = useState<string>('');

  // Отслеживаем прокрутку для показа кнопки "Наверх"
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Функция для прокрутки наверх
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchCards(query);
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentInputValue('');
    searchCards('');
  };

  // Refresh data handler
  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Reset to first page and reload
      await resetFilters();
      setSearchQuery('');
      setCurrentInputValue('');

      // Scroll to top after a short delay
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to load next batch of data
  const handleLoadMore = useCallback(async () => {
    if (hasNextPage && !isLoading) {
      await loadMore();
    }
  }, [hasNextPage, isLoading, loadMore]);

  const handleDeleteNoteClick = (cardId: number) => {
    handleDeleteNote(cardId);
  };

  const handleToggleSave = (cardId: number) => {
    handleToggleFavorite(cardId);
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

  return (
    <div className='w-full px-4 py-2 sm:px-6'>
      {/* Заголовок и поиск - делаем липкими */}
      <div className='bg-background sticky top-0 z-10 pt-4 pb-4 w-full'>
        <div className='flex items-center justify-between w-full'>
          <h1 className='text-2xl font-bold tracking-tight'>
            Карточки с заметками
          </h1>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <IconRefresh
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>

            <div className='flex-1 max-w-md'>
              <SearchInput
                onSearch={handleSearch}
                onClear={handleClearSearch}
                placeholder='Поиск...'
                initialValue={searchQuery}
                onValueChange={setCurrentInputValue}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card list */}
      <div className='py-4 w-full'>
        {/* Show loading skeletons when initially loading and no cards */}
        {isLoading && notesCards.length === 0 ? (
          <div className='space-y-4 w-full'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='enhanced-pulse w-full'>
                <div className='flex gap-4 rounded-lg border p-4 transition-transform duration-200 w-full bg-card hover:bg-accent/40'>
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
          <CardsList
            cards={notesCards.map((card) => ({
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
                  id: parseInt(cat.id) || 0
                })) || []
            }))}
            isLoading={false} // Don't show loading inside CardsList when we have cards
            variant='notes'
            emptyMessage='Карточки с заметками не найдены'
            onToggleSave={handleToggleSave}
            onDeleteNote={handleDeleteNoteClick}
            onOpenInvestorModal={handleOpenInvestorModal}
            hideDeleteButton={true}
          />
        )}

        {/* Infinite scroll component */}
        {notesCards.length > 0 && (
          <InfiniteScroll
            hasMore={hasNextPage}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            currentCount={notesCards.length}
            onLoadMore={handleLoadMore}
            completedText={`Все карточки загружены`}
          />
        )}
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
export function NotesCardsPage() {
  return (
    <NotesCardsGraphQLProvider>
      <NotesCardsContent />
    </NotesCardsGraphQLProvider>
  );
}
