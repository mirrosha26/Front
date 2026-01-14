'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useApolloClient, gql } from '@apollo/client';
import { Button } from '@/components/ui/button';
import {
  IconFilter,
  IconLoader2,
  IconSearch,
  IconChevronRight,
  IconChevronDown,
  IconCheck,
  IconX,
  IconPlus,
  IconBookmark,
  IconBrandLinkedin
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  SignalCardFilters
} from '@/lib/graphql/types';
import {
  EntitySpecificFilters,
  SmartSelectionData
} from './entity-specific-filters';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useSavedFilters } from '@/hooks/use-saved-filters';
import { SavedFilterInput } from '@/lib/graphql/types';
import { cleanSavedFilterInput } from '@/lib/utils/saved-filters';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

// Simple debounce function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout;
  const debounced = ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel: () => void };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}

// Quick save dialog for creating new saved filter
function QuickSaveDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    name: string,
    description?: string,
    isDefault?: boolean
  ) => Promise<void>;
  isLoading: boolean;
}) {
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

interface EnhancedGraphQLFiltersButtonProps {
  // Filter data
  categories: any[];
  stages: any[];
  rounds: any[];

  // Loading states
  basicFiltersLoading: boolean;
  feedLoading?: boolean; // Add feed loading state

  // Current filter state
  activeFilters: SignalCardFilters;
  hasActiveFilters: boolean;
  activeFiltersCount: number;

  // Actions
  updateFilter: (key: keyof SignalCardFilters, value: any) => void;
  updateMultipleFilters: (filters: Partial<SignalCardFilters>) => void;
  clearAllFilters: () => void;

  // UI props
  buttonLabel?: string;
  currentFilterName?: string;
  currentFilterId?: string;
  hasFiltersChanged?: boolean;
}

export function EnhancedGraphQLFiltersButton({
  categories = [],
  stages = [],
  rounds = [],
  basicFiltersLoading = false,
  feedLoading = false,
  activeFilters = {},
  hasActiveFilters = false,
  activeFiltersCount = 0,
  updateFilter,
  updateMultipleFilters,
  clearAllFilters,
  buttonLabel = 'Фильтры',
  currentFilterName,
  currentFilterId,
  hasFiltersChanged
}: EnhancedGraphQLFiltersButtonProps) {
  const apolloClient = useApolloClient();
  const [isOpen, setIsOpen] = useState(false);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('stages'); // Start with stages as first step
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
    new Set()
  );
  const [showQuickSave, setShowQuickSave] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Saved filters hook
  const {
    createFilter,
    refetch,
    updateFilter: updateSavedFilter
  } = useSavedFilters({
    pagination: { page: 1, pageSize: 20 }
  });

  // Note: Removed synchronization between searchTerm and activeFilters.search
  // The searchTerm is only for filtering within the filter dropdowns
  // The main search term is handled separately via activeFilters.search

  // Auto-expand groups when searching
  useEffect(() => {
    if (searchTerm && searchTerm.length > 0) {
      // Auto-expand all regions when searching
      const allRegionSlugs = new Set<string>();
      setExpandedRegions(allRegionSlugs);
    } else {
      // Clear expanded regions when search is cleared
      setExpandedRegions(new Set());
    }
  }, [searchTerm]);

  // Filter flow order - stages first, then rounds, then categories, then entities
  const filterFlowOrder = [
    'stages',
    'rounds',
    'categories',
    'entities'
  ];

  // Get completion status for each step
  const getStepStatus = (step: string) => {
    // Map UI step names to filter keys
    const filterKeyMap: Record<string, keyof SignalCardFilters> = {
      stages: 'stages',
      rounds: 'roundStatuses',
      categories: 'categories',
      entities: 'participants' // entities tab manages participants filter
    };

    const filterKey = filterKeyMap[step];
    if (!filterKey) return 'pending';

    const currentValues = Array.isArray(activeFilters[filterKey])
      ? (activeFilters[filterKey] as string[])
      : [];
    return currentValues.length > 0 ? 'completed' : 'pending';
  };

  // Handle filter toggle for arrays
  const handleArrayFilterToggle = (filterKey: string, value: string) => {
    // Map UI filter keys to GraphQL filter keys
    const filterKeyMap: Record<string, keyof SignalCardFilters> = {
      stages: 'stages',
      rounds: 'roundStatuses',
      categories: 'categories'
    };

    const typedFilterKey =
      filterKeyMap[filterKey] || (filterKey as keyof SignalCardFilters);
    const currentValues = Array.isArray(activeFilters[typedFilterKey])
      ? (activeFilters[typedFilterKey] as string[])
      : [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];

    updateFilter(typedFilterKey, newValues.length > 0 ? newValues : undefined);
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

  // **NEW: Select All Functionality**

  // Helper function to get all available items for the current tab (respecting search filter)
  const getAllAvailableItems = (tabKey: string) => {
    if (tabKey === 'entities') {
      // For entities, we'll handle this in the EntitySpecificFilters component
      return [];
    }

    return getFilteredItems();
  };

  // Check if all items in current tab are selected
  const areAllItemsSelected = (tabKey: string) => {
    const filterKeyMap: Record<string, keyof SignalCardFilters> = {
      stages: 'stages',
      rounds: 'roundStatuses',
      categories: 'categories',
      entities: 'participants'
    };

    const filterKey = filterKeyMap[tabKey];
    if (!filterKey) return false;

    const currentValues = Array.isArray(activeFilters[filterKey])
      ? (activeFilters[filterKey] as string[])
      : [];

    const availableItems = getAllAvailableItems(tabKey);
    if (availableItems.length === 0) return false;

    return availableItems.every((item) => {
      const value = getItemValue(item, tabKey);
      return currentValues.includes(value);
    });
  };

  // Handle select all / deselect all for the current tab
  const handleToggleSelectAll = (tabKey: string) => {
    const filterKeyMap: Record<string, keyof SignalCardFilters> = {
      stages: 'stages',
      rounds: 'roundStatuses',
      categories: 'categories',
      entities: 'participants'
    };

    const filterKey = filterKeyMap[tabKey];
    if (!filterKey) return;

    const currentValues = Array.isArray(activeFilters[filterKey])
      ? (activeFilters[filterKey] as string[])
      : [];

    const allSelected = areAllItemsSelected(tabKey);

    if (allSelected) {
      // Deselect all items in this tab
      const availableItems = getAllAvailableItems(tabKey);
        const valuesToRemove = availableItems.map((item) =>
          getItemValue(item, tabKey)
        );
        const newValues = currentValues.filter(
          (v: string) => !valuesToRemove.includes(v)
        );
        updateFilter(filterKey, newValues.length > 0 ? newValues : undefined);
    } else {
      // Select all items in this tab
      const availableItems = getAllAvailableItems(tabKey);
        const valuesToAdd = availableItems.map((item) =>
          getItemValue(item, tabKey)
        );
        const newValues = Array.from(
          new Set([...currentValues, ...valuesToAdd])
        );
        updateFilter(filterKey, newValues);
    }
  };

  // Get item value based on filter type
  const getItemValue = (item: any, filterKey: string) => {
    switch (filterKey) {
      case 'categories':
        return item.id;
      case 'stages':
        return item.slug || item.name;
      case 'rounds':
        return item.slug || item.name;
      default:
        return item.slug || item.name;
    }
  };

  // Get filtered items based on search
  const getFilteredItems = () => {
    const items =
        {
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


  // Render filter content for each tab
  const renderTabContent = () => {
    // Handle entities tab with EntitySpecificFilters
    if (activeTab === 'entities') {
      // Extract current participant selections from activeFilters
      const selectedParticipants = Array.isArray(activeFilters.participants)
        ? activeFilters.participants
        : [];

      // Handle participant changes - supports both traditional and smart mode
      const handleParticipantsChange = (
        data: string[] | SmartSelectionData
      ) => {
        // Handle backward compatibility with old string[] format
        if (Array.isArray(data)) {
          // For backward compatibility, merge with existing traditional participants
          // but preserve any existing smart mode filters for other entity types
          const existingParticipants = Array.isArray(activeFilters.participants)
            ? activeFilters.participants
            : [];
          const mergedParticipants = Array.from(
            new Set([...existingParticipants, ...data])
          );

          updateMultipleFilters({
            participants:
              mergedParticipants.length > 0 ? mergedParticipants : undefined
            // Preserve existing smart mode filters
            // participantFilter: undefined // Don't clear smart mode filters
          });
          return;
        }

        // Handle new SmartSelectionData format
        if (data.mode === 'smart') {
          // Map entity types to backend participant types
          const entityTypeMap: Record<string, string> = {
            angels: 'angel',
            vcs_investors: 'investor',
            accelerators: 'accelerator',
            founders: 'founder'
          };

          const participantType = entityTypeMap[data.entityType || ''];

          if (participantType) {
            console.log('🎯 Smart selection mode activated:', {
              entityType: data.entityType,
              participantType: participantType,
              excludedParticipants: data.excludedParticipants
            });

            // Advanced approach: Support multiple entity types in smart mode + mixed modes
            const existingFilter = activeFilters.participantFilter;
            const existingParticipantTypes =
              existingFilter?.participantTypes || [];

            // Add current participant type if not already present
            const updatedParticipantTypes = existingParticipantTypes.includes(
              participantType
            )
              ? existingParticipantTypes
              : [...existingParticipantTypes, participantType];

            console.log('🔄 Multi-entity smart mode update:', {
              entityType: data.entityType,
              participantType: participantType,
              existingTypes: existingParticipantTypes,
              updatedTypes: updatedParticipantTypes,
              excludedParticipants: data.excludedParticipants
            });

            // For multi-entity smart mode, we'll merge exclusions
            // TODO: In future, we might want per-entity-type exclusions, but for now use shared list
            const updatedExcludedIds = data.excludedParticipants || [];

            // Use updateMultipleFilters to batch updates and prevent double refetch
            updateMultipleFilters({
              participantFilter: {
                mode: 'EXCLUDE_FROM_TYPE',
                participantTypes: updatedParticipantTypes,
                participantIds: updatedExcludedIds
              }
              // Don't clear participants - allow mixed mode (smart + traditional)
              // participants: undefined
            });
          } else {
            console.warn('Unknown entity type:', data.entityType);
          }
        } else {
          // Traditional mode - support mixed mode (keep other entity types in smart mode)
          const existingFilter = activeFilters.participantFilter;
          const existingParticipants = Array.isArray(activeFilters.participants)
            ? activeFilters.participants
            : [];

          // If there's an active participantFilter, we need to be smart about it
          let updatedParticipantFilter = existingFilter;

          if (existingFilter && data.entityType) {
            // Remove current entity type from smart mode if it exists
            const entityTypeMap: Record<string, string> = {
              angels: 'angel',
              vcs_investors: 'investor',
              accelerators: 'accelerator',
              founders: 'founder'
            };

            const participantTypeToRemove = entityTypeMap[data.entityType];
            const updatedParticipantTypes =
              existingFilter.participantTypes.filter(
                (type) => type !== participantTypeToRemove
              );

            // If no more participant types in smart mode, clear the filter entirely
            updatedParticipantFilter =
              updatedParticipantTypes.length > 0
                ? {
                    mode: 'EXCLUDE_FROM_TYPE' as const,
                    participantTypes: updatedParticipantTypes,
                    participantIds: existingFilter.participantIds
                  }
                : undefined;
          }

          console.log('🔄 Traditional mode with mixed support:', {
            entityType: data.entityType,
            newParticipants: data.participantIds,
            existingParticipants,
            updatedParticipantFilter
          });

          // Handle traditional mode selections - support both adding and removing participants
          const newTraditionalParticipants = data.participantIds || [];

          if (newTraditionalParticipants.length === 0 && data.entityType) {
            // This is a "deselect all" for this entity type
            console.log(
              `🗑️ Deselecting all participants for entity type: ${data.entityType}`,
              {
                existingParticipants,
                existingFilter,
                updatedParticipantFilter
              }
            );

            // For "deselect all", we need to remove participants of this entity type
            // For simplicity, when any entity type deselects all in traditional mode,
            // we'll clear all traditional participants to ensure clean state
            updateMultipleFilters({
              participants: undefined, // Clear all traditional participants
              participantFilter: updatedParticipantFilter
            });
          } else {
            // Normal case: handle entity-specific participant management in mixed mode

            // Helper function to determine entity type from participant
            const getParticipantEntityType = (
              participantId: string
            ): string | null => {
              try {
                const participant = apolloClient.cache.readFragment({
                  id: `Participant:${participantId}`,
                  fragment: gql`
                    fragment ParticipantEntityType on Participant {
                      id
                      type
                      isPrivate
                      isSaved
                    }
                  `
                }) as {
                  id: string;
                  type: string;
                  isPrivate?: boolean;
                  isSaved?: boolean;
                } | null;

                if (!participant) return null;

                // Map participant types to entity types
                if (data.entityType === 'favorites') {
                  return participant.isSaved ? 'favorites' : null;
                } else if (!participant.isPrivate) {
                  const type = participant.type.toLowerCase();
                  if (['angel'].includes(type)) return 'angels';
                  if (
                    [
                      'investor',
                      'scout',
                      'research',
                      'engineer',
                      'influencer',
                      'unknown',
                      'founder',
                      'marketing',
                      'writing',
                      'legal',
                      'operations',
                      'socials',
                      'business_development',
                      'security',
                      'finance',
                      'due_diligence',
                      'product',
                      'protocol',
                      'defi',
                      'growth',
                      'design',
                      'data',
                      'strategy',
                      'board',
                      'analyst',
                      'content',
                      'advisor',
                      'ceo',
                      'portfolio',
                      'events',
                      'communications',
                      'trading',
                      'ga',
                      'other'
                    ].includes(type)
                  )
                    return 'vcs_investors';
                  if (
                    [
                      'accelerator',
                      'fund',
                      'platform',
                      'syndicate',
                      'community',
                      'company'
                    ].includes(type)
                  )
                    return 'accelerators';
                  if (['person', 'entrepreneur'].includes(type))
                    return 'founders';
                }
                return null;
              } catch {
                return null;
              }
            };

            // Filter existing participants to keep only those NOT from the current entity type
            const participantsFromOtherEntityTypes =
              existingParticipants.filter((participantId) => {
                const entityType = getParticipantEntityType(participantId);
                return entityType !== data.entityType;
              });

            // Combine participants from other entity types with new selections for current entity type
            const mergedParticipants = Array.from(
              new Set([
                ...participantsFromOtherEntityTypes,
                ...newTraditionalParticipants
              ])
            );

            console.log('🔄 Mixed mode participant update:', {
              entityType: data.entityType,
              existingParticipants,
              participantsFromOtherEntityTypes,
              newTraditionalParticipants,
              mergedParticipants
            });

            updateMultipleFilters({
              participants:
                mergedParticipants.length > 0 ? mergedParticipants : undefined,
              participantFilter: updatedParticipantFilter
            });
          }
        }
      };

      return (
        <EntitySpecificFilters
          selectedParticipants={selectedParticipants}
          onParticipantsChange={handleParticipantsChange}
          participantFilter={activeFilters.participantFilter}
        />
      );
    }

    const filteredItems = getFilteredItems();

    // Map UI tab names to filter keys
    const filterKeyMap: Record<string, keyof SignalCardFilters> = {
      stages: 'stages',
      rounds: 'roundStatuses',
      categories: 'categories'
    };

    const filterKey =
      filterKeyMap[activeTab] || (activeTab as keyof SignalCardFilters);
    const currentValues = Array.isArray(activeFilters[filterKey])
      ? (activeFilters[filterKey] as string[])
      : [];
    const isLoading = basicFiltersLoading;

    if (isLoading && filteredItems.length === 0) {
      return (
        <div className='space-y-2'>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className='h-10 w-full' />
          ))}
        </div>
      );
    }

    // Regular rendering for tabs
      return (
        <div className='flex h-full flex-col space-y-2 sm:space-y-3'>
          {/* Search Input */}
          <div className='relative flex-shrink-0'>
            <IconSearch className='text-muted-foreground absolute top-2 left-2 h-3 w-3 sm:top-2.5 sm:left-3 sm:h-4 sm:w-4' />
            <Input
              placeholder={`Поиск ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='h-8 pl-8 text-sm sm:h-9 sm:pl-10'
          />
        </div>

        {/* Select All Controls */}
        {filteredItems.length > 0 && (
          <div className='flex flex-shrink-0 items-center justify-between px-1'>
            <div className='text-muted-foreground text-xs'>
              {filteredItems.length}{' '}
              {activeTab === 'categories'
                ? 'categories'
                : activeTab === 'stages'
                  ? 'stages'
                  : activeTab === 'rounds'
                    ? 'rounds'
                      : 'items'}
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleToggleSelectAll(activeTab)}
              className='hover:bg-accent hover:text-accent-foreground h-6 px-2 text-xs sm:h-7 sm:px-3'
            >
              {areAllItemsSelected(activeTab) ? 'Отменить выбор всех' : 'Выбрать все'}
            </Button>
          </div>
        )}

        {/* Filter Items - Scrollable */}
        <ScrollArea
          className='flex-1 pr-3'
          style={{
            maxHeight: 'calc(100vh - 300px)',
            scrollBehavior: 'smooth'
          }}
        >
          <div className='grid gap-1 pb-6 sm:gap-2'>
            {filteredItems.map((item, index) => {
              const value = getItemValue(item, activeTab);
              const isActive = currentValues.includes(value);

              return (
                <div
                  key={`${activeTab}-${item.id || value}-${index}`}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg p-2 ${
                    isActive ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleArrayFilterToggle(activeTab, value)}
                >
                    <Checkbox checked={isActive} className='h-4 w-4' />
                  <div className='min-w-0 flex-1 overflow-hidden'>
                    <div className='text-foreground truncate text-xs font-medium sm:text-sm'>
                      {activeTab === 'stages' && item.name === 'Unknown'
                        ? 'Not Classified'
                        : item.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Handle filter application and close
  const handleApplyFilters = () => {
    setIsOpen(false);
    // Filters are already applied in real-time, just close the modal
  };

  // Handle clearing all filters with separate loading state
  const handleClearAllFilters = async () => {
    setIsResetting(true);
    try {
      await clearAllFilters();
    } finally {
      setIsResetting(false);
    }
  };

  // Handle saving current filters
  const handleQuickSave = useCallback(
    async (name: string, description?: string, isDefault?: boolean) => {
      setIsSaveLoading(true);
      try {
        // Convert current filters to SavedFilterInput format (excluding date filters)
        const filterInput: SavedFilterInput = {
          name,
          description,
          isDefault,
          categories: activeFilters.categories,
          participants: activeFilters.participants,
          stages: activeFilters.stages,
          roundStatuses: activeFilters.roundStatuses,
          search: activeFilters.search,
          featured: activeFilters.featured,
          isOpen: activeFilters.isOpen,
          new: activeFilters.new,
          trending: activeFilters.trending,
          hideLiked: activeFilters.hideLiked,
          // Include smart filter mode
          participantFilter: activeFilters.participantFilter,
          // Exclude date filters from saved filters
          // startDate: activeFilters.startDate,
          // endDate: activeFilters.endDate,
          minSignals: activeFilters.minSignals,
          maxSignals: activeFilters.maxSignals
        };

        const cleanedInput = cleanSavedFilterInput(filterInput);
        const createdFilter = await createFilter(cleanedInput);

        // If filter was created successfully, immediately refetch
        if (createdFilter) {
          refetch();
          console.log(
            'New filter created from filter window:',
            createdFilter.name
          );
          toast.success(`Фильтр "${createdFilter.name}" успешно сохранен!`);
        }
      } finally {
        setIsSaveLoading(false);
      }
    },
    [activeFilters, createFilter, refetch]
  );

  // Handle updating current saved filter
  const handleUpdateFilter = useCallback(
    async (name: string, description?: string) => {
      if (!currentFilterId) return;

      setIsUpdateLoading(true);
      try {
        const filterInput: SavedFilterInput = {
          name,
          description,
          categories: activeFilters.categories,
          participants: activeFilters.participants,
          stages: activeFilters.stages,
          roundStatuses: activeFilters.roundStatuses,
          search: activeFilters.search,
          featured: activeFilters.featured,
          isOpen: activeFilters.isOpen,
          new: activeFilters.new,
          trending: activeFilters.trending,
          hideLiked: activeFilters.hideLiked,
          participantFilter: activeFilters.participantFilter,
          minSignals: activeFilters.minSignals,
          maxSignals: activeFilters.maxSignals
        };

        const cleanedInput = cleanSavedFilterInput(filterInput);
        const updatedFilter = await updateSavedFilter(
          currentFilterId,
          cleanedInput
        );

        if (updatedFilter) {
          refetch();
          toast.success(`Фильтр "${updatedFilter.name}" успешно обновлен!`);
        }
      } finally {
        setIsUpdateLoading(false);
      }
    },
    [currentFilterId, activeFilters, updateSavedFilter, refetch]
  );

  return (
    <>
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
                variant='default'
                className='absolute -top-2 -right-1 h-4 w-4 rounded-full p-0 text-xs sm:-right-2 sm:h-5 sm:w-5'
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className='flex w-[95vw] max-w-[95vw] flex-col sm:w-[400px] sm:max-w-[400px] md:w-[450px] md:max-w-[450px] lg:w-[500px] lg:max-w-[500px] xl:w-[600px] xl:max-w-[600px]'>
          <SheetHeader className='flex-shrink-0 border-b px-3 sm:px-4'>
            <div className='flex items-center justify-between'>
              <SheetTitle>
                {currentFilterName ? (
                  <span>
                    Ваш сохраненный фильтр:{' '}
                    <span className='font-semibold'>{currentFilterName}</span>
                  </span>
                ) : (
                  'Фильтры'
                )}
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className='flex min-h-0 flex-1 flex-col px-3 sm:px-4'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='flex flex-1 flex-col'
            >
              <TabsList className='mb-2 grid h-auto w-full flex-shrink-0 grid-cols-4 p-1 sm:mb-3'>
                {filterFlowOrder.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className='data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground [&[data-state=active]]:!bg-primary [&[data-state=active]]:!text-primary-foreground [&[aria-selected=true]]:!bg-primary [&[aria-selected=true]]:!text-primary-foreground data-[state=active]:!text-primary-foreground [&[data-state=active]]:!text-primary-foreground [&[aria-selected=true]]:!text-primary-foreground gap-1'
                  >
                    {/* Mobile: Show abbreviated text */}
                    <span className='block sm:hidden'>
                      {tab === 'stages'
                        ? 'Стад'
                        : tab === 'rounds'
                          ? 'Раунд'
                          : tab === 'categories'
                            ? 'Кат'
                              : tab === 'entities'
                                ? 'Ист'
                                  : ''}
                    </span>
                    {/* Tablet: Show short text */}
                    <span className='hidden sm:block md:hidden'>
                      {tab === 'stages'
                        ? 'Стадии'
                        : tab === 'rounds'
                          ? 'Раунды'
                          : tab === 'categories'
                            ? 'Кат'
                              : tab === 'entities'
                                ? 'Ист'
                                  : ''}
                    </span>
                    {/* Medium Desktop: Show medium text */}
                    <span className='hidden md:block lg:hidden'>
                      {tab === 'stages'
                        ? 'Стад'
                        : tab === 'rounds'
                          ? 'Раунды'
                          : tab === 'categories'
                            ? 'Кат'
                              : tab === 'entities'
                                ? 'Ист'
                                  : ''}
                    </span>
                    {/* Large Desktop: Show full text */}
                    <span className='hidden lg:block'>
                      {tab === 'stages'
                        ? 'Стадии'
                        : tab === 'rounds'
                          ? 'Раунды'
                          : tab === 'categories'
                            ? 'Категории'
                              : tab === 'entities'
                                ? 'Инвесторы'
                                  : ''}
                    </span>
                    {getStepStatus(tab) === 'completed' && (
                      <div className='h-1 w-1 rounded-full bg-current sm:h-1.5 sm:w-1.5' />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {filterFlowOrder.map((tab) => (
                <TabsContent
                  key={tab}
                  value={tab}
                  className='mt-0 min-h-0 flex-1'
                >
                  {tab === 'entities' ? renderTabContent() : renderTabContent()}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <SheetFooter className='bg-background/95 flex-shrink-0 border-t px-3 py-2 backdrop-blur-sm sm:px-4 sm:py-3 lg:px-6 lg:py-4'>
            <div className='flex w-full gap-1.5 sm:gap-2 lg:gap-3'>
              <Button
                variant='outline'
                onClick={handleClearAllFilters}
                className='h-8 flex-1 text-xs sm:h-9 lg:h-10'
                disabled={feedLoading || isResetting}
              >
                {isResetting ? (
                  <>
                    <IconLoader2 className='mr-1 h-3 w-3 animate-spin sm:mr-2 sm:h-4 sm:w-4' />
                    <span className='xs:inline hidden sm:hidden'>Сброс...</span>
                    <span className='xs:hidden sm:inline'>Сброс...</span>
                    <span className='hidden sm:inline lg:hidden'>
                      Сбросить все
                    </span>
                    <span className='hidden lg:inline'>Сбросить все фильтры</span>
                  </>
                ) : (
                  <>
                    <span className='sm:hidden'>Сброс</span>
                    <span className='hidden sm:inline lg:hidden'>
                      Сбросить все
                    </span>
                    <span className='hidden lg:inline'>Сбросить все фильтры</span>
                  </>
                )}
              </Button>
              {/* Conditional buttons based on current filter state */}
              {currentFilterName && hasFiltersChanged ? (
                // Show three equal-width buttons: Reset, Update, Add as new (when filter changed)
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='outline'
                          onClick={() => setShowUpdateDialog(true)}
                          className='h-8 flex-1 text-xs sm:h-9 lg:h-10'
                          disabled={
                            feedLoading || isUpdateLoading || !hasActiveFilters
                          }
                        >
                          <IconBookmark className='mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4' />
                          <span className='sm:hidden'>Save</span>
                          <span className='hidden sm:inline'>
                            Save (update current)
                          </span>
                        </Button>
                      </TooltipTrigger>
                      {!hasActiveFilters && (
                        <TooltipContent>
                          <p>Выберите фильтры, чтобы сохранить их</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='outline'
                          onClick={() => setShowQuickSave(true)}
                          className='h-8 flex-1 text-xs sm:h-9 lg:h-10'
                          disabled={
                            feedLoading || isSaveLoading || !hasActiveFilters
                          }
                        >
                          <IconPlus className='mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4' />
                          <span className='sm:hidden'>Add</span>
                          <span className='hidden sm:inline'>Add as new</span>
                        </Button>
                      </TooltipTrigger>
                      {!hasActiveFilters && (
                        <TooltipContent>
                          <p>Выберите фильтры, чтобы сохранить их</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </>
              ) : !currentFilterName ? (
                // Regular save button - only show if no saved filter is selected
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='flex-1'>
                        <Button
                          variant='outline'
                          onClick={() => setShowQuickSave(true)}
                          className='h-8 w-full text-xs sm:h-9 lg:h-10'
                          disabled={
                            feedLoading || isSaveLoading || !hasActiveFilters
                          }
                        >
                          <IconBookmark className='mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4' />
                          <span className='sm:hidden'>Save</span>
                          <span className='hidden sm:inline'>
                            Сохранить текущие фильтры
                          </span>
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!hasActiveFilters && (
                      <TooltipContent>
                        <p>Select filters in order to save them</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Quick Save Dialog */}
      <QuickSaveDialog
        open={showQuickSave}
        onOpenChange={setShowQuickSave}
        onSubmit={handleQuickSave}
        isLoading={isSaveLoading}
      />

      {/* Update Filter Dialog */}
      <QuickSaveDialog
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
        onSubmit={handleUpdateFilter}
        isLoading={isUpdateLoading}
      />
    </>
  );
}
