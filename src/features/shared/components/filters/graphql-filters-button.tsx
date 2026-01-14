'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  IconFilter,
  IconLoader2,
  IconSearch,
  IconChevronRight,
  IconChevronDown,
  IconHeart,
  IconHeartFilled
} from '@tabler/icons-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarSkeleton } from '../ui/avatar-skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  SignalCardFilters
} from '@/lib/graphql/types';

// Simple debounce function to avoid lodash dependency
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout;
  const debouncedFunction = ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel: () => void };

  debouncedFunction.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debouncedFunction;
}

interface GraphQLFiltersButtonProps {
  // Filter data
  categories: any[];
  participants: any[];
  stages: any[];
  rounds: any[];

  // Loading states
  basicFiltersLoading: boolean;
  participantsLoading: boolean;
  feedLoading?: boolean; // Add feed loading state

  // Pagination info (only participants now)
  participantsHasNextPage: boolean;

  // Current filter state
  activeFilters: SignalCardFilters;
  hasActiveFilters: boolean;
  activeFiltersCount: number;

  // Actions
  updateFilter: (key: keyof SignalCardFilters, value: any) => void;
  clearAllFilters: () => void;
  loadMoreParticipants: () => void;
  searchParticipants: (searchTerm: string) => void;

  // UI props
  buttonLabel?: string;
  availableTabs?: string[];
}

export function GraphQLFiltersButton({
  categories = [],
  participants = [],
  stages = [],
  rounds = [],
  basicFiltersLoading = false,
  participantsLoading = false,
  feedLoading = false,
  participantsHasNextPage = false,
  activeFilters = {},
  hasActiveFilters = false,
  activeFiltersCount = 0,
  updateFilter,
  clearAllFilters,
  loadMoreParticipants,
  searchParticipants,
  buttonLabel = 'Фильтры',
  availableTabs = ['participants', 'categories', 'stages']
}: GraphQLFiltersButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('participants');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
    new Set()
  );

  // Reset local search term when activeFilters.search changes (e.g., when clearing filters)
  useEffect(() => {
    if (!activeFilters.search && searchTerm) {
      setSearchTerm('');
    }
  }, [activeFilters.search, searchTerm]);

  // Refs for infinite scroll
  const participantsScrollRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isProcessingRef = useRef(false);

  // Debounced search for participants
  const debouncedSearchParticipants = useCallback(
    debounce((searchTerm: string) => {
      searchParticipants(searchTerm);
    }, 300),
    [searchParticipants]
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (activeTab === 'participants') {
      debouncedSearchParticipants(value);
    }
  };

  // Toggle region expansion
  const toggleRegion = (regionSlug: string) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(regionSlug)) {
      newExpanded.delete(regionSlug);
    } else {
      newExpanded.add(regionSlug);
    }
    setExpandedRegions(newExpanded);
  };


  // Handle filter toggle for arrays
  const handleArrayFilterToggle = (filterKey: string, value: string) => {
    const typedFilterKey = filterKey as keyof SignalCardFilters;
    const currentValues = Array.isArray(activeFilters[typedFilterKey])
      ? (activeFilters[typedFilterKey] as string[])
      : [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];

    updateFilter(typedFilterKey, newValues.length > 0 ? newValues : undefined);
  };

  // Get item value based on filter type
  const getItemValue = (item: any, filterKey: string) => {
    switch (filterKey) {
      case 'categories':
        return item.id; // Categories use ID
      case 'participants':
        return item.id; // Participants use ID
      case 'stages':
        return item.slug || item.name;
      default:
        return item.slug || item.name;
    }
  };

  // Get filtered items based on search
  const getFilteredItems = () => {
    const items =
      {
        participants,
        categories,
        stages,
        rounds
      }[activeTab] || [];

    if (!searchTerm) return items;

    return items.filter(
      (item: any) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle select all / deselect all
  const handleToggleSelectAll = () => {
    const filteredItems = getFilteredItems();
    const typedActiveTab = activeTab as keyof SignalCardFilters;
    const currentValues = Array.isArray(activeFilters[typedActiveTab])
      ? (activeFilters[typedActiveTab] as string[])
      : [];

    // Check if all filtered items are selected
    const allSelected = filteredItems.every((item) => {
      const value = getItemValue(item, activeTab);
      return currentValues.includes(value);
    });

    if (allSelected) {
      // Deselect all filtered items
      const valuesToRemove = filteredItems.map((item) =>
        getItemValue(item, activeTab)
      );
      const newValues = currentValues.filter(
        (v: string) => !valuesToRemove.includes(v)
      );
      updateFilter(
        typedActiveTab,
        newValues.length > 0 ? newValues : undefined
      );
    } else {
      // Select all filtered items
      const valuesToAdd = filteredItems.map((item) =>
        getItemValue(item, activeTab)
      );
      const newValues = Array.from(new Set([...currentValues, ...valuesToAdd]));
      updateFilter(typedActiveTab, newValues);
    }
  };

  // Handle select all favorites investors
  const handleSelectAllFavorites = () => {
    if (activeTab !== 'participants') return;

    const filteredItems = getFilteredItems();
    const currentValues = Array.isArray(activeFilters.participants)
      ? activeFilters.participants
      : [];

    // Filter only favorites investors
    const favoritesInvestors = filteredItems.filter((item) => item.isPrivate);

    if (favoritesInvestors.length === 0) return;

    // Get IDs of favorites investors
    const favoritesInvestorIds = favoritesInvestors.map((item) => item.id);

    // Add favorites investor IDs to current selection
    const newValues = Array.from(
      new Set([...currentValues, ...favoritesInvestorIds])
    );
    updateFilter('participants', newValues);
  };

  // Check if all filtered items are selected
  const areAllSelected = () => {
    const filteredItems = getFilteredItems();
    const typedActiveTab = activeTab as keyof SignalCardFilters;
    const currentValues = Array.isArray(activeFilters[typedActiveTab])
      ? (activeFilters[typedActiveTab] as string[])
      : [];

    return (
      filteredItems.length > 0 &&
      filteredItems.every((item) => {
        const value = getItemValue(item, activeTab);
        return currentValues.includes(value);
      })
    );
  };

  // Check if all favorites investors are selected
  const areAllFavoritesSelected = () => {
    if (activeTab !== 'participants') return false;

    const filteredItems = getFilteredItems();
    const currentValues = Array.isArray(activeFilters.participants)
      ? activeFilters.participants
      : [];

    // Filter only favorites investors
    const favoritesInvestors = filteredItems.filter((item) => item.isPrivate);

    if (favoritesInvestors.length === 0) return false;

    // Check if all favorites investors are selected
    return favoritesInvestors.every((item) => currentValues.includes(item.id));
  };

  // Handle load more with proper async handling
  const handleLoadMore = useCallback(async () => {
    if (
      isProcessingRef.current ||
      !participantsHasNextPage ||
      participantsLoading ||
      activeTab !== 'participants'
    ) {
      return;
    }

    isProcessingRef.current = true;

    try {
      await loadMoreParticipants();
    } catch (error) {
      console.error('❌ Error loading more participants:', error);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100); // Reduced delay for faster response
    }
  }, [
    participantsHasNextPage,
    participantsLoading,
    activeTab,
    loadMoreParticipants
  ]);

  // Set up intersection observer and scroll listener for infinite scroll
  useEffect(() => {
    if (activeTab !== 'participants' || !participantsHasNextPage) {
      return;
    }

    // Use setTimeout to wait for DOM to be ready
    const timeoutId = setTimeout(() => {
      if (!loadMoreTriggerRef.current) {
        return;
      }

      const element = loadMoreTriggerRef.current;

      // Find the scroll container (Radix ScrollArea viewport)
      const scrollContainer =
        element.closest('[data-radix-scroll-area-viewport]') ||
        element.closest('.overflow-y-auto') ||
        participantsScrollRef.current;

      console.log('🔧 Setting up scroll detection:', {
        hasElement: !!element,
        hasScrollContainer: !!scrollContainer,
        scrollContainerClass: scrollContainer?.className,
        hasMore: participantsHasNextPage,
        isLoading: participantsLoading,
        elementRect: element.getBoundingClientRect()
      });

      // Scroll event listener as primary method for ScrollArea
      const handleScroll = () => {
        if (!element || !scrollContainer || isProcessingRef.current) return;

        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        // Check if element is visible (trigger when halfway through the list)
        const isNearBottom = elementRect.top <= containerRect.bottom + 300;

        console.log('📜 Scroll event triggered:', {
          containerBottom: containerRect.bottom,
          elementTop: elementRect.top,
          isNearBottom,
          hasMore: participantsHasNextPage,
          isLoading: participantsLoading,
          isProcessing: isProcessingRef.current
        });

        if (
          isNearBottom &&
          participantsHasNextPage &&
          !participantsLoading &&
          !isProcessingRef.current
        ) {
          console.log('🚀 Loading more via scroll listener!');
          handleLoadMore();
        }
      };

      // Add scroll listener
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll, {
          passive: true
        });
      }

      // Intersection observer as fallback
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          console.log('👀 Intersection observer triggered:', {
            isIntersecting: entry.isIntersecting,
            hasMore: participantsHasNextPage,
            isLoading: participantsLoading,
            isProcessing: isProcessingRef.current,
            intersectionRatio: entry.intersectionRatio,
            boundingClientRect: entry.boundingClientRect
          });

          if (
            entry.isIntersecting &&
            participantsHasNextPage &&
            !participantsLoading &&
            !isProcessingRef.current
          ) {
            console.log('🔄 Loading more content via intersection observer!');
            handleLoadMore();
          }
        },
        {
          root:
            scrollContainer === participantsScrollRef.current
              ? scrollContainer
              : null,
          threshold: 0.1,
          rootMargin: '300px' // Trigger much earlier - when 300px away
        }
      );

      console.log(
        '📍 Setting up both scroll listener and intersection observer'
      );
      observer.observe(element);
      observerRef.current = observer;

      return () => {
        if (scrollContainer) {
          scrollContainer.removeEventListener('scroll', handleScroll);
        }
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      };
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        console.log('🧹 Cleaning up intersection observer');
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [activeTab, participantsHasNextPage, participantsLoading, handleLoadMore]);

  // Reset search when changing tabs
  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  const renderTabContent = () => {

    const filteredItems = getFilteredItems();
    const typedActiveTab = activeTab as keyof SignalCardFilters;
    const currentValues = Array.isArray(activeFilters[typedActiveTab])
      ? (activeFilters[typedActiveTab] as string[])
      : [];
    const isLoading =
      activeTab === 'participants' ? participantsLoading : basicFiltersLoading;

    if (isLoading && filteredItems.length === 0) {
      return (
        <div className='space-y-2'>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className='h-8 w-full' />
          ))}
        </div>
      );
    }

    return (
      <div className='flex h-full flex-col space-y-3'>
        {/* Search Input */}
        <div className='relative flex-shrink-0'>
          <IconSearch className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
          <Input
            placeholder={`Поиск ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='pl-8'
          />
        </div>

        {/* Results count and Select All */}
        <div className='flex flex-shrink-0 items-center justify-between'>
          <span className='text-muted-foreground text-sm'>
            Found: {filteredItems.length}
          </span>
          <div className='flex gap-2'>
            {activeTab === 'participants' &&
              (() => {
                const privateInvestors = filteredItems.filter(
                  (item) => item.isPrivate
                );
                const selectedFavoritesCount = privateInvestors.filter((item) =>
                  currentValues.includes(item.id)
                ).length;
                const totalFavoritesCount = privateInvestors.length;

                return (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleSelectAllFavorites}
                    disabled={totalFavoritesCount === 0}
                    title={`${selectedFavoritesCount}/${totalFavoritesCount} избранных инвесторов выбрано`}
                  >
                    Выбрать все избранное
                    {totalFavoritesCount > 0 && (
                      <span className='ml-1 text-xs opacity-70'>
                        ({selectedFavoritesCount}/{totalFavoritesCount})
                      </span>
                    )}
                  </Button>
                );
              })()}
            <Button
              variant='ghost'
              size='sm'
              onClick={handleToggleSelectAll}
              disabled={filteredItems.length === 0}
            >
              {areAllSelected() ? 'Отменить выбор всех' : 'Выбрать все'}
            </Button>
          </div>
        </div>

        {/* Filter Items */}
        <div
          ref={participantsScrollRef}
          className='flex-1 overflow-y-auto overscroll-contain'
        >
          <div className='space-y-1 p-1'>
            {filteredItems.map((item, index) => {
              const value = getItemValue(item, activeTab);
              const isActive = currentValues.includes(value);

              return (
                <Badge
                  key={`${activeTab}-${item.id || value}-${index}`}
                  variant={isActive ? 'default' : 'outline'}
                  className='mr-2 mb-2 cursor-pointer hover:opacity-80'
                  onClick={() => handleArrayFilterToggle(activeTab, value)}
                >
                  {activeTab === 'participants' && item.imageUrl && (
                    <Avatar className='mr-2 h-4 w-4'>
                      <AvatarImage src={item.imageUrl} alt={item.name} />
                      <AvatarFallback className='text-xs'>
                        {item.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className='flex items-center gap-1'>
                    {item.name}
                    {activeTab === 'participants' && item.isSaved && !item.isPrivate && (
                      <IconHeartFilled className='h-3 w-3 text-red-500' />
                    )}
                  </span>
                  {activeTab === 'participants' && item.type && (
                    <span className='ml-1 text-xs font-medium opacity-70'>
                      {item.type}
                    </span>
                  )}
                  {activeTab === 'participants' && item.isPrivate && (
                    <span className='ml-1 text-xs opacity-60'>(Приватный)</span>
                  )}
                </Badge>
              );
            })}

            {/* Subtle loading indicator for participants */}
            {activeTab === 'participants' && participantsHasNextPage && (
              <div
                ref={loadMoreTriggerRef}
                className='flex min-h-[20px] justify-center py-2'
              >
                {participantsLoading || isProcessingRef.current ? (
                  <div className='flex items-center gap-1 opacity-50'>
                    <IconLoader2 className='h-2 w-2 animate-spin' />
                    <span className='text-muted-foreground text-xs'>
                      Загрузка...
                    </span>
                  </div>
                ) : (
                  <div className='text-muted-foreground text-xs opacity-30'>
                    •••
                  </div>
                )}
              </div>
            )}

            {/* Skeleton loading for incoming participants */}
            {activeTab === 'participants' &&
              (participantsLoading || isProcessingRef.current) && (
                <div className='animate-pulse space-y-1'>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className='flex gap-2 opacity-30'
                    >
                      <AvatarSkeleton count={1} size='sm' />
                      <div className='bg-muted h-6 flex-1 rounded'></div>
                    </div>
                  ))}
                </div>
              )}

            {/* All participants loaded indicator */}
            {activeTab === 'participants' &&
              !participantsHasNextPage &&
              participants.length > 0 && (
                <div className='text-muted-foreground flex justify-center py-2 text-xs opacity-50'>
                  Все участники загружены ({participants.length} всего)
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant='outline'
          className='relative gap-1 px-2 sm:gap-2 sm:px-3'
          disabled={feedLoading}
        >
          {feedLoading ? (
            <IconLoader2 className='h-4 w-4 animate-spin' />
          ) : (
            <IconFilter className='h-4 w-4' />
          )}
          {/* Show text only on sm screens and above */}
          <span className='hidden sm:inline'>{buttonLabel}</span>
          {hasActiveFilters && activeFiltersCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-2 -right-1 h-4 w-4 rounded-full p-0 text-xs sm:-right-2 sm:h-5 sm:w-5'
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className='flex w-full max-w-full flex-col overflow-hidden sm:w-[400px] sm:max-w-[400px] lg:w-[450px] lg:max-w-[450px]'>
        <SheetHeader className='flex-shrink-0 border-b pb-4'>
          <SheetTitle>Опции фильтров</SheetTitle>
        </SheetHeader>

        <div className='flex min-h-0 flex-1 flex-col'>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='flex min-h-0 flex-1 flex-col'
          >
            <TabsList className='mb-4 grid w-full flex-shrink-0 grid-cols-4'>
              {availableTabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className='text-xs capitalize'
                >
                  {tab === 'participants' ? 'Участники' : tab === 'categories' ? 'Категории' : tab === 'stages' ? 'Стадии' : tab === 'rounds' ? 'Раунды' : tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {availableTabs.map((tab) => (
              <TabsContent key={tab} value={tab} className='min-h-0 flex-1'>
                {renderTabContent()}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <SheetFooter className='flex-shrink-0 border-t pt-4'>
          <div className='flex w-full gap-2'>
            <Button
              variant='outline'
              onClick={async () => {
                await clearAllFilters();
                setIsOpen(false);
              }}
              className='flex-1'
              disabled={feedLoading}
            >
              {feedLoading ? (
                <>
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                  Сброс...
                </>
              ) : (
                'Сбросить'
              )}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className='flex-1'
              disabled={feedLoading}
            >
              Применить
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
