'use client';

import React, { useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconSearch, IconFilter, IconX, IconUsers, IconBuilding, IconTarget, IconBriefcase, IconHeart, IconHeartOff } from '@tabler/icons-react';
import { useInvestorsGraphQL } from '../../contexts/investors-graphql-context';

// Статический список фильтров типов инвесторов
const INVESTOR_TYPE_FILTERS = [
  { 
    key: 'all', 
    label: 'Все', 
    icon: IconUsers
  },
  { 
    key: 'funds', 
    label: 'Фонды', 
    icon: IconBriefcase
  },
  { 
    key: 'fund_team_members', 
    label: 'Команда фонда', 
    icon: IconUsers
  },
  { 
    key: 'company', 
    label: 'Компания', 
    icon: IconBuilding
  },
  { 
    key: 'community', 
    label: 'Сообщество', 
    icon: IconUsers
  },
  { 
    key: 'angels', 
    label: 'Ангелы', 
    icon: IconTarget
  },
  { 
    key: 'founders', 
    label: 'Основатели', 
    icon: IconUsers
  },
  { 
    key: 'private', 
    label: 'Приватные', 
    icon: IconUsers
  }
] as const;

// Статический список статусов сохранения
const SAVED_STATUS_FILTERS = [
  { 
    key: 'all', 
    label: 'Все', 
    icon: IconUsers
  },
  { 
    key: 'saved', 
    label: 'Лайкнутые', 
    icon: IconHeart
  },
  { 
    key: 'not_saved', 
    label: 'Не лайкнутые', 
    icon: IconHeartOff
  }
] as const;

interface InvestorsFiltersSidebarProps {
  className?: string;
  onClose?: () => void;
}

export function InvestorsFiltersSidebar({ className, onClose }: InvestorsFiltersSidebarProps) {
  const {
    selectedFilters,
    searchTerm,
    toggleFilter,
    setSearchTerm,
    savedFilter,
    setSavedFilter
  } = useInvestorsGraphQL();

  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  // Обработчик поиска
  const handleSearch = async (query: string) => {
    setSearchTerm(query);
  };

  // Обработчик изменения фильтра сохранения
  const handleSavedFilterChange = (filterKey: 'all' | 'saved' | 'not_saved') => {
    console.log('🔍 Saved filter clicked:', {
      filterKey,
      currentSavedFilter: savedFilter,
      willChangeTo: filterKey,
      timestamp: new Date().toISOString()
    });
    
    // Проверяем, что setSavedFilter вызывается
    console.log('🔍 Calling setSavedFilter with:', filterKey);
    setSavedFilter(filterKey);
    
    // Проверяем, что состояние изменилось
    setTimeout(() => {
      console.log('🔍 After setSavedFilter, current state should be:', filterKey);
    }, 100);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Заголовок - фиксированный */}
      <div className='flex items-center justify-between p-4 flex-shrink-0'>
        <div className='flex items-center gap-2'>
          <IconFilter className='h-4 w-4' />
          <h3 className='font-semibold'>Фильтры</h3>
        </div>
        <div className='flex items-center gap-2'>
          {onClose && (
            <Button
              variant='ghost'
              size='icon'
              onClick={onClose}
              className='md:hidden'
            >
              <IconX className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>

      {/* Контент фильтров - скроллируемый */}
      <div 
        ref={sidebarScrollRef}
        data-sidebar-scroll
        className='flex-1 overflow-y-auto hover:overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:hover:scrollbar-track-gray-800'
      >
        <div className='p-4 space-y-6'>
          {/* Поиск */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Поиск</label>
            <div className='relative'>
              <IconSearch className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Поиск инвесторов...'
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          {/* Фильтр сохраненных карточек */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium text-foreground'>Статус лайка</h3>
            <div className='flex flex-wrap gap-1.5'>
              {SAVED_STATUS_FILTERS.map((filter) => {
                const isActive = savedFilter === filter.key;
                
                return (
                  <Badge
                    key={filter.key}
                    variant={isActive ? 'default' : 'secondary'}
                    className='justify-start cursor-pointer transition-colors'
                    onClick={() => {
                      console.log('🔍 Badge clicked:', filter.key);
                      handleSavedFilterChange(filter.key);
                    }}
                  >
                    <filter.icon className='h-3 w-3 mr-2' />
                    {filter.label}
                  </Badge>
                );
              })}
            </div>            
          </div>

          {/* Фильтры по типам инвесторов */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium text-foreground'>Типы инвесторов</h3>
            <div className='flex flex-wrap gap-1.5'>
              {INVESTOR_TYPE_FILTERS.map((filter) => {
                const isActive = filter.key === 'all'
                  ? selectedFilters.length === 0
                  : selectedFilters.includes(filter.key);
                
                return (
                  <Badge
                    key={filter.key}
                    variant={isActive ? 'default' : 'secondary'}
                    className='justify-start cursor-pointer transition-colors'
                    onClick={() => toggleFilter(filter.key)}
                  >
                    <filter.icon className='h-3 w-3 mr-2' />
                    {filter.label}
                  </Badge>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
} 