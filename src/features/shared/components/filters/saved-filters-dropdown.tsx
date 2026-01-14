'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  IconFilter,
  IconChevronDown,
  IconPlus,
  IconStar,
  IconStarFilled,
  IconLoader2,
  IconCheck,
  IconX,
  IconEraser,
  IconTrash
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useSavedFilters } from '@/hooks/use-saved-filters';
import {
  SavedFilter,
  SavedFilterInput,
  SignalCardFilters
} from '@/lib/graphql/types';
import { cleanSavedFilterInput } from '@/lib/utils/saved-filters';
import { SignalPreferenceBadge } from './signal-preference-badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface SavedFiltersDropdownProps {
  className?: string;
  currentFilters: SignalCardFilters;
  onApplyFilter: (
    filters: SignalCardFilters,
    filterName?: string,
    filterId?: string
  ) => void;
  onClearAllFilters: () => void;
  hasActiveFilters: boolean;
  currentFilterName?: string; // Name of currently applied saved filter
}

interface QuickSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    name: string,
    description?: string,
    isDefault?: boolean
  ) => Promise<void>;
  isLoading: boolean;
}

// Quick save dialog for creating new saved filter
function QuickSaveDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}: QuickSaveDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Название фильтра обязательно');
      return;
    }

    await onSubmit(name.trim(), undefined, false);

    // Reset form
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Сохранить текущие фильтры</DialogTitle>
          <DialogDescription>
            Сохраните текущую конфигурацию фильтров для быстрого доступа позже.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Название фильтра (например, "AI Early Stage")'
              maxLength={100}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            type='button'
            onClick={handleSubmit}
            disabled={!name.trim() || isLoading}
          >
            {isLoading && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
            Сохранить фильтр
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SavedFiltersDropdown({
  className,
  currentFilters,
  onApplyFilter,
  onClearAllFilters,
  hasActiveFilters,
  currentFilterName
}: SavedFiltersDropdownProps) {
  const [showQuickSave, setShowQuickSave] = useState(false);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetFilter, setTargetFilter] = useState<SavedFilter | null>(null);

  const {
    savedFilters,
    defaultFilter,
    loading,
    error,
    totalCount,
    applyFilter,
    deleteFilter,
    createFilter,
    refetch
  } = useSavedFilters({ pagination: { page: 1, pageSize: 20 } });

  // Convert SavedFilter to SignalCardFilters format (excluding date filters)
  const convertSavedFilterToSignalCardFilters = useCallback(
    (savedFilter: SavedFilter): SignalCardFilters => {
      const filters: SignalCardFilters = {
        search: savedFilter.search,
        categories: savedFilter.categories?.map((c) => c.id),
        participants: savedFilter.participants?.map((p) => p.id),
        stages: savedFilter.stages,
        roundStatuses: savedFilter.roundStatuses,
        // Exclude date filters when applying saved filters
        // startDate: savedFilter.startDate,
        // endDate: savedFilter.endDate,
        minSignals: savedFilter.minSignals,
        maxSignals: savedFilter.maxSignals,
        featured: savedFilter.featured,
        isOpen: savedFilter.isOpen,
        new: savedFilter.new,
        trending: savedFilter.trending,
        hideLiked: savedFilter.hideLiked,
        // displayPreference is no longer available from savedFilter
      };

      // Handle smart filter mode - convert backend fields to frontend format
      if (
        savedFilter.participantFilterMode &&
        (savedFilter.participantFilterIds?.length ||
          savedFilter.participantFilterTypes?.length)
      ) {
        filters.participantFilter = {
          mode: savedFilter.participantFilterMode as 'EXCLUDE_FROM_TYPE',
          participantTypes: savedFilter.participantFilterTypes || [],
          participantIds: savedFilter.participantFilterIds || []
        };
      }

      return filters;
    },
    []
  );

  // Handle applying filter
  const handleApplyFilter = useCallback(
    async (savedFilter: SavedFilter) => {
      setIsOperationLoading(true);
      try {
        const appliedFilter = await applyFilter(savedFilter.id);
        if (appliedFilter) {
          const signalCardFilters =
            convertSavedFilterToSignalCardFilters(appliedFilter);

          // Apply the filter to the parent component - this will trigger loading and update the feed
          onApplyFilter(signalCardFilters, savedFilter.name, savedFilter.id);
          toast.success(`Применен фильтр: ${savedFilter.name}`);
        }
      } finally {
        setIsOperationLoading(false);
      }
    },
    [applyFilter, convertSavedFilterToSignalCardFilters, onApplyFilter]
  );

  // Handle creating new filter from current filters
  const handleQuickSave = useCallback(
    async (name: string, description?: string, isDefault?: boolean) => {
      setIsOperationLoading(true);
      try {
        // Convert current filters to SavedFilterInput format (excluding date filters)
        const filterInput: SavedFilterInput = {
          name,
          description,
          isDefault,
          categories: currentFilters.categories,
          participants: currentFilters.participants,
          stages: currentFilters.stages,
          roundStatuses: currentFilters.roundStatuses,
          search: currentFilters.search,
          featured: currentFilters.featured,
          isOpen: currentFilters.isOpen,
          new: currentFilters.new,
          trending: currentFilters.trending,
          hideLiked: currentFilters.hideLiked,
          // Include smart filter mode
          participantFilter: currentFilters.participantFilter,
          // Exclude date filters from saved filters
          // startDate: currentFilters.startDate,
          // endDate: currentFilters.endDate,
          minSignals: currentFilters.minSignals,
          maxSignals: currentFilters.maxSignals,
        };

        const cleanedInput = cleanSavedFilterInput(filterInput);
        const createdFilter = await createFilter(cleanedInput);

        // If filter was created successfully, immediately refetch and apply it
        if (createdFilter) {
          refetch();
          console.log(
            'New filter created, dropdown refreshed:',
            createdFilter.name
          );

          // Automatically apply the newly created filter
          const signalCardFilters =
            convertSavedFilterToSignalCardFilters(createdFilter);
          onApplyFilter(signalCardFilters, createdFilter.name);
          toast.success(`Фильтр "${createdFilter.name}" сохранен и применен!`);
        }
      } finally {
        setIsOperationLoading(false);
      }
    },
    [
      currentFilters,
      createFilter,
      refetch,
      convertSavedFilterToSignalCardFilters,
      onApplyFilter
    ]
  );

  // Render filter summary badge
  const renderFilterSummary = useCallback(
    (filter: SavedFilter) => {
      const count = [
        filter.categories?.length || 0,
        filter.participants?.length || 0,
        filter.stages?.length || 0,
        0,
        filter.search ? 1 : 0,
        filter.featured ? 1 : 0,
        filter.isOpen !== undefined ? 1 : 0,
        filter.new ? 1 : 0,
        filter.trending ? 1 : 0,
        filter.hideLiked ? 1 : 0
      ].reduce((sum, val) => sum + val, 0);

      if (count === 0) return null;

      const isActive = currentFilterName === filter.name;

      return (
        <Badge
          variant='outline'
          className={cn(
            'ml-auto text-xs',
            isActive
              ? 'border-primary bg-primary/10 text-primary'
              : 'bg-background border-border text-foreground'
          )}
        >
          {count} filter{count === 1 ? '' : 's'}
        </Badge>
      );
    },
    [currentFilterName]
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            className={cn('justify-between', className)}
            disabled={loading || isOperationLoading}
          >
            <div className='flex min-w-0 flex-1 items-center gap-2'>
              <IconFilter className='h-4 w-4 flex-shrink-0' />
              <span className='truncate text-left'>
                {currentFilterName ||
                  (!hasActiveFilters ? 'Сохраненные фильтры' : 'Сохраненные фильтры')}
              </span>
            </div>
            <IconChevronDown className='h-4 w-4 flex-shrink-0 opacity-50' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-96'>
          {/* Header */}
          <DropdownMenuLabel className='flex items-center justify-between px-2 font-normal'>
            <span className='font-medium'>Сохраненные фильтры</span>
            {totalCount > 0 && (
              <Badge
                variant='outline'
                className='bg-background border-border text-foreground text-xs'
              >
                {totalCount}
              </Badge>
            )}
          </DropdownMenuLabel>

          {/* Quick Save Current Filters
          {hasActiveFilters && !currentFilterName && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setShowQuickSave(true)}
                  disabled={isOperationLoading}
                  className='border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 border border-dashed'
                >
                  <IconPlus className='text-primary mr-2 h-4 w-4' />
                  <span className='text-primary font-medium'>
                    Сохранить текущие фильтры
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )} */}

          {/* No Filters Option */}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={onClearAllFilters}
              disabled={isOperationLoading}
              className={cn(
                'flex items-center justify-between p-3',
                !hasActiveFilters
                  ? 'bg-primary/10 text-primary pointer-events-none font-medium'
                  : 'hover:bg-muted/50 hover:text-accent-foreground'
              )}
            >
              <div className='flex min-w-0 flex-1 items-center gap-3'>
                <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <span className='text-foreground truncate font-medium'>
                    Без фильтров
                  </span>
                  <span className='text-muted-foreground truncate text-xs'>
                    Очистить все активные фильтры
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                {!hasActiveFilters && (
                  <IconCheck className='text-primary h-4 w-4' />
                )}
                {hasActiveFilters && (
                  <IconEraser className='text-muted-foreground h-4 w-4' />
                )}
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Loading State */}
          {loading && (
            <div className='p-2'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='mb-2 flex items-center gap-2'>
                  <div className='bg-muted h-4 w-4 rounded' />
                  <div className='bg-muted h-4 flex-1 rounded' />
                  <div className='bg-muted h-4 w-12 rounded' />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className='p-2 text-sm text-red-600'>{error}</div>
          )}

          {/* Empty State */}
          {!loading && !error && savedFilters.length === 0 && (
            <div className='p-4 text-center text-sm text-gray-500'>
              Нет сохраненных фильтров.
              {hasActiveFilters && !currentFilterName && (
                <div className='mt-2'>
                  <Button
                    size='sm'
                    onClick={() => setShowQuickSave(true)}
                    disabled={isOperationLoading}
                  >
                    Сохранить текущие фильтры
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Saved Filters List */}
          {!loading && savedFilters.length > 0 && (
            <ScrollArea className='max-h-64'>
              <DropdownMenuGroup>
                {/* Default Filter First */}
                {defaultFilter && (
                  <DropdownMenuItem
                    onClick={() => handleApplyFilter(defaultFilter)}
                    disabled={isOperationLoading}
                    className={cn(
                      'mb-1 flex items-center justify-between p-3',
                      currentFilterName === defaultFilter.name
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted/50 hover:text-accent-foreground'
                    )}
                  >
                    <div className='flex min-w-0 flex-1 items-center gap-2'>
                      <IconStarFilled className='h-4 w-4 flex-shrink-0 text-yellow-500' />
                      <div className='flex min-w-0 flex-1 flex-col gap-1'>
                        <div className='flex items-center gap-2'>
                          <span className='truncate font-medium'>
                            {defaultFilter.name}
                          </span>
                          <SignalPreferenceBadge
                            isWeb2Filter={defaultFilter.isWeb2Filter ?? false}
                            isWeb3Filter={defaultFilter.isWeb3Filter ?? false}
                            size='sm'
                            className={
                              currentFilterName === defaultFilter.name
                                ? 'text-primary border-primary'
                                : 'text-secondary-foreground border'
                            }
                          />
                        </div>
                        {defaultFilter.description && (
                          <span className='truncate text-xs text-gray-500'>
                            {defaultFilter.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {defaultFilter.recentProjectsCount > 0 && (
                        <Badge
                          variant='outline'
                          className={
                            currentFilterName === defaultFilter.name
                              ? 'text-primary border-primary bg-primary/10'
                              : 'text-foreground border-border bg-background'
                          }
                        >
                          {defaultFilter.recentProjectsCount} new
                        </Badge>
                      )}
                      {renderFilterSummary(defaultFilter)}
                      {currentFilterName === defaultFilter.name && (
                        <IconCheck className='text-primary h-4 w-4' />
                      )}
                      {/* Inline delete button for default filter too */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size='sm'
                              variant='ghost'
                              className='text-muted-foreground h-6 w-6 p-0 hover:text-red-600'
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetFilter(defaultFilter);
                                setConfirmOpen(true);
                              }}
                              aria-label='Delete saved filter'
                            >
                              <IconTrash className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side='left' className='text-xs'>
                            Удалить
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </DropdownMenuItem>
                )}

                {/* Другие фильтры */}
                {savedFilters
                  .filter((filter) => filter.id !== defaultFilter?.id)
                  .map((filter) => (
                    <DropdownMenuItem
                      key={filter.id}
                      onClick={() => handleApplyFilter(filter)}
                      disabled={isOperationLoading}
                      className={cn(
                        'mb-1 flex items-center justify-between p-3',
                        currentFilterName === filter.name
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50 hover:text-accent-foreground'
                      )}
                    >
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>{filter.name}</span>
                          <SignalPreferenceBadge
                            isWeb2Filter={filter.isWeb2Filter ?? false}
                            isWeb3Filter={filter.isWeb3Filter ?? false}
                            size='sm'
                            className={
                              currentFilterName === filter.name
                                ? 'text-primary border-primary'
                                : 'text-secondary-foreground border'
                            }
                          />
                        </div>
                        {filter.description && (
                          <span className='text-xs text-gray-500'>
                            {filter.description}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        {filter.recentProjectsCount > 0 && (
                          <Badge
                            variant='outline'
                            className={
                              currentFilterName === filter.name
                                ? 'text-primary border-primary bg-primary/10'
                                : 'text-foreground border-border bg-background'
                            }
                          >
                            {filter.recentProjectsCount} new
                          </Badge>
                        )}
                        {renderFilterSummary(filter)}
                        {currentFilterName === filter.name && (
                          <IconCheck className='text-primary h-4 w-4' />
                        )}
                        {/* Inline delete button at the same info level */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='text-muted-foreground h-6 w-6 p-0 hover:text-red-600'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetFilter(filter);
                                  setConfirmOpen(true);
                                }}
                                aria-label='Удалить сохраненный фильтр'
                              >
                                <IconTrash className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side='left' className='text-xs'>
                              Удалить
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuGroup>
            </ScrollArea>
          )}

          {/* Footer with loading indicator */}
          {isOperationLoading && (
            <>
              <DropdownMenuSeparator />
              <div className='flex items-center gap-2 p-2 text-sm text-gray-500'>
                <IconLoader2 className='h-4 w-4 animate-spin' />
                Загрузка...
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className='p-4 sm:max-w-[360px]'>
          <AlertDialogHeader className='space-y-1'>
            <AlertDialogTitle className='text-sm'>
              Вы уверены?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              {`Удалить "${targetFilter?.name ?? ''}" из сохраненных фильтров?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2'>
            <AlertDialogCancel className='h-8 px-3 text-xs'>
              Нет
            </AlertDialogCancel>
            <AlertDialogAction
              className='h-8 bg-red-600 px-3 text-xs hover:bg-red-700'
              onClick={async () => {
                if (!targetFilter) return;
                const id = targetFilter.id;
                setConfirmOpen(false);
                setTargetFilter(null);
                setIsOperationLoading(true);
                try {
                  await deleteFilter(id);
                  await refetch();
                  toast.success('Фильтр удален');
                } finally {
                  setIsOperationLoading(false);
                }
              }}
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickSaveDialog
        open={showQuickSave}
        onOpenChange={setShowQuickSave}
        onSubmit={handleQuickSave}
        isLoading={isOperationLoading}
      />
    </>
  );
}
