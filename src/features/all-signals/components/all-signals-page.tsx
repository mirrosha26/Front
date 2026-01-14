'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAllSignalsActions } from '../hooks/use-all-signals';
import { CardsList } from '@/features/shared/components/lists';
import { Button } from '@/components/ui/button';
import { IconRefresh, IconArrowUp } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  FeedSettingsToggle,
  FeedSettingsInline
} from '@/features/shared/components/feeds/settings';
import { NewProjectsSwitch } from '@/features/shared/components/feeds/new-projects-switch';
import { SearchInput } from '@/features/shared/components/feeds/search-input';
import { useCardOperations } from '@/features/shared/contexts/card-operations-context';
import { FiltersButton } from '@/features/shared/components/filters/filters-button';
import { FiltersProvider } from '@/features/shared/contexts/filters-context';
import { InfiniteScroll } from '@/features/shared/components/infinite-scroll/infinite-scroll';

export function AllSignalsPage() {
  const {
    signals: initialSignals,
    isLoading,
    totalCount: initialTotalCount,
    currentPage,
    totalPages,
    loadPage,
    changePageSize,
    searchCards,
    searchQuery,
    currentFilters,
    fetchSignals,
    resetFilters,
    handleApplyFilters,
    filtersData,
    isLoadingFilters,
    filtersLoaded,
    fetchFiltersData,
    handleToggleFavorite
  } = useAllSignalsActions();

  // Local state for signals list to allow deletion without reload
  const [signals, setSignals] = useState(initialSignals);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  // Add state for tracking hidden cards
  const [deletedCardIds, setDeletedCardIds] = useState<number[]>([]);

  // Update local state when context data changes
  useEffect(() => {
    const filteredSignals = initialSignals.filter(
      (card) => !deletedCardIds.includes(card.id)
    );
    setSignals(filteredSignals);
    setTotalCount(initialTotalCount - deletedCardIds.length);
  }, [initialSignals, initialTotalCount, deletedCardIds]);

  const { deleteCard, restoreCard } = useCardOperations();

  const [showSettings, setShowSettings] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Отслеживаем прокрутку для показа кнопки "Наверх"
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300); // Показываем кнопку после прокрутки на 300px
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

  const handleSearch = (query: string) => {
    searchCards(query);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);

    // Сбрасываем поисковый запрос
    searchCards('');

    // Принудительно сбрасываем состояние и перезагружаем
    const forceRefresh = Date.now();

    // Добавляем параметр _refresh для принудительного обновления
    resetFilters().finally(() => {
      setIsRefreshing(false);
    });

    // Clear hidden cards list when resetting filters
    setDeletedCardIds([]);

    // Прокручиваем в начало с небольшой задержкой
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  // Function to load next batch of data
  const handleLoadMore = useCallback(async () => {
    await loadPage(currentPage + 1, true);
  }, [loadPage, currentPage]);

  const handleToggleSave = (cardId: number) => {
    handleToggleFavorite(cardId);
  };

  // Card deletion handler with undo button and standard notification type
  const handleDelete = async (cardId: number) => {
    console.log(`[AllSignalsPage] Attempting to delete card ${cardId}`);

    // Find card in list
    const card = signals.find((c) => c.id === cardId);
    if (!card) {
      console.error(
        `[AllSignalsPage] Card ${cardId} not found in signals list`
      );
      return;
    }

    const cardName = card.name || card.title || 'Untitled';

    // Immediate UI update - hide card instantly
    setSignals(prev => prev.filter(c => c.id !== cardId));
    setTotalCount(prev => Math.max(0, prev - 1));
    setDeletedCardIds((prev) => [...prev, cardId]);

    // Show toast with undo button (using toast without type specification)
    toast(`Карточка "${cardName}" скрыта`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          // Restore card immediately
          setSignals(prev => [...prev, card]);
          setTotalCount(prev => prev + 1);
          setDeletedCardIds((prev) => prev.filter((id) => id !== cardId));

          // Restore card on server
          const success = await restoreCard(cardId);
          if (success) {
            toast.success(`Карточка "${cardName}" восстановлена`);
          } else {
            toast.error(`Не удалось восстановить карточку "${cardName}"`);
          }
        }
      }
    });

    // Delete card on server
    try {
      const success = await deleteCard(cardId);
      if (!success) {
        // If deletion failed, restore card
        setSignals(prev => [...prev, card]);
        setTotalCount(prev => prev + 1);
        setDeletedCardIds((prev) => prev.filter((id) => id !== cardId));
        toast.error(`Не удалось удалить карточку "${cardName}"`);
      }
    } catch (error) {
      // If error occurred, restore card
      setSignals(prev => [...prev, card]);
      setTotalCount(prev => prev + 1);
      setDeletedCardIds((prev) => prev.filter((id) => id !== cardId));
      console.error('Error deleting card:', error);
      toast.error(`Не удалось удалить карточку "${cardName}"`);
    }
  };

  return (
    <div className='container mx-auto px-4 py-2 sm:px-6'>
      {/* Заголовок и фильтры - делаем липкими */}
      <div className='bg-background sticky top-0 z-10 mb-4 pt-4 pb-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>Все сигналы</h1>
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

            <SearchInput
              onSearch={handleSearch}
              onClear={handleRefresh}
              initialValue={searchQuery}
              placeholder='Поиск...'
            />

            <div className='flex items-center gap-2'>
              <NewProjectsSwitch
                checked={currentFilters.last_week === 'true'}
                onChange={(checked) => {
                  // Полный сброс фильтров при нажатии, но не закрываем форму
                  fetchSignals({
                    last_week: checked ? 'true' : undefined,
                    start_date: undefined,
                    end_date: undefined,
                    page: 1,
                    page_size: 20
                  });
                }}
              />
              <FeedSettingsToggle
                onSettingsClick={() => setShowSettings(!showSettings)}
                hasActiveFilters={Object.keys(currentFilters).some(
                  (key) =>
                    key !== 'page' &&
                    key !== 'page_size' &&
                    currentFilters[key] !== undefined &&
                    currentFilters[key] !== '' &&
                    !(key === 'min_sig' && currentFilters[key] === 1) &&
                    !(key === 'max_sig' && currentFilters[key] === 20)
                )}
              />
            </div>

            <FiltersProvider>
              <FiltersButton
                isLoading={isLoading}
                onApply={handleApplyFilters}
                onReset={handleRefresh}
                initialSettings={currentFilters}
                stages={filtersData.stages}
                rounds={filtersData.rounds}
                participants={filtersData.participants}
                categories={filtersData.categories}
                isLoadingFilters={isLoadingFilters}
                onLoadFilters={fetchFiltersData}
                filtersLoaded={filtersLoaded}
                filtersEndpoint='/api/filters/all-signals'
                buttonLabel='Фильтры'
                availableTabs={[
                  'participants',
                  'categories',
                  'stages',
                  'rounds'
                ]}
              />
            </FiltersProvider>
          </div>
        </div>

        {/* Feed Settings - Inline display when open */}
        {showSettings && (
          <div className='mb-4'>
            <FeedSettingsInline
              onApply={handleApplyFilters}
              onReset={handleRefresh}
              onClose={() => setShowSettings(false)}
              initialSettings={currentFilters}
              title='Настройки ленты'
              isNewProjectsActive={currentFilters.last_week === 'true'}
            />
          </div>
        )}
      </div>

      <div className='space-y-0.5'>
        <CardsList
          cards={signals}
          isLoading={isLoading || isRefreshing}
          variant='default'
          emptyMessage='Сигналы не найдены'
          onToggleSave={handleToggleSave}
          onDelete={handleDelete}
        />

        {/* Infinite scroll component */}
        {signals.length > 0 && (
          <InfiniteScroll
            hasMore={currentPage < totalPages}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            currentCount={signals.length}
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
    </div>
  );
}
