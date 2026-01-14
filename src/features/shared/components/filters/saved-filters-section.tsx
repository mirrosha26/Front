'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IconBookmark,
  IconPlus,
  IconStar,
  IconLoader2,
  IconDots,
  IconEdit,
  IconTrash,
  IconStarFilled
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useSavedFilters } from '@/hooks/use-saved-filters';
import { SignalPreferenceBadge } from './signal-preference-badge';
import { SavedFilter, SignalCardFilters } from '@/lib/graphql/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface SavedFiltersSectionProps {
  className?: string;
  currentFilters: SignalCardFilters;
  onApplyFilter: (filters: SignalCardFilters) => void;
  hasActiveFilters: boolean;
  onCreateNew: () => void;
}

export function SavedFiltersSection({
  className,
  currentFilters,
  onApplyFilter,
  hasActiveFilters,
  onCreateNew
}: SavedFiltersSectionProps) {
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetFilter, setTargetFilter] = useState<SavedFilter | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const {
    savedFilters,
    loading,
    error,
    totalCount,
    deleteFilter,
    applyFilter,
    setAsDefault
  } = useSavedFilters({ pagination: { page: 1, pageSize: 20 } });

  // Convert SavedFilter to SignalCardFilters format (excluding date filters)
  const convertSavedFilterToSignalCardFilters = (
    savedFilter: SavedFilter
  ): SignalCardFilters => {
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
  };

  // Handle applying filter
  const handleApplyFilter = async (savedFilter: SavedFilter) => {
    setIsOperationLoading(true);
    try {
      const appliedFilter = await applyFilter(savedFilter.id);
      if (appliedFilter) {
        const signalCardFilters =
          convertSavedFilterToSignalCardFilters(appliedFilter);
        onApplyFilter(signalCardFilters);
      }
    } finally {
      setIsOperationLoading(false);
    }
  };

  // Handle deleting filter
  const handleDeleteFilter = async (filterId: string) => {
    // Optimistic hide
    setHiddenIds((prev) => new Set(prev).add(filterId));
    setIsOperationLoading(true);
    try {
      await deleteFilter(filterId);
      toast.success('Фильтр удален');
    } catch (e) {
      // Revert on failure
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(filterId);
        return next;
      });
      toast.error('Не удалось удалить фильтр');
    } finally {
      setIsOperationLoading(false);
    }
  };

  // Handle setting as default
  const handleSetAsDefault = async (filterId: string) => {
    setIsOperationLoading(true);
    try {
      await setAsDefault(filterId);
    } finally {
      setIsOperationLoading(false);
    }
  };

  // Render filter summary with badges
  const renderFilterSummary = (filter: SavedFilter) => {
    const badges = [];

    // Categories
    if (filter.categories && filter.categories.length > 0) {
      badges.push(
        <Badge key='categories' variant='secondary' className='text-xs'>
          {filter.categories.length}{' '}
          {filter.categories.length === 1 ? 'Категория' : 'Категории'}
        </Badge>
      );
    }

    // Participants
    if (filter.participants && filter.participants.length > 0) {
      badges.push(
        <Badge key='participants' variant='secondary' className='text-xs'>
          {filter.participants.length}{' '}
          {filter.participants.length === 1 ? 'Инвестор' : 'Инвесторы'}
        </Badge>
      );
    }

    // Stages
    if (filter.stages && filter.stages.length > 0) {
      badges.push(
        <Badge key='stages' variant='secondary' className='text-xs'>
          {filter.stages.length}{' '}
          {filter.stages.length === 1 ? 'Стадия' : 'Стадии'}
        </Badge>
      );
    }


    // Search term
    if (filter.search) {
      badges.push(
        <Badge key='search' variant='outline' className='text-xs'>
          Search: "{filter.search}"
        </Badge>
      );
    }

    return badges.slice(0, 4); // Show max 4 badges to avoid crowding
  };

  if (loading) {
    return (
      <div className={cn('p-4', className)}>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <IconBookmark className='h-4 w-4' />
            <span className='text-sm font-medium'>Сохраненные фильтры</span>
          </div>
        </div>
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700'
            >
              <div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
              <div className='h-3 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
              <div className='flex gap-2'>
                <div className='h-5 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
                <div className='h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleFilters = savedFilters.filter((f) => !hiddenIds.has(f.id));

  return (
    <div className={cn('p-4', className)}>
      {/* Header */}
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <IconBookmark className='h-4 w-4 text-zinc-700 dark:text-zinc-300' />
          <span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
            Сохраненные фильтры
          </span>
          {totalCount > 0 && (
            <Badge variant='outline' className='text-xs'>
              {totalCount}
            </Badge>
          )}
        </div>

        {/* Save Current Filters Button */}
        {hasActiveFilters && (
          <Button
            size='sm'
            variant='outline'
            onClick={onCreateNew}
            disabled={isOperationLoading}
          >
            <IconPlus className='mr-1 h-3 w-3' />
            Сохранить
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && savedFilters.length === 0 && (
        <div className='py-8 text-center'>
          <IconBookmark className='mx-auto mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-600' />
          <p className='mb-3 text-sm text-zinc-500 dark:text-zinc-400'>
            Нет сохраненных фильтров
          </p>
          {hasActiveFilters && (
            <Button
              size='sm'
              onClick={onCreateNew}
              disabled={isOperationLoading}
            >
              <IconPlus className='mr-1 h-3 w-3' />
              Сохранить текущие фильтры
            </Button>
          )}
        </div>
      )}

      {/* Saved Filters List */}
      {visibleFilters.length > 0 && (
        <ScrollArea className='h-156'>
          <div className='space-y-3'>
            {visibleFilters.map((filter) => (
              <div
                key={filter.id}
                className={cn(
                  'cursor-pointer rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800',
                  filter.isDefault &&
                    'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                )}
              >
                <div className='flex items-start justify-between'>
                  <div
                    className='flex-1 space-y-2'
                    onClick={() => handleApplyFilter(filter)}
                  >
                    {/* Filter Name and Default Badge */}
                    <div className='flex items-center gap-2'>
                      <h4
                        className={cn(
                          'truncate text-sm font-medium',
                          filter.isDefault
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-zinc-900 dark:text-zinc-100'
                        )}
                      >
                        {filter.name}
                      </h4>
                      <SignalPreferenceBadge
                        isWeb2Filter={filter.isWeb2Filter ?? false}
                        isWeb3Filter={filter.isWeb3Filter ?? false}
                        size='sm'
                      />
                      {filter.isDefault && (
                        <IconStar className='h-3 w-3 text-blue-600 dark:text-blue-400' />
                      )}
                      {filter.recentProjectsCount > 0 && (
                        <Badge
                          variant='default'
                          className='bg-green-600 text-xs hover:bg-green-700'
                        >
                          {filter.recentProjectsCount} new
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    {filter.description && (
                      <p className='truncate text-xs text-zinc-600 dark:text-zinc-400'>
                        {filter.description}
                      </p>
                    )}

                    {/* Filter Summary Badges */}
                    <div className='flex flex-wrap gap-1'>
                      {renderFilterSummary(filter)}
                    </div>

                    {/* Created Date */}
                    <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                      {new Date(filter.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions: only delete icon */}
                  <div className='flex items-center gap-1'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='text-red-600 hover:text-red-700'
                            disabled={isOperationLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetFilter(filter);
                              setConfirmOpen(true);
                            }}
                            aria-label='Delete saved filter'
                          >
                            <IconTrash className='h-3 w-3' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side='left' className='text-xs'>
                          Удалить
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className='sm:max-w-[360px] p-4'>
          <AlertDialogHeader className='space-y-1'>
            <AlertDialogTitle className='text-sm'>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              {`Удалить "${targetFilter?.name ?? ''}" из сохраненных фильтров?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2'>
            <AlertDialogCancel
              className='h-8 px-3 text-xs'
              disabled={isOperationLoading}
            >
              Нет
            </AlertDialogCancel>
            <AlertDialogAction
              className='h-8 px-3 text-xs bg-red-600 hover:bg-red-700'
              disabled={isOperationLoading}
              onClick={async () => {
                if (!targetFilter) return;
                const id = targetFilter.id;
                setConfirmOpen(false);
                setTargetFilter(null);
                await handleDeleteFilter(id);
              }}
            >
              Да, удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
