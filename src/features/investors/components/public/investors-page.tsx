'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  IconRefresh,
  IconSearch,
  IconArrowUp,
  IconLoader2
} from '@tabler/icons-react';
import { InvestorList } from './investor-list';
import {
  InvestorsProvider,
  useInvestors
} from '../../contexts/investors-context';
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Типы инвесторов для фильтрации
const INVESTOR_TYPES = [
  'private',
  'fund',
  'investor',
  'angel',
  'accelerator',
  'syndicate',
  'platform'
];

// Обертка для использования контекста
const InvestorsContent = () => {
  const {
    filteredInvestors,
    followedInvestors,
    availableInvestors,
    isLoading,
    fetchInvestors,
    searchTerm,
    setSearchTerm,
    selectedTypes,
    toggleType,
    followAllInvestors,
    unfollowAllInvestors,
    showFollowed,
    setShowFollowed
  } = useInvestors();

  // Состояние для отслеживания массовой операции
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Вычисляем количество инвесторов с учетом фильтров для обоих списков
  const filteredFollowedCount = useMemo(() => {
    return followedInvestors.filter(
      (investor) =>
        (searchTerm === '' ||
          investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          investor.additional_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(investor.type.toLowerCase()) ||
          (selectedTypes.includes('private') && investor.is_private))
    ).length;
  }, [followedInvestors, searchTerm, selectedTypes]);

  const filteredAvailableCount = useMemo(() => {
    return availableInvestors.filter(
      (investor) =>
        (searchTerm === '' ||
          investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          investor.additional_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(investor.type.toLowerCase()) ||
          (selectedTypes.includes('private') && investor.is_private))
    ).length;
  }, [availableInvestors, searchTerm, selectedTypes]);

  // Create separate filtered arrays for each tab
  const filteredFollowedInvestors = useMemo(() => {
    return followedInvestors.filter(
      (investor) =>
        (searchTerm === '' ||
          investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          investor.additional_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(investor.type.toLowerCase()) ||
          (selectedTypes.includes('private') && investor.is_private))
    );
  }, [followedInvestors, searchTerm, selectedTypes]);

  const filteredAvailableInvestors = useMemo(() => {
    return availableInvestors.filter(
      (investor) =>
        (searchTerm === '' ||
          investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          investor.additional_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(investor.type.toLowerCase()) ||
          (selectedTypes.includes('private') && investor.is_private))
    );
  }, [availableInvestors, searchTerm, selectedTypes]);

  // Обработчик переключения вкладок
  const handleTabChange = (value: string) => {
    if (value === 'following') {
      setShowFollowed(true);
      fetchInvestors(true, true);
    } else {
      setShowFollowed(false);
      fetchInvestors(false, true);
    }
  };

  // Проверяем, все ли отфильтрованные инвесторы отмечены
  const allFollowed = useMemo(() => {
    const currentFilteredInvestors = showFollowed
      ? filteredFollowedInvestors
      : filteredAvailableInvestors;
    return (
      currentFilteredInvestors.length > 0 &&
      currentFilteredInvestors.every((investor) => investor.is_followed)
    );
  }, [showFollowed, filteredFollowedInvestors, filteredAvailableInvestors]);

  // Обработчик массовой подписки/отписки
  const handleToggleAll = async () => {
    const currentFilteredInvestors = showFollowed
      ? filteredFollowedInvestors
      : filteredAvailableInvestors;
    if (currentFilteredInvestors.length === 0 || isBulkProcessing) return;

    setIsBulkProcessing(true);
    try {
      if (showFollowed) {
        await unfollowAllInvestors();
      } else {
        await followAllInvestors();
      }
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Загружаем данные для обеих вкладок при первом рендере
  useEffect(() => {
    fetchInvestors(true);

    setTimeout(() => {
      fetchInvestors(false);
    }, 100);
  }, []);

  return (
    <div className='container mx-auto px-4 py-2 sm:px-6'>
      <Tabs
        defaultValue='following'
        value={showFollowed ? 'following' : 'available'}
        onValueChange={handleTabChange}
        className='w-full'
      >
        {/* Заголовок, поиск, фильтры и табы - делаем липкими */}
        <div className='bg-background/90 backdrop-blur-sm sticky top-0 z-20 mb-2 pt-4 pb-4 border-b'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-2xl font-bold tracking-tight'>Инвесторы</h2>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => fetchInvestors(showFollowed, true)}
              disabled={isLoading}
            >
              <IconRefresh className='h-4 w-4' />
            </Button>
          </div>

          <div className='relative mb-4'>
            <IconSearch className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Поиск инвесторов...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='bg-background pl-9 shadow-none'
            />
          </div>

          <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              {INVESTOR_TYPES.map((type) => {
                const isActive = selectedTypes.includes(type);
                return (
                  <Badge
                    key={type}
                    variant={isActive ? 'default' : 'outline'}
                    className='cursor-pointer'
                    onClick={() => toggleType(type)}
                  >
                    {type === 'private'
                      ? 'Приватные'
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Badge>
                );
              })}
            </div>

            <Button
              variant='default'
              onClick={handleToggleAll}
              disabled={
                (showFollowed
                  ? filteredFollowedInvestors.length === 0
                  : filteredAvailableInvestors.length === 0) ||
                isLoading ||
                isBulkProcessing
              }
              className='flex items-center gap-2'
            >
              {isBulkProcessing ? (
                <>
                  <IconLoader2 className='h-4 w-4 animate-spin' />
                  {showFollowed ? 'Отписка...' : 'Подписка...'}
                </>
              ) : showFollowed ? (
                'Отписаться от всех'
              ) : (
                'Подписаться на всех'
              )}
            </Button>
          </div>

          <TabsList className='inline-flex h-8 gap-1'>
            <TabsTrigger
              value='following'
              className='flex items-center gap-2 px-3 py-0.5 text-sm'
            >
              Подписки
              <span className='bg-muted inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium'>
                {isLoading && showFollowed ? '...' : filteredFollowedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='available'
              className='flex items-center gap-2 px-3 py-0.5 text-sm'
            >
              Доступные
              <span className='bg-muted inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium'>
                {isLoading && !showFollowed ? '...' : filteredAvailableCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Контент табов */}
        <TabsContent value='following'>
          <InvestorList
            investors={filteredFollowedInvestors}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value='available'>
          <InvestorList
            investors={filteredAvailableInvestors}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export function InvestorsPage() {
  const [showScrollToTop, setShowScrollToTop] = useState(false);

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
    <InvestorsProvider>
      <InvestorsContent />
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
    </InvestorsProvider>
  );
}
