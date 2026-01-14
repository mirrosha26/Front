import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconFilter, IconLoader2, IconSearch } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilters } from '../../contexts/filters-context';
import { toast } from 'sonner';

interface FiltersButtonProps {
  isLoading?: boolean;
  className?: string;
  onApply: (filters: Record<string, any>) => void;
  onReset: () => void;
  initialSettings: Record<string, any>;
  stages: any[];
  rounds: any[];
  participants: any[];
  categories: any[];
  isLoadingFilters: boolean;
  onLoadFilters: () => Promise<void>;
  filtersLoaded: boolean;
  buttonLabel?: string;
  filtersEndpoint: string;
  availableTabs: string[];
}

export const FiltersButton: React.FC<FiltersButtonProps> = ({
  isLoading = false,
  className,
  onApply,
  onReset,
  initialSettings,
  stages = [],
  rounds = [],
  participants = [],
  categories = [],
  isLoadingFilters,
  onLoadFilters,
  filtersLoaded,
  buttonLabel = 'Фильтры',
  filtersEndpoint,
  availableTabs
}) => {
  const {
    localFilters,
    activeFilters,
    activeFiltersCount,
    isOpen,
    setIsOpen,
    activeTab,
    handleTabChange,
    searchQuery,
    setSearchQuery,
    filteredOptions,
    handleFilterChange,
    handleToggleSelectAll,
    initializeFilters,
    applyFilters,
    tabsModified,
    resetAllFilters,
    setActiveTab,
    availableTabs: contextAvailableTabs
  } = useFilters();

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load filters when panel opens
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);

    // Initialize filters if panel is opening
    if (open) {
      setIsLoadingData(true);
      try {
        // Initialize filters from API with available tabs
        await initializeFilters(filtersEndpoint, availableTabs);

        // Call onLoadFilters to update parent component state
        await onLoadFilters();
      } catch (error) {
        console.error('Error loading filters:', error);
        toast.error('Не удалось загрузить данные фильтров', {
          duration: 1500
        });
      } finally {
        setIsLoadingData(false);
      }
    }
  };

  const handleApplyFiltersClick = async () => {
    // Save filters on server
    const success = await applyFilters(filtersEndpoint);

    if (success) {
      // If filters saved successfully, pass active filters to parent component
      onApply(activeFilters);

      // Close filter panel
      setIsOpen(false);
    }
  };

  const handleClearFilters = async () => {
    setIsResetting(true);
    try {
      await resetAllFilters(filtersEndpoint);
      // Call onReset to update parent component state
      onReset();
    } finally {
      setIsResetting(false);
    }
  };

  // Update tab change handler
  const handleTabChangeWithLoading = async (newTab: string) => {
    // Check if new tab is same as current
    if (newTab === activeTab) {
      return;
    }

    setIsTabChanging(true);

    // Check if filters actually changed
    const categoryIndex = getCategoryIndexByTab(activeTab);
    const category = localFilters[categoryIndex];

    // Get list of active IDs from local filters
    const activeIdsInLocalFilters =
      category?.options
        .filter((option) => option.active)
        .map((option) => option.id) || [];

    // Get list of active IDs from activeFilters
    const activeIdsInActiveFilters = activeFilters[activeTab as keyof typeof activeFilters] || [];

    // Compare lists
    const hasRealChanges =
      JSON.stringify(activeIdsInLocalFilters.sort()) !==
      JSON.stringify(activeIdsInActiveFilters.sort());

    // Now make request
    // Check if we need to make filter update request
    // Request only needed if there are real changes or tabsModified flag is set
    if (hasRealChanges || tabsModified[activeTab]) {
      // Create modified endpoint with correct query parameters
      const url = new URL(filtersEndpoint, window.location.origin);

      // Add active filters with correct parameter names
      if (activeFilters.stages.length > 0) {
        activeFilters.stages.forEach((stageId) => {
          url.searchParams.append('stage', stageId);
        });
      }

      if (activeFilters.rounds.length > 0) {
        activeFilters.rounds.forEach((roundId) => {
          url.searchParams.append('round', roundId);
        });
      }

      if (activeFilters.participants.length > 0) {
        activeFilters.participants.forEach((participantId) => {
          url.searchParams.append('participant', participantId);
        });
      }

      if (activeFilters.categories.length > 0) {
        activeFilters.categories.forEach((categoryId) => {
          url.searchParams.append('category', categoryId);
        });
      }

      // Call handleTabChange with modified URL
      await handleTabChange(newTab, url.pathname + url.search);
    } else {
      // Just change active tab without request
      setActiveTab(newTab);
    }

    setIsTabChanging(false);
  };

  // Function to render badge skeletons
  const renderSkeletonBadges = () => (
    <div className='flex flex-wrap gap-1.5'>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className='h-6 w-16 rounded bg-muted' />
      ))}
    </div>
  );

  // Function to get category index by tab name
  const getCategoryIndexByTab = (tab: string) => {
    // Find category index by name
    return localFilters.findIndex(
      (category) =>
        (tab === 'stages' && category.name === 'Стадии') ||
        (tab === 'rounds' && category.name === 'Раунды') ||
        (tab === 'participants' && category.name === 'Participants') ||
        (tab === 'categories' && category.name === 'Категории')
    );
  };

  // Add function to get current visible options count
  const getVisibleOptionsCount = () => {
    if (isTabChanging) return '...';

    // Check that filteredOptions actually contains all elements
    const categoryIndex = getCategoryIndexByTab(activeTab);
    const category = localFilters[categoryIndex];

    if (!category) return 0;

    const visibleOptions = searchQuery
      ? category.options.filter((option) =>
          option.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : category.options;

    return visibleOptions.length;
  };
  return (
    <div>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant='outline'
            className={cn('gap-1 px-2 sm:gap-2 sm:px-3', className)}
          >
            <IconFilter className='h-4 w-4' />
            <span className='hidden sm:inline'>{buttonLabel}</span>
            {activeFiltersCount > 0 && (
              <Badge className='ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 sm:h-5 sm:min-w-5'>
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side='right'
          className='flex w-full max-w-full flex-col overflow-hidden p-0 sm:w-[400px] sm:max-w-[400px] lg:w-[450px] lg:max-w-[450px]'
        >
          <SheetHeader className='border-b px-6 py-4'>
            <SheetTitle>Фильтры</SheetTitle>
          </SheetHeader>

          <div className='flex-1 overflow-hidden'>
            {isLoadingFilters || isLoadingData ? (
              <div className='flex h-full flex-col px-6 py-4'>
                <div className='mb-4'>
                  <Skeleton className='mb-4 h-10 w-full' />
                  <Skeleton className='mb-2 h-9 w-full' />
                  <div className='mb-3 flex items-center justify-between'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-7 w-24' />
                  </div>
                </div>
                {renderSkeletonBadges()}
              </div>
            ) : (
              <div className='flex h-full flex-col px-6 py-4'>
                <Tabs
                  defaultValue={contextAvailableTabs[0] || 'stages'}
                  value={activeTab}
                  onValueChange={(value) => handleTabChangeWithLoading(value)}
                  className='w-full'
                >
                  <TabsList
                    className='mb-4 grid w-full'
                    style={{
                      gridTemplateColumns: `repeat(${contextAvailableTabs.length}, 1fr)`
                    }}
                  >
                    {contextAvailableTabs.includes('stages') && (
                      <TabsTrigger
                        value='stages'
                        className='hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs'
                      >
                        Стадии
                      </TabsTrigger>
                    )}
                    {contextAvailableTabs.includes('rounds') && (
                      <TabsTrigger
                        value='rounds'
                        className='hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs'
                      >
                        Раунды
                      </TabsTrigger>
                    )}
                    {contextAvailableTabs.includes('participants') && (
                      <TabsTrigger
                        value='participants'
                        className='hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs'
                      >
                        Инвесторы
                      </TabsTrigger>
                    )}
                    {contextAvailableTabs.includes('categories') && (
                      <TabsTrigger
                        value='categories'
                        className='hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs'
                      >
                        Категории
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <div className='mb-3'>
                    <div className='relative mb-2'>
                      <IconSearch className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
                      <Input
                        placeholder='Поиск...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='h-9 pl-8 text-sm shadow-none'
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='text-muted-foreground text-xs'>
                        Found: {getVisibleOptionsCount()}
                      </div>
                      {!isTabChanging && filteredOptions.length > 0 && (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 px-2 text-xs'
                          onClick={handleToggleSelectAll}
                        >
                          {filteredOptions.every((option) => option.active)
                            ? 'Deselect all'
                            : 'Select all'}
                        </Button>
                      )}
                    </div>
                  </div>

                  <ScrollArea className='-mr-4 h-[calc(100vh-300px)] pr-4'>
                    {contextAvailableTabs.map((tabValue) => (
                      <TabsContent
                        key={tabValue}
                        value={tabValue}
                        className='mt-0'
                      >
                        {isTabChanging && activeTab === tabValue ? (
                          <div className='flex flex-col gap-1.5'>
                            {Array(8)
                              .fill(0)
                              .map((_, i) => (
                                <Skeleton key={i} className='h-6 w-full' />
                              ))}
                          </div>
                        ) : (
                          <div className='flex flex-col gap-1.5'>
                            {filteredOptions.map((option) => {
                              const categoryIndex =
                                getCategoryIndexByTab(tabValue);
                              const optionIndex = localFilters[
                                categoryIndex
                              ]?.options.findIndex((o) => o.id === option.id);

                              if (
                                optionIndex === -1 ||
                                optionIndex === undefined
                              ) {
                                console.warn(
                                  `Option ${option.id} not found in localFilters[${categoryIndex}].options`
                                );
                                return null;
                              }

                              return (
                                <Badge
                                  key={option.id}
                                  variant={
                                    option.active ? 'default' : 'outline'
                                  }
                                  className={cn(
                                    'cursor-pointer justify-start px-2.5 py-1 text-xs',
                                    tabValue === 'participants' && option.image
                                      ? 'pl-1.5'
                                      : ''
                                  )}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleFilterChange(
                                      categoryIndex,
                                      optionIndex
                                    );
                                  }}
                                >
                                  {tabValue === 'participants' &&
                                    option.image && (
                                      <Avatar className='mr-1 h-4 w-4'>
                                        <AvatarImage
                                          src={option.image}
                                          alt={option.name}
                                        />
                                        <AvatarFallback className='bg-muted text-muted-foreground text-[10px]'>
                                          {option.name
                                            .substring(0, 1)
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                  {option.name}
                                </Badge>
                              );
                            })}
                            {filteredOptions.length === 0 && (
                              <div className='text-muted-foreground py-2 text-sm'>
                                Nothing found
                              </div>
                            )}
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </ScrollArea>
                </Tabs>
              </div>
            )}
          </div>

          <SheetFooter className='mt-auto border-t px-6 py-4'>
            <div className='flex w-full justify-between gap-3'>
              <Button
                variant='outline'
                onClick={handleClearFilters}
                className='h-10 flex-1'
                type='button'
                disabled={
                  isResetting ||
                  isLoading ||
                  isLoadingFilters ||
                  isLoadingData ||
                  isTabChanging
                }
              >
                {isResetting ? (
                  <>
                    <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                    Resetting...
                  </>
                ) : (
                  'Reset'
                )}
              </Button>
              <Button
                onClick={handleApplyFiltersClick}
                className='h-10 flex-1'
                disabled={
                  isLoading ||
                  isLoadingFilters ||
                  isLoadingData ||
                  isTabChanging ||
                  isResetting
                }
                type='button'
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                    Applying...
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
