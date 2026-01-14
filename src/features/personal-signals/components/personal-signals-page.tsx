'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePersonalSignalsActions } from '../hooks/use-personal-signals';
import { CardsList } from '@/features/shared/components/lists';
import { Button } from '@/components/ui/button';
import { IconRefresh, IconSettings, IconArrowUp } from '@tabler/icons-react';
import { usePersonalSignals } from '../contexts/personal-signals-context';
import { toast } from 'sonner';
import { FeedSettingsInline } from '@/features/shared/components/feeds/settings';
import { SearchInput } from '@/features/shared/components/feeds/search-input';
import { useCardOperations } from '@/features/shared/contexts/card-operations-context';
import { FiltersButton } from '@/features/shared/components/filters/filters-button';
import { FiltersProvider } from '@/features/shared/contexts/filters-context';
import { InfiniteScroll } from '@/features/shared/components/infinite-scroll/infinite-scroll';
import { NewProjectsSwitch } from '@/features/shared/components/feeds/new-projects-switch';
import { format } from 'date-fns';
import { formatDateForGraphQL } from '@/lib/format';

export function PersonalSignalsPage() {
  const {
    signals: initialSignals,
    isLoading,
    totalCount: initialTotalCount,
    currentPage,
    totalPages,
    loadPage,
    changePageSize,
    searchCards,
    currentFilters,
    fetchSignals,
    resetFilters
  } = usePersonalSignalsActions();

  // Local state for signals list to enable deletion without reload
  const [signals, setSignals] = useState(initialSignals);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  // Add state for tracking deleted cards
  const [deletedCardIds, setDeletedCardIds] = useState<number[]>([]);

  // Update local state when context data changes, filtering out deleted cards
  useEffect(() => {
    const filteredSignals = initialSignals.filter(
      (card) => !deletedCardIds.includes(card.id)
    );
    setSignals(filteredSignals);
    setTotalCount(initialTotalCount - deletedCardIds.length);
  }, [initialSignals, initialTotalCount, deletedCardIds]);

  const { handleToggleFavorite } = usePersonalSignals();
  const { deleteCard, restoreCard } = useCardOperations();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filtersData, setFiltersData] = useState({
    stages: [],
    rounds: [],
    participants: [],
    categories: []
  });

  const handleSearch = (query: string) => {
    searchCards(query);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setSearchQuery('');
    // Сбрасываем поисковый запрос
    searchCards('');
    resetFilters();
    // Clear deleted cards list when resetting filters
    setDeletedCardIds([]);
    // Сбрасываем состояние спиннера через небольшую задержку
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
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
    console.log(`[PersonalSignalsPage] Attempting to delete card ${cardId}`);

    // Find card in the list
    const card = signals.find((c) => c.id === cardId);
    if (!card) {
      console.error(
        `[PersonalSignalsPage] Card ${cardId} not found in signals list`
      );
      return;
    }

    const cardName = card.name || card.title || 'Untitled';

    // Immediate UI update - hide card instantly
    setSignals(prev => prev.filter(c => c.id !== cardId));
    setTotalCount(prev => Math.max(0, prev - 1));
    setDeletedCardIds((prev) => [...prev, cardId]);

    // Show toast with undo button (using toast without type)
    toast(`Карточка "${cardName}" скрыта`, {
      action: {
        label: 'Отменить',
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

    try {
      // Call delete method from CardOperations context
      console.log(
        `[PersonalSignalsPage] Calling deleteCard for card ${cardId}`
      );
      const success = await deleteCard(cardId);

      console.log(`[PersonalSignalsPage] Delete operation result: ${success}`);

      if (!success) {
        // If deletion failed, restore card
        setSignals(prev => [...prev, card]);
        setTotalCount(prev => prev + 1);
        setDeletedCardIds((prev) => prev.filter((id) => id !== cardId));

        console.error(`[PersonalSignalsPage] Failed to delete card ${cardId}`);
        toast.error(`Не удалось удалить карточку "${cardName}"`);
      }
    } catch (error) {
      // If error occurred, restore card
      setSignals(prev => [...prev, card]);
      setTotalCount(prev => prev + 1);
      setDeletedCardIds((prev) => prev.filter((id) => id !== cardId));

      console.error(`[PersonalSignalsPage] Error deleting card:`, error);
      toast.error(
        `Ошибка удаления карточки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  };

  const handleApplyFilters = (filters: Record<string, any>) => {
    setShowSettings(false);
    // Форматируем даты перед отправкой
    const formattedFilters = {
      ...filters,
      start_date: filters.start_date
        ? format(new Date(filters.start_date), 'dd.MM.yyyy')
        : undefined,
      end_date: filters.end_date
        ? format(new Date(filters.end_date), 'dd.MM.yyyy')
        : undefined
    };
    fetchSignals({ ...formattedFilters, page: 1, page_size: 20 });
  };

  // Function to load filter data
  const loadFilters = async () => {
    if (filtersLoaded) return;

    setIsLoadingFilters(true);
    try {
      const response = await fetch('/api/filters/all-signals');
      if (!response.ok) {
        throw new Error('Failed to load filter data');
      }

      const data = await response.json();
      if (data.success) {
        setFiltersData({
          stages: data.stages || [],
          rounds: data.rounds || [],
          participants: data.participants || [],
          categories: data.categories || []
        });
        setFiltersLoaded(true);
      } else {
        throw new Error(data.message || 'Error loading filter data');
      }
    } catch (error) {
      console.error('Error loading filters:', error);
      toast.error('Не удалось загрузить данные фильтров');
    } finally {
      setIsLoadingFilters(false);
    }
  };

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

  return (
    <div className='container mx-auto px-4 py-2 sm:px-6'>
      {/* Заголовок и фильтры - делаем липкими */}
      <div className='bg-background sticky top-0 z-10 mb-4 pt-4 pb-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>
            Личные сигналы
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
              <Button
                variant='outline'
                size='icon'
                onClick={() => setShowSettings(!showSettings)}
                className='relative'
              >
                <IconSettings className='h-4 w-4' />
                {Object.keys(currentFilters).some(
                  (key) =>
                    key !== 'page' &&
                    key !== 'page_size' &&
                    currentFilters[key] !== undefined &&
                    currentFilters[key] !== '' &&
                    !(key === 'min_sig' && currentFilters[key] === 1) &&
                    !(key === 'max_sig' && currentFilters[key] === 20)
                ) && (
                  <span className='bg-primary absolute top-0 right-0 h-2 w-2 rounded-full'></span>
                )}
              </Button>
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
                onLoadFilters={loadFilters}
                filtersLoaded={filtersLoaded}
                filtersEndpoint='/api/filters/personal'
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
              title='Настройки личных сигналов'
              onApply={(settings: any) => {
                const formattedSettings = {
                  ...settings,
                  // Convert dates to American format for API
                  start_date: settings.start_date
                    ? formatDateForGraphQL(settings.start_date)
                    : undefined,
                  end_date: settings.end_date
                    ? formatDateForGraphQL(settings.end_date)
                    : undefined
                };
                // Preserve existing filters while applying new settings
                fetchSignals({
                  ...currentFilters,
                  ...formattedSettings,
                  page: 1,
                  page_size: 20
                });
              }}
              onReset={resetFilters}
              onClose={() => setShowSettings(false)}
              initialSettings={{
                min_sig: currentFilters.min_sig || '1',
                max_sig: currentFilters.max_sig || '20',
                // Convert American format back to European for display
                start_date: currentFilters.start_date
                  ? formatDateForGraphQL(new Date(currentFilters.start_date))
                  : undefined,
                end_date: currentFilters.end_date
                  ? formatDateForGraphQL(new Date(currentFilters.end_date))
                  : undefined,
                hide_liked: currentFilters.hide_liked === 'true',
                trending: currentFilters.trending === 'true'
              }}
            />
          </div>
        )}
      </div>

      <div className='space-y-0.5'>
        <CardsList
          cards={signals}
          isLoading={isLoading}
          variant='default'
          emptyMessage='No personal signals found'
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
