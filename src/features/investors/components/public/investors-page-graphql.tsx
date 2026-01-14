'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconArrowUp, IconFilter, IconRefresh } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import {
  useInvestorsGraphQL,
  InvestorTab
} from '../../contexts/investors-graphql-context';
import { InvestorListGraphQL } from './investor-list-graphql';
import { InvestorsFiltersSidebar } from './investors-filters-sidebar';
import { Participant } from '@/lib/graphql/types';
import { toast } from 'sonner';
import { InfiniteScroll } from '@/features/shared/components/infinite-scroll/infinite-scroll';

export function InvestorsPageGraphQL() {
  const pathname = usePathname();
  const isPublicPage = pathname?.startsWith('/investors') && !pathname?.startsWith('/app/investors');
  
  const {
    allInvestors,
    angels,
    funds,
    fundTeamMembers,
    company,
    community,
    founders,
    privateParticipants,
    selectedFilters,
    searchTerm,
    isLoading,
    isLoadingMore,
    error,
    allPagination,
    angelsPagination,
    fundsPagination,
    companyPagination,
    communityPagination,
    foundersPagination,
    privatePagination,
    loadMoreInvestors,
    loadMoreData,
    toggleFollow
  } = useInvestorsGraphQL();

  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Refs для элементов скролла
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Сохраняем позицию скролла при изменении
  useEffect(() => {
    const mainElement = mainScrollRef.current;

    const handleMainScroll = (): void => {
      if (mainElement) {
        // Сохраняем позицию скролла в sessionStorage
        sessionStorage.setItem('investors_main_scroll', mainElement.scrollTop.toString());
      }
    };

    if (mainElement) {
      mainElement.addEventListener('scroll', handleMainScroll);
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleMainScroll);
      }
    };
  }, []);

  // Восстанавливаем позицию скролла при монтировании
  useEffect(() => {
    const savedScrollTop = sessionStorage.getItem('investors_main_scroll');
    if (savedScrollTop && mainScrollRef.current) {
      const scrollTop = parseInt(savedScrollTop, 10);
      if (!isNaN(scrollTop)) {
        setTimeout(() => {
          if (mainScrollRef.current) {
            mainScrollRef.current.scrollTop = scrollTop;
          }
        }, 100);
      }
    }
  }, []);

  // Очищаем сохраненные позиции скролла при уходе со страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Сохраняем текущую позицию скролла перед уходом
      if (mainScrollRef.current) {
        sessionStorage.setItem('investors_main_scroll', mainScrollRef.current.scrollTop.toString());
      }
    };

    const handlePageHide = () => {
      // Очищаем сохраненные позиции при переходе на другую страницу
      if (!window.location.pathname.includes('/investors')) {
        sessionStorage.removeItem('investors_main_scroll');
        sessionStorage.removeItem('investors_sidebar_scroll');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // Получаем объединенные данные для выбранных фильтров
  const getFilteredData = () => {
    console.log('🔍 getFilteredData called with:', {
      selectedFilters,
      allInvestors: allInvestors.length,
      angels: angels.length,
      funds: funds.length,
      company: company.length,
      community: community.length,
      founders: founders.length,
      privateParticipants: privateParticipants.length
    });

    const allData: Participant[] = [];
    const allPaginationData = {
      hasNextPage: false,
      totalCount: 0
    };

    // Если нет фильтров (выбрано "All"), показываем все
    if (selectedFilters.length === 0 || selectedFilters.includes('all')) {
      return {
        investors: allInvestors,
        pagination: allPagination,
        title: 'Все инвесторы',
        description: 'Просмотр всех точек данных, отслеживаемых нами'
      };
    }

    // Объединяем данные из выбранных фильтров
    selectedFilters.forEach(filter => {
      switch (filter) {
        case 'angels':
          allData.push(...angels);
          allPaginationData.hasNextPage = allPaginationData.hasNextPage || angelsPagination.hasNextPage;
          allPaginationData.totalCount += angelsPagination.totalCount;
          break;
        case 'funds':
          allData.push(...funds);
          allPaginationData.hasNextPage = allPaginationData.hasNextPage || fundsPagination.hasNextPage;
          allPaginationData.totalCount += fundsPagination.totalCount;
          break;
        case 'fund_team_members':
          allData.push(...funds);
          allPaginationData.hasNextPage = allPaginationData.hasNextPage || fundsPagination.hasNextPage;
          allPaginationData.totalCount += fundsPagination.totalCount;
          break;
        case 'company':
          allData.push(...company);
          allPaginationData.hasNextPage = allPaginationData.hasNextPage || companyPagination.hasNextPage;
          allPaginationData.totalCount += companyPagination.totalCount;
          break;
        case 'community':
          allData.push(...community);
          allPaginationData.hasNextPage = allPaginationData.hasNextPage || communityPagination.hasNextPage;
          allPaginationData.totalCount += communityPagination.totalCount;
          break;
        case 'founders':
          allData.push(...founders);
          allPaginationData.hasNextPage = allPaginationData.hasNextPage || foundersPagination.hasNextPage;
          allPaginationData.totalCount += foundersPagination.totalCount;
          break;
        case 'private':
          allData.push(...privateParticipants);
          allPaginationData.hasNextPage = allPaginationData.hasNextPage || privatePagination.hasNextPage;
          allPaginationData.totalCount += privatePagination.totalCount;
          break;
      }
    });

    // Удаляем дубликаты по ID
    const uniqueInvestors = allData.filter((investor, index, self) => 
      index === self.findIndex(i => i.id === investor.id)
    );

    const filterLabels = selectedFilters.map(filter => {
      const filterConfig = [
        { key: 'all', label: 'Все' },
        { key: 'funds', label: 'Фонды' },
        { key: 'fund_team_members', label: 'Команда фонда' },
        { key: 'company', label: 'Компания' },
        { key: 'community', label: 'Сообщество' },
        { key: 'angels', label: 'Ангелы' },
        { key: 'founders', label: 'Основатели' },
        { key: 'private', label: 'Приватные' }
      ].find(f => f.key === filter);
      return filterConfig?.label || filter;
    }).join(', ');

    return {
      investors: uniqueInvestors,
      pagination: allPaginationData,
      title: selectedFilters.length === 1 ? filterLabels : `Несколько типов (${selectedFilters.length})`,
      description: `Показано ${selectedFilters.length === 1 ? filterLabels : 'несколько типов инвесторов'}`
    };
  };

  const currentFilterData = getFilteredData();

  // Определяем, нужно ли показывать скелетон
  // Скелетон показывается только при загрузке, а не при пустом списке
  const shouldShowSkeleton = isLoading;

  // Обработчик предварительного просмотра сигналов
  const handlePreviewSignals = useCallback((investor: Participant) => {
    // Здесь можно открыть модальное окно или перейти на страницу с сигналами
    toast.info(`Предпросмотр сигналов для ${investor.name} - Функция скоро будет доступна!`);
  }, []);

  // Обработчик загрузки дополнительных данных
  const handleLoadMore = useCallback(async () => {
    await loadMoreInvestors();
  }, [loadMoreInvestors]);

  const scrollToTop = () => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    }
  };

  return (
    <div className='flex h-full'>
      {/* Боковая панель с фильтрами */}
      <div className={`w-80 border-r bg-background transition-all duration-300 ${
        showFilters ? 'translate-x-0' : '-translate-x-full'
      } fixed left-0 top-0 h-full z-40 md:relative md:translate-x-0 md:left-0`}>
        <InvestorsFiltersSidebar onClose={() => setShowFilters(false)} />
      </div>

      {/* Основной контент */}
      <div className='flex-1 flex flex-col min-w-0 md:ml-0 h-full'>
        {/* Заголовок и кнопка фильтров */}
        <div className='bg-background border-b p-4 flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div className='flex flex-col'>
              <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
                {currentFilterData.title}
                {isLoading && (
                  <IconRefresh className='h-5 w-5 animate-spin text-muted-foreground' />
                )}
              </h1>
              <p className='text-muted-foreground text-sm'>
                {currentFilterData.description}
              </p>
              {searchTerm && (
                <p className='text-sm text-muted-foreground mt-1'>
                  Результаты поиска для: "{searchTerm}"
                </p>
              )}
              {/* Активные фильтры как теги */}
              {selectedFilters.length > 1 && (
                <div className='flex flex-wrap gap-1 mt-2'>
                  {selectedFilters.map(filter => {
                    const filterConfig = [
                      { key: 'all', label: 'Все' },
                      { key: 'funds', label: 'Фонды' },
                      { key: 'fund_team_members', label: 'Команда фонда' },
                      { key: 'company', label: 'Компания' },
                      { key: 'community', label: 'Сообщество' },
                      { key: 'angels', label: 'Ангелы' },
                      { key: 'founders', label: 'Основатели' },
                      { key: 'private', label: 'Приватные' }
                    ].find(f => f.key === filter);
                    
                    return (
                      <Badge
                        key={filter}
                        variant='outline'
                        className='text-xs transition-colors hover:bg-muted/50'
                      >
                        {filterConfig?.label || filter}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowFilters(!showFilters)}
              className='md:hidden'
            >
              <IconFilter className='h-4 w-4 mr-2' />
              Фильтры
            </Button>
          </div>
        </div>

        {/* Контент с независимым скроллом */}
        <div 
          ref={mainScrollRef}
          data-main-scroll
          className='flex-1 overflow-y-auto hover:overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:hover:scrollbar-track-gray-800'
        >
          <div className='p-4'>
          <InvestorListGraphQL
              investors={currentFilterData.investors}
              isLoading={shouldShowSkeleton}
              isLoadingMore={isLoadingMore}
            onPreviewSignals={handlePreviewSignals}
            onToggleFollow={isPublicPage ? undefined : toggleFollow}
            />
            {currentFilterData.investors.length > 0 && (
            <InfiniteScroll
                hasMore={currentFilterData.pagination.hasNextPage}
                isLoading={isLoading}
              currentPage={1}
              totalPages={1}
                totalCount={currentFilterData.pagination.totalCount}
                currentCount={currentFilterData.investors.length}
              onLoadMore={handleLoadMore}
                rootMargin="100px"  // ← Изменено с 200px на 100px
                threshold={0.1}
                completedText={`Все ${currentFilterData.title} загружены`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Overlay для мобильных устройств */}
      {showFilters && (
        <div 
          className='fixed inset-0 bg-black/50 z-30 md:hidden'
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Отображение ошибок */}
      {error && (
        <div className='fixed bottom-4 right-4 z-50 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400 max-w-sm'>
          <p className='text-sm'>{error}</p>
        </div>
      )}

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
