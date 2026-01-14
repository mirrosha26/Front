'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApolloClient } from '@apollo/client';
import { Button } from '@/components/ui/button';
import {
  IconRefresh,
  IconArrowUp,
  IconLoader2,
  IconWifi,
  IconWifiOff,
  IconAlertTriangle,
  IconSearch
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { SearchInput } from '@/features/shared/components/feeds/search-input';
import { NewProjectsSwitch } from '@/features/shared/components/feeds/new-projects-switch';
import {
  FeedSettingsToggle,
  FeedSettingsInline
} from '@/features/shared/components/feeds/settings';
import { InfiniteScroll } from '@/features/shared/components/infinite-scroll/infinite-scroll';
import { CardsList } from '@/features/shared/components/lists';
import { Badge } from '@/components/ui/badge';
import { EnhancedGraphQLFiltersButton } from '@/features/shared/components/filters/enhanced-graphql-filters-button';
import { SavedFiltersDropdown } from '@/features/shared/components/filters/saved-filters-dropdown';
import { useGraphQLFilters } from '@/hooks/use-graphql-filters';
import { useSavedFilters } from '@/hooks/use-saved-filters';
import { useCardOperations } from '@/features/shared/contexts/card-operations-context';
import { convertEuropeanToISODate } from '@/lib/format';
import { SignalCardFilters } from '@/lib/graphql/types';
import { AvatarSkeleton } from '@/features/shared/components/ui/avatar-skeleton';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';

import { useApolloRecovery } from '@/hooks/use-apollo-recovery';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { transformImageUrl } from '@/lib/utils/image-url';
import {
  deduplicateSignalsByPerson,
  generateLegacyParticipantsList
} from '@/features/shared/utils/signal-deduplication';
import { useCategoriesCache } from '@/hooks/use-categories-cache';
import {
  BASIC_FILTERS_QUERY
} from '@/lib/graphql/queries';
import { InvestorDetailModal } from '@/features/investors/components/public/investor-detail-modal';

// LocalStorage keys for caching
const SAVED_FILTER_NAME_KEY = 'all-signals-graphql-saved-filter-name';

// Helper functions for localStorage
const saveSavedFilterNameToCache = (filterName: string | undefined) => {
  if (typeof window === 'undefined') return;
  try {
    if (filterName) {
      localStorage.setItem(SAVED_FILTER_NAME_KEY, filterName);
    } else {
      localStorage.removeItem(SAVED_FILTER_NAME_KEY);
    }
  } catch (error) {
    console.warn('Failed to save filter name to cache:', error);
  }
};

const loadSavedFilterNameFromCache = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    return localStorage.getItem(SAVED_FILTER_NAME_KEY) || undefined;
  } catch (error) {
    console.warn('Failed to load filter name from cache:', error);
    return undefined;
  }
};

// NEW: Load saved filter data before component render
const loadInitialSavedFilterData = (): SignalCardFilters => {
  if (typeof window === 'undefined') return {};

  // First try to load from saved filter name cache
  const savedFilterName = loadSavedFilterNameFromCache();
  if (savedFilterName) {
    try {
      // Try to load from a dedicated cache for the filter data
      const savedFilterData = localStorage.getItem(
        `saved-filter-data-${savedFilterName}`
      );
      if (savedFilterData) {
        const parsed = JSON.parse(savedFilterData);

        // Migrate old participantFilter format if present
        if (parsed.participantFilter) {
          const oldFilter = parsed.participantFilter;
          if (
            (oldFilter as any).participant_types ||
            (oldFilter as any).participant_ids
          ) {
            console.log(
              '🔄 Migrating old participantFilter format in saved filter data'
            );
            parsed.participantFilter = {
              mode: oldFilter.mode,
              participantTypes:
                (oldFilter as any).participant_types ||
                oldFilter.participantTypes ||
                [],
              participantIds:
                (oldFilter as any).participant_ids ||
                oldFilter.participantIds ||
                []
            };
            // Save the migrated version back
            localStorage.setItem(
              `saved-filter-data-${savedFilterName}`,
              JSON.stringify(parsed)
            );
            console.log('✅ Migration completed for saved filter data');
          }
        }

        // Migrate old signalDisplayPreference to displayPreference
        if (
          (parsed as any).signalDisplayPreference &&
          !parsed.displayPreference
        ) {
          console.log(
            '🔄 Migrating signalDisplayPreference to displayPreference in saved filter data'
          );
          parsed.displayPreference = (parsed as any).signalDisplayPreference;
          delete (parsed as any).signalDisplayPreference;

          // Save the migrated version back
          localStorage.setItem(
            `saved-filter-data-${savedFilterName}`,
            JSON.stringify(parsed)
          );
          console.log(
            '✅ Migration completed for displayPreference in saved filter data'
          );
        }

        // Set hideLiked to true by default if not explicitly set to false
        if (parsed.hideLiked === undefined) {
          parsed.hideLiked = true;
        }

        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load saved filter data from cache:', error);
    }
  }

  // If no saved filter name or data, try to load regular filters
  try {
    const regularFilters = localStorage.getItem('graphql-signal-filters');
    if (regularFilters) {
      const parsed = JSON.parse(regularFilters);

      // Migrate old participantFilter format if present
      if (parsed.participantFilter) {
        const oldFilter = parsed.participantFilter;
        if (
          (oldFilter as any).participant_types ||
          (oldFilter as any).participant_ids
        ) {
          console.log(
            '🔄 Migrating old participantFilter format in regular filters'
          );
          parsed.participantFilter = {
            mode: oldFilter.mode,
            participantTypes:
              (oldFilter as any).participant_types ||
              oldFilter.participantTypes ||
              [],
            participantIds:
              (oldFilter as any).participant_ids ||
              oldFilter.participantIds ||
              []
          };
          // Save the migrated version back
          localStorage.setItem(
            'graphql-signal-filters',
            JSON.stringify(parsed)
          );
          console.log('✅ Migration completed for regular filters');
        }
      }

      // Set hideLiked to true by default if not explicitly set to false
      if (parsed.hideLiked === undefined) {
        parsed.hideLiked = true;
      }

      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load regular filters from cache:', error);
  }

  // Return hideLiked: true by default when no filters are found
  return { hideLiked: true };
};

export function AllSignalsGraphQLPage() {
  const apolloClient = useApolloClient();

  // Load initial saved filter data before the hook initialization
  const [initialFilters] = useState(() => loadInitialSavedFilterData());

  // Prefetch critical queries immediately for faster loading
  useEffect(() => {
    const prefetchQueries = async () => {
      try {
        // Prefetch basic filters (categories, stages, rounds) - these are needed for UI
        apolloClient.query({
          query: BASIC_FILTERS_QUERY,
          fetchPolicy: 'cache-first',
          errorPolicy: 'ignore' // Don't fail if this fails
        });


        console.log('✅ Critical queries prefetched for faster loading');
      } catch (error) {
        // Silently ignore prefetch errors - they're just optimizations
        console.log('ℹ️ Prefetch completed with some queries skipped');
      }
    };

    prefetchQueries();
  }, [apolloClient]);

  const {
    // Filter state
    activeFilters,
    hasActiveFilters,
    activeFiltersCount,

    // Filter options
    categories,
    stages,
    rounds,

    // Feed data
    feedData,
    feedLoading,
    isFilterChange,
    isPaginating,

    // Transition states
    isTransitioning,
    showEmptyState,

    // Loading states for filter options
    basicFiltersLoading,

    // Actions
    updateFilter,
    updateSearch,
    updateMultipleFilters,
    replaceAllFilters,
    clearAllFilters,
    loadMore,

    // Cache management
    refetchBasicFilters
  } = useGraphQLFilters(initialFilters); // Pass initial filters to prevent double fetch

  // Use REST API approach for both favorites and delete operations to match the cURL request format
  const {
    toggleFavorite: toggleFavoriteREST,
    deleteCard,
    restoreCard
  } = useCardOperations();

  // Hook for managing categories cache invalidation and filter clearing
  const {
    invalidateCategoriesCacheWithToast,
    invalidateAndClearForFeedChangeWithToast
  } = useCategoriesCache();

  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentSavedFilterName, setCurrentSavedFilterName] = useState<
    string | undefined
  >(() => loadSavedFilterNameFromCache()); // Initialize from cache
  const [currentSavedFilterId, setCurrentSavedFilterId] = useState<
    string | undefined
  >(undefined);
  const [originalSavedFilter, setOriginalSavedFilter] = useState<
    SignalCardFilters | undefined
  >(undefined);
  const [filtersModifiedByUser, setFiltersModifiedByUser] = useState(false);
  const [isAutoApplyingFilter, setIsAutoApplyingFilter] = useState(false);
  const [hasTriedAutoApply, setHasTriedAutoApply] = useState(false); // Track if we've attempted auto-apply
  // hideLiked is now handled through GraphQL filters (activeFilters.hideLiked)

  // Investor modal state
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [investorModalSlug, setInvestorModalSlug] = useState<string>('');

  // Hook for saved filters functionality
  const { savedFilters: availableSavedFilters, loading: savedFiltersLoading } =
    useSavedFilters({
      pagination: { page: 1, pageSize: 50 } // Get more filters to find the cached one
    });

  // Use simplified network status to avoid persistent offline messages
  const [isOnline, setIsOnline] = useState(true); // Force start as online

  // Simple online/offline detection without backend health checks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Debug current navigator status
    console.log('🌐 Navigator online status:', navigator?.onLine);
    console.log('🌐 Current isOnline state:', isOnline);

    // Create a global function to force online status
    (window as any).forceOnlineStatus = () => {
      console.log('🔄 Global force online called');
      setIsOnline(true);
    };

    const handleOnline = () => {
      console.log('🟢 Browser online event fired');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('🔴 Browser offline event fired');
      // Only set offline if navigator really says we're offline
      if (navigator?.onLine === false) {
        setIsOnline(false);
      } else {
        console.log('🟡 Ignoring offline event - navigator says online');
      }
    };

    // Override any false offline detections - force online if navigator says we're online
    const checkRealStatus = () => {
      if (typeof navigator !== 'undefined') {
        const navigatorOnline = navigator.onLine;
        console.log(
          '🔍 Status check - Navigator:',
          navigatorOnline,
          'State:',
          isOnline
        );

        // Force online status to always be true unless navigator.onLine is explicitly false
        if (navigatorOnline && !isOnline) {
          console.log('🔄 Forcing online status to true');
          setIsOnline(true);
        }

        // If navigator says we're online, always trust it over any other detection
        if (navigatorOnline) {
          setIsOnline(true);
        }
      }
    };

    // Initial check
    checkRealStatus();

    // Check every 2 seconds to override false offline detections
    const statusInterval = setInterval(checkRealStatus, 2000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(statusInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // Clean up global function
      delete (window as any).forceOnlineStatus;
    };
  }, [isOnline]);

  // Integrate Apollo recovery for automatic cache management
  const { triggerRecovery, clearCache } = useApolloRecovery({
    invalidateCache: false, // Keep cache but reset error states
    refetchQueries: 'active',
    onRecovery: async () => {
      // Custom recovery logic
      try {
        // Use clearAllFilters and then reload to refresh data
        await clearAllFilters();
        toast.success('Данные успешно обновлены!');
      } catch (error) {
        toast.error('Не удалось обновить данные после восстановления');
      }
    }
  });

  // MODIFIED: Simplified auto-apply logic since initial filters are already loaded
  useEffect(() => {
    // Only apply if we have initial filters but no saved filter name has been set yet
    if (
      Object.keys(initialFilters).length > 0 &&
      !currentSavedFilterName &&
      !savedFiltersLoading &&
      !hasTriedAutoApply
    ) {
      const cachedFilterName = loadSavedFilterNameFromCache();
      if (cachedFilterName) {
        setCurrentSavedFilterName(cachedFilterName);
        console.log('Auto-applied saved filter from cache:', cachedFilterName);
      }
      setHasTriedAutoApply(true);
    }
  }, [
    initialFilters,
    currentSavedFilterName,
    savedFiltersLoading,
    hasTriedAutoApply
  ]);

  // Track scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mark that user modified filters, but KEEP current saved filter context
  const handleManualFilterChange = useCallback(() => {
    // We intentionally DO NOT clear currentSavedFilterName/Id here.
    // Keeping them allows offering "Save (update current)" UX.
    setFiltersModifiedByUser(true);
    // Note: We don't reset hideLiked here since it's part of the settings, not manual filters
  }, []);

  // Wrapped filter functions that clear saved filter name
  const wrappedUpdateFilter = useCallback(
    (key: any, value: any) => {
      handleManualFilterChange();
      setFiltersModifiedByUser(true); // Mark as modified by user
      updateFilter(key, value);
    },
    [updateFilter, handleManualFilterChange]
  );

  const wrappedUpdateMultipleFilters = useCallback(
    (filters: any) => {
      handleManualFilterChange();
      setFiltersModifiedByUser(true); // Mark as modified by user
      updateMultipleFilters(filters);
    },
    [updateMultipleFilters, handleManualFilterChange]
  );

  const wrappedClearAllFilters = useCallback(() => {
    setCurrentSavedFilterName(undefined); // Clear saved filter name when clearing all filters
    setCurrentSavedFilterId(undefined); // Clear saved filter ID
    setOriginalSavedFilter(undefined); // Clear original filter
    setFiltersModifiedByUser(false); // Clear modification flag
    saveSavedFilterNameToCache(undefined); // Clear cache when clearing all filters
    return clearAllFilters();
  }, [clearAllFilters]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSearch = (query: string) => {
    // Don't clear saved filter name for search - search should work on top of saved filters
    updateSearch(query);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);

    // Only reset settings filters, preserve all others
    const newFilters: any = { ...activeFilters };
    newFilters.startDate = undefined;
    newFilters.endDate = undefined;
    newFilters.hideLiked = false;
    newFilters.trending = false;
    newFilters.minSignals = 1;
    newFilters.maxSignals = 20;

    updateMultipleFilters(newFilters);

    setIsRefreshing(false);

    // Clear saved filter name when refreshing
    setCurrentSavedFilterName(undefined);
    saveSavedFilterNameToCache(undefined); // Clear cache when refreshing

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleLoadMore = useCallback(async () => {
    await loadMore();
  }, [loadMore]);

  const handleToggleSave = async (cardId: number) => {
    try {
      // Find the card to get current status
      const card = feedData?.nodes?.find((c) => parseInt(c.id) === cardId);
      const cardName = card?.name || 'Unknown';

      // Ensure we properly handle the boolean value
      const currentStatus = Boolean(card?.userData?.isFavorited);
      const newStatus = !currentStatus;

      // Update the Apollo GraphQL cache IMMEDIATELY to provide instant feedback
      apolloClient.cache.modify({
        id: apolloClient.cache.identify({
          __typename: 'SignalCard',
          id: cardId.toString()
        }),
        fields: {
          userData(existingUserData) {
            return {
              ...existingUserData,
              isFavorited: newStatus // Set the new status immediately
            };
          }
        }
      });

      // Handle the API call in background without showing loading/waiting
      toggleFavoriteREST(cardId, currentStatus)
        .then((result) => {
          if (!result) {
            // If API call fails, revert the UI change
            apolloClient.cache.modify({
              id: apolloClient.cache.identify({
                __typename: 'SignalCard',
                id: cardId.toString()
              }),
              fields: {
                userData(existingUserData) {
                  return {
                    ...existingUserData,
                    isFavorited: currentStatus // Revert to original status
                  };
                }
              }
            });
            toast.error('Не удалось обновить статус избранного');
          }
        })
        .catch((error) => {
          console.error('Error toggling favorite:', error);
          // Revert the UI change on error
          apolloClient.cache.modify({
            id: apolloClient.cache.identify({
              __typename: 'SignalCard',
              id: cardId.toString()
            }),
            fields: {
              userData(existingUserData) {
                return {
                  ...existingUserData,
                  isFavorited: currentStatus // Revert to original status
                };
              }
            }
          });
          toast.error('Не удалось обновить статус избранного');
        });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Не удалось обновить статус избранного');
    }
  };

  const handleDelete = async (cardId: number) => {
    try {
      // Find the card name for the toast
      const card = feedData?.nodes?.find((c) => parseInt(c.id) === cardId);
      const cardName = card?.name || 'Unknown';

      // Show toast with undo action (matching the regular all signals page pattern)
      toast(`Карточка "${cardName}" скрыта`, {
        action: {
          label: 'Отменить',
          onClick: async () => {
            // Restore the card on the server
            const success = await restoreCard(cardId);
            if (success) {
              toast.success(`Карточка "${cardName}" восстановлена`);
              // Optionally refetch the data to show the restored card
              // You might want to add a refetch mechanism here
            } else {
              toast.error(`Не удалось восстановить карточку "${cardName}"`);
            }
          }
        }
      });

      // Delete the card on the server
      const success = await deleteCard(cardId);
      if (success) {
        // Update the Apollo GraphQL cache to remove the deleted card
        apolloClient.cache.evict({
          id: apolloClient.cache.identify({
            __typename: 'SignalCard',
            id: cardId.toString()
          })
        });
        apolloClient.cache.gc(); // Garbage collect to clean up orphaned references
      } else {
        toast.error(`Не удалось удалить карточку "${cardName}"`);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Не удалось удалить карточку');
    }
  };

  // Function to open investor modal
  const handleOpenInvestorModal = useCallback(
    (participantId: string, participantSlug: string) => {
      setInvestorModalSlug(participantSlug);
      setIsInvestorModalOpen(true);
    },
    []
  );

  // Function to close investor modal
  const handleCloseInvestorModal = useCallback(() => {
    setIsInvestorModalOpen(false);
    setInvestorModalSlug('');
  }, []);

  // Handle New Startups switch
  const handleNewProjectsChange = (checked: boolean) => {
    console.log('🚀 New Startups toggle clicked:', {
      checked,
      isFilterChange,
      feedLoading
    });
    handleManualFilterChange();

    // When "New Startups" is activated, clear date selection and set new filter
    if (checked) {
      updateMultipleFilters({
        new: true,
        startDate: undefined,
        endDate: undefined
      });
    } else {
      // When deactivated, just remove the new filter
      updateFilter('new', undefined);
    }
  };

  // Handle feed settings apply
  const handleApplySettings = async (settings: any) => {
    handleManualFilterChange();

    // Check if feed preference changed (web2/web3/all) - this would require categories refetch
    const hasFeedPreferenceChange =
      settings.signal_display_preference !== undefined;

    // When feed preference changes, clear all filters and invalidate categories cache
    if (hasFeedPreferenceChange || settings.category_filter_type) {
      // Use the comprehensive function that clears localStorage cache and invalidates Apollo cache
      await invalidateAndClearForFeedChangeWithToast();

      // Also clear the current UI state by calling the wrapped clear function
      await wrappedClearAllFilters();

      // Close settings and exit early since filters are cleared and we don't need to apply new ones
      setShowSettings(false);
      return;
    }

    // Check if trending filter changed to clear relevant caches
    const currentTrending = Boolean(activeFilters.trending);
    const newTrending = settings.trending === 'true' ? true : false; // More explicit conversion
    const trendingChanged = currentTrending !== newTrending;

    console.log('🔧 Trending Settings Debug:', {
      'activeFilters.trending': activeFilters.trending,
      'settings.trending': settings.trending,
      'settings.trending type': typeof settings.trending,
      currentTrending: currentTrending,
      newTrending: newTrending,
      trendingChanged: trendingChanged
    });

    // Start with current active filters to preserve existing selections (categories, participants, etc.)
    const newFilters: any = { ...activeFilters };

    // Update only the settings-related filters while preserving existing ones
    if (settings.min_sig) {
      const minSigValue = parseInt(settings.min_sig);
      if (minSigValue && minSigValue > 0) {
        newFilters.minSignals = minSigValue;
      } else {
        delete newFilters.minSignals;
      }
    }

    if (settings.max_sig) {
      const maxSigValue = parseInt(settings.max_sig);
      if (maxSigValue && maxSigValue > 0) {
        newFilters.maxSignals = maxSigValue;
      } else {
        delete newFilters.maxSignals;
      }
    }

    if (settings.start_date) {
      // Convert to ISO format for GraphQL
      newFilters.startDate =
        typeof settings.start_date === 'string'
          ? convertEuropeanToISODate(settings.start_date)
          : settings.start_date.toISOString().split('T')[0];
    } else {
      // Remove startDate if not provided
      delete newFilters.startDate;
    }

    if (settings.end_date) {
      // Convert to ISO format for GraphQL
      newFilters.endDate =
        typeof settings.end_date === 'string'
          ? convertEuropeanToISODate(settings.end_date)
          : settings.end_date.toISOString().split('T')[0];
    } else {
      // Remove endDate if not provided
      delete newFilters.endDate;
    }

    // Handle hide_liked setting by passing it to GraphQL filters
    const newHideLiked = settings.hide_liked; // settings.hide_liked is already a boolean
    if (newHideLiked) {
      newFilters.hideLiked = true;
    } else {
      // Explicitly set to false so updateMultipleFilters knows to remove it
      newFilters.hideLiked = false;
    }

    // Handle trending setting by passing it to GraphQL filters
    if (newTrending) {
      newFilters.trending = true;
      console.log('🔧 Setting trending filter to TRUE');
    } else {
      // Explicitly set to false to disable trending filter
      newFilters.trending = false;
      console.log('🔧 Setting trending filter to FALSE');
    }

    console.log(
      '🔧 Final newFilters before updateMultipleFilters:',
      newFilters
    );

    // Apply all filters at once to prevent multiple requests
    updateMultipleFilters(newFilters);

    // Clear Apollo cache AFTER applying filters if trending changed
    if (trendingChanged) {
      console.log('🔄 Trending filter changed, clearing Apollo cache...');

      // Clear only Apollo cache to remove cached GraphQL responses with old trending data
      try {
        apolloClient.cache.evict({ fieldName: 'userFeed' });
        apolloClient.cache.gc();
        console.log('✅ Apollo cache cleared for trending filter change');
      } catch (error) {
        console.error('Failed to clear Apollo cache:', error);
      }
    }

    setShowSettings(false);
  };

  // Function to check if filters have been modified by user
  const hasFiltersChanged = useCallback(() => {
    return filtersModifiedByUser;
  }, [filtersModifiedByUser]);

  // Handle applying saved filter - OPTIMIZED for single GraphQL request
  const handleApplySavedFilter = useCallback(
    (filters: any, filterName?: string, filterId?: string) => {
      console.log('Manually applying saved filter:', filterName);
      console.log('🔍 Raw saved filter data:', filters);

      // Cache the filter data for next time
      if (filterName && filters) {
        try {
          localStorage.setItem(
            `saved-filter-data-${filterName}`,
            JSON.stringify(filters)
          );
        } catch (error) {
          console.warn('Failed to cache filter data:', error);
        }
      }

      // Immediately update UI state and cache - don't wait for async operations
      if (filterName) {
        setCurrentSavedFilterName(filterName);
        setCurrentSavedFilterId(filterId);
        saveSavedFilterNameToCache(filterName);
        console.log('UI immediately updated for filter:', filterName);
      }

      // Store original filter for comparison
      setOriginalSavedFilter(filters);
      setFiltersModifiedByUser(false); // Reset modification flag when applying saved filter

      // Convert the saved filter format to the GraphQL filters format
      const updates: any = {};

      if (filters.search) updates.search = filters.search;
      if (filters.categories?.length) updates.categories = filters.categories;
      if (filters.participants?.length)
        updates.participants = filters.participants;
      if (filters.stages?.length) updates.stages = filters.stages;
      if (filters.roundStatuses?.length)
        updates.roundStatuses = filters.roundStatuses;
      if (filters.minSignals !== undefined)
        updates.minSignals = filters.minSignals;
      if (filters.maxSignals !== undefined)
        updates.maxSignals = filters.maxSignals;
      if (filters.featured !== undefined) updates.featured = filters.featured;
      if (filters.isOpen !== undefined) updates.isOpen = filters.isOpen;
      if (filters.hideLiked !== undefined)
        updates.hideLiked = filters.hideLiked;
      if (filters.new !== undefined) updates.new = filters.new;
      if (filters.trending !== undefined) updates.trending = filters.trending;

      // Handle smart filter mode - participantFilter
      if (filters.participantFilter) {
        updates.participantFilter = filters.participantFilter;
      }

      console.log('🔧 Converted updates for GraphQL:', updates);
      console.log('🔧 Trending value in updates:', updates.trending);

      // ✅ OPTIMIZED: Replace all filters with saved filter (single GraphQL request)
      // This completely replaces current filters and makes it instant
      replaceAllFilters(updates);
      console.log(
        '✅ Saved filter replaced all filters immediately:',
        filterName
      );
    },
    [replaceAllFilters]
  );

  // Check if we have active settings filters
  const hasActiveSettingsFilters = () => {
    // Don't consider minSignals=1 and maxSignals=20 as active filters (default values)
    const hasNonDefaultSignals =
      (activeFilters.minSignals !== undefined &&
        activeFilters.minSignals !== 1) ||
      (activeFilters.maxSignals !== undefined &&
        activeFilters.maxSignals !== 20);

    return (
      hasNonDefaultSignals ||
      activeFilters.startDate !== undefined ||
      activeFilters.endDate !== undefined ||
      activeFilters.new !== undefined ||
      activeFilters.hideLiked !== undefined ||
      activeFilters.trending !== undefined
    );
  };

  // Helper function to format stage display
  const formatStageDisplay = (stage: string): string => {
    const stageMap: Record<string, string> = {
      very_early: 'Very Early',
      early: 'Early',
      growth: 'Growth'
    };
    return (
      stageMap[stage] ||
      stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // Helper function to format round status display
  const formatRoundStatusDisplay = (roundStatus: string): string => {
    const roundStatusMap: Record<string, string> = {
      just_raised: 'Just Raised',
      about_to_raise: 'About to Raise',
      raising_now: 'Raising Now',
      may_be_raising: 'May be Raising',
      unknown: 'Unknown',
      acquired: 'Acquired',
      gone_public: 'Gone Public'
    };
    return (
      roundStatusMap[roundStatus] ||
      roundStatus.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // Convert GraphQL signals to CardPreview format
  const convertedSignals = useMemo(() => {
    const converted =
      feedData?.nodes?.map((signal) => {
        const isLiked = Boolean(signal.userData?.isFavorited);
        const isAssignedToGroup = Boolean(signal.userData?.isAssignedToGroup);

        // Debug logging
        if (isAssignedToGroup) {
          console.log('[Card Highlight] Card assigned to group:', {
            cardId: signal.id,
            cardName: signal.name,
            isAssignedToGroup: signal.userData?.isAssignedToGroup
          });
        }

        const convertedCard = {
          id: parseInt(signal.id),
          slug: signal.slug || undefined, // Ensure slug is explicitly mapped, handle null
          name: signal.name,
          title: signal.name,
          description: signal.description,
          image_url: transformImageUrl(signal.imageUrl),
          stage: signal.stage,
          round_status: signal.roundStatus,
          last_round: signal.lastRound,

          // Stage information with proper formatting
          stage_info: signal.stage
            ? {
                name: formatStageDisplay(signal.stage),
                slug: signal.stage
              }
            : undefined,

          // Round status information with proper formatting
          round_status_info: signal.roundStatus
            ? {
                key: signal.roundStatus,
                name: formatRoundStatusDisplay(signal.roundStatus)
              }
            : undefined,

          categories:
            signal.categories?.map((cat) => ({
              id: parseInt(cat.id) || 0,
              name: cat.name,
              slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')
            })) || [],
          // Deduplicate signals to show only oldest signal per participant
          signals: (() => {
            if (!signal.signals || signal.signals.length === 0) return [];

            // Map to the expected format for deduplication
            const mappedSignals = signal.signals.map((s) => ({
              id: s.id,
              date: s.date,
              description: s.description,
              signalType: s.signalType
                ? {
                    id: s.signalType.id,
                    name: s.signalType.name,
                    slug: s.signalType.slug
                  }
                : undefined,
              participant: s.participant
                ? {
                    id: s.participant.id,
                    name: s.participant.name,
                    slug: s.participant.slug,
                    type: s.participant.type || '',
                    about: s.participant.about,
                    imageUrl: s.participant.imageUrl,
                    isSaved: s.participant.isSaved
                  }
                : undefined,
              associatedParticipant: s.associatedParticipant
                ? {
                    id: s.associatedParticipant.id,
                    name: s.associatedParticipant.name,
                    slug: s.associatedParticipant.slug,
                    type: s.associatedParticipant.type || '',
                    about: s.associatedParticipant.about,
                    imageUrl: s.associatedParticipant.imageUrl,
                    isSaved: s.associatedParticipant.isSaved
                  }
                : undefined
            }));

            // Apply deduplication to keep only oldest signal per person
            return deduplicateSignalsByPerson(mappedSignals);
          })(),

          // Legacy participants_list for backward compatibility - generated from deduplicated signals
          participants_list: signal.signals
            ? generateLegacyParticipantsList(signal.signals)
            : [],
          participants_has_more: false,
          participants_more_count: 0,
          remainingParticipantsCount: signal.remainingParticipantsCount || 0,
          is_liked: isLiked, // Use the properly converted boolean value
          is_heart_liked: isLiked,
          has_note: !!signal.userData?.userNote?.noteText,
          is_assigned_to_group: isAssignedToGroup,
          url: signal.url,
          social_links:
            signal.socialLinks?.map((link) => ({
              name: link.name,
              url: link.url
            })) || [],
          latest_date: signal.latestSignalDate, // Use dedicated latestSignalDate field from backend
          created_at: signal.createdAt, // Project creation date
          trending: signal.trending || false
        };

        return convertedCard;
      }) || [];

    return converted;
  }, [feedData]);

  const handleManualRefresh = async () => {
    if (!isOnline) {
      toast.error('Невозможно обновить в оффлайне');
      return;
    }

    try {
      // Trigger a manual refresh by clearing and reloading
      await clearAllFilters();
      toast.success('Данные успешно обновлены!');
    } catch (error) {
      toast.error('Не удалось обновить данные');
    }
  };

  const handleClearCache = () => {
    try {
      clearCache();
      toast.success('Кеш очищен - пожалуйста, обновите страницу');
    } catch (error) {
      toast.error('Не удалось очистить кеш');
    }
  };

  return (
    <div className='w-full px-4 py-2 sm:px-6'>
      {/* Compact header - single row for all screen sizes */}
      <div className='bg-background border-border sticky top-0 z-10 -mx-4 mb-3 border-b sm:-mx-6'>
        <div className='w-full px-3 py-2 sm:px-6 sm:py-3'>
          {/* Main row: search and controls */}
          <div className='flex items-center justify-between gap-2 sm:gap-3'>
            {/* Left side: Search (full width available) */}
            <div className='relative flex-1'>
              <SearchInput
                key={`search-compact-${activeFilters.search || 'empty'}`}
                onSearch={handleSearch}
                onClear={() => updateSearch('')}
                initialValue={activeFilters.search || ''}
                placeholder='Поиск сигналов...'
              />
            </div>

            {/* Right side: All controls in a compact row */}
            <div className='flex flex-shrink-0 items-center gap-1 sm:gap-1.5'>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleManualRefresh}
                disabled={isRefreshing || isFilterChange}
                className='h-7 w-7 sm:h-8 sm:w-8'
              >
                <IconRefresh
                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isRefreshing || isFilterChange ? 'animate-spin' : ''}`}
                />
              </Button>

              <NewProjectsSwitch
                checked={activeFilters.new === true}
                onChange={handleNewProjectsChange}
              />

              <FeedSettingsToggle
                onSettingsClick={() => {
                  console.log(
                    '🔧 Settings button clicked, current showSettings:',
                    showSettings
                  );
                  setShowSettings(!showSettings);
                  console.log('🔧 New showSettings will be:', !showSettings);
                }}
                hasActiveFilters={hasActiveSettingsFilters()}
              />

              <div className='hidden sm:block'>
                <SavedFiltersDropdown
                  currentFilters={activeFilters}
                  onApplyFilter={handleApplySavedFilter}
                  onClearAllFilters={wrappedClearAllFilters}
                  hasActiveFilters={hasActiveFilters}
                  currentFilterName={currentSavedFilterName}
                  className='w-48 sm:w-56 md:w-64 lg:w-72'
                />
              </div>

              <EnhancedGraphQLFiltersButton
                // Filter data
                categories={categories}
                stages={stages}
                rounds={rounds}
                // Loading states
                basicFiltersLoading={basicFiltersLoading}
                feedLoading={isFilterChange} // Only disable during filter changes, not pagination
                // Current filter state
                activeFilters={activeFilters}
                hasActiveFilters={hasActiveFilters}
                activeFiltersCount={activeFiltersCount}
                // Actions
                updateFilter={wrappedUpdateFilter}
                updateMultipleFilters={wrappedUpdateMultipleFilters}
                clearAllFilters={wrappedClearAllFilters}
                // UI props
                buttonLabel='Фильтры'
                currentFilterName={currentSavedFilterName}
                currentFilterId={currentSavedFilterId}
                hasFiltersChanged={hasFiltersChanged()}
              />
            </div>
          </div>

          {/* Additional row for mobile saved filters (only if needed) */}
          <div className='mt-2 flex justify-end sm:hidden'>
            <SavedFiltersDropdown
              currentFilters={activeFilters}
              onApplyFilter={handleApplySavedFilter}
              onClearAllFilters={wrappedClearAllFilters}
              hasActiveFilters={hasActiveFilters}
              currentFilterName={currentSavedFilterName}
              className='w-48'
            />
          </div>

          {/* Feed Settings - Inline display when open */}
          {showSettings && (
            <div className='mt-4 border-t pt-4'>
              <FeedSettingsInline
                onApply={handleApplySettings}
                onReset={handleRefresh}
                onClose={() => setShowSettings(false)}
                initialSettings={{
                  min_sig: activeFilters.minSignals?.toString() || '1',
                  max_sig: activeFilters.maxSignals?.toString() || '20',
                  start_date:
                    activeFilters.new === true
                      ? undefined
                      : activeFilters.startDate,
                  end_date:
                    activeFilters.new === true
                      ? undefined
                      : activeFilters.endDate,
                  hide_liked: activeFilters.hideLiked ? 'true' : 'false',
                  trending:
                    activeFilters.trending === true
                      ? 'true'
                      : activeFilters.trending === false
                        ? 'false'
                        : 'false'
                }}
                title='Настройки ленты'
                isNewProjectsActive={activeFilters.new === true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Network Alerts - simplified with debug info */}
      {!isOnline && (
        <Alert className='mb-4 border-red-200 bg-red-50'>
          <IconWifiOff className='h-4 w-4 text-red-600' />
          <AlertDescription className='text-red-800'>
            <div className='flex items-center justify-between'>
              <span>
                Вы сейчас в оффлайн. Показываются кешированные данные где доступно.
              </span>
              <Button
                size='sm'
                variant='outline'
                className='ml-4 border-red-300 text-red-700 hover:bg-red-100'
                onClick={() => {
                  console.log('🔄 Manual online override clicked');
                  console.log('🌐 Navigator status:', navigator?.onLine);
                  setIsOnline(true);
                }}
              >
                Принудительно онлайн
              </Button>
            </div>
            <div className='mt-2 text-xs text-red-600'>
              Debug: Navigator={String(navigator?.onLine)}, State=
              {String(isOnline)}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Results Section */}
      <div className='w-full space-y-0.5'>
        {/* Show loading skeleton for initial load OR when filtering (regardless of existing data) */}
        {(feedLoading && (!feedData?.nodes || feedData.nodes.length === 0)) ||
        !feedData ||
        isFilterChange ? (
          <div className='smooth-fade-in w-full space-y-4'>
            {/* Show different loading message based on state */}
            {isFilterChange && (
              <div className='mb-4 w-full rounded-md border px-4 py-2'>
                <div className='flex items-center gap-2'>
                  <IconLoader2 className='h-4 w-4 animate-spin' />
                  <span className='text-sm'>Применение фильтров...</span>
                </div>
              </div>
            )}

            {/* Loading skeleton for cards */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className='enhanced-pulse w-full'>
                <div className='bg-card hover:bg-accent/40 flex w-full gap-4 rounded-lg border p-4 transition-transform duration-200'>
                  <div className='bg-muted h-16 w-16 flex-shrink-0 rounded-lg'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='bg-muted h-4 w-3/4 rounded'></div>
                    <div className='bg-muted h-3 w-1/2 rounded'></div>
                    <div className='flex gap-2'>
                      <div className='bg-muted h-5 w-16 rounded-full'></div>
                      <div className='bg-muted h-5 w-20 rounded-full'></div>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <AvatarSkeleton count={3} size='sm' spacing='separate' />
                    <AvatarSkeleton count={4} size='lg' spacing='loose' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isTransitioning ? (
          <div className='smooth-fade-in w-full space-y-4'>
            {/* Transitioning skeleton - lighter opacity and fewer items */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className='enhanced-pulse w-full opacity-30'>
                <div className='bg-card hover:bg-accent/40 flex w-full gap-4 rounded-lg border p-4 transition-transform duration-200'>
                  <div className='bg-muted h-16 w-16 flex-shrink-0 rounded-lg'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='bg-muted h-4 w-3/4 rounded'></div>
                    <div className='bg-muted h-3 w-1/2 rounded'></div>
                    <div className='flex gap-2'>
                      <div className='bg-muted h-5 w-16 rounded-full'></div>
                      <div className='bg-muted h-5 w-20 rounded-full'></div>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <AvatarSkeleton count={2} size='sm' spacing='loose' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : feedData?.nodes && feedData.nodes.length > 0 ? (
          <>
            {/* Content - no loading banners needed since we handle loading with skeleton above */}
            <div className='mb-4 w-full'>
              <p className='text-muted-foreground text-sm'>
                {feedData?.totalCount || 0} проектов / людей
              </p>
            </div>

            <CardsList
              cards={convertedSignals}
              isLoading={false}
              variant='default'
              emptyMessage='Сигналы не найдены'
              onToggleSave={handleToggleSave}
              onDelete={handleDelete}
              onOpenInvestorModal={handleOpenInvestorModal}
            />

            {/* Subtle pagination loading - show skeleton cards during pagination */}
            {isPaginating && feedData?.hasNextPage && (
              <div className='mt-4 w-full space-y-3'>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={`pagination-skeleton-${i}`}
                    className='w-full animate-pulse opacity-50'
                  >
                    <div className='bg-card hover:bg-accent/40 flex w-full gap-4 rounded-lg border p-4'>
                      <div className='bg-muted h-16 w-16 flex-shrink-0 rounded-lg'></div>
                      <div className='flex-1 space-y-2'>
                        <div className='bg-muted h-4 w-3/4 rounded'></div>
                        <div className='bg-muted h-3 w-1/2 rounded'></div>
                        <div className='flex gap-2'>
                          <div className='bg-muted h-5 w-16 rounded-full'></div>
                          <div className='bg-muted h-5 w-20 rounded-full'></div>
                        </div>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <AvatarSkeleton
                          count={3}
                          size='sm'
                          spacing='separate'
                        />
                        <AvatarSkeleton count={4} size='lg' spacing='loose' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Infinite Scroll for Load More */}
            <InfiniteScroll
              hasMore={feedData?.hasNextPage || false}
              isLoading={isPaginating} // Only show loading for pagination, not filter changes
              currentPage={feedData?.currentPage || 1}
              totalPages={feedData?.totalPages || 1}
              totalCount={feedData?.totalCount || 0}
              currentCount={feedData?.nodes?.length || 0}
              onLoadMore={handleLoadMore}
              completedText={`Все карточки загружены`}
            />
          </>
        ) : showEmptyState ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <IconSearch className='text-muted-foreground h-8 w-8' />
              </EmptyMedia>
              <EmptyTitle>Компании не найдены</EmptyTitle>
              <EmptyDescription>
                {hasActiveFilters ? (
                  <>
                    <span className='block'>
                      Мы не смогли найти компании, соответствующие вашим текущим
                      фильтрам.
                    </span>
                    <span className='block'>
                      Попробуйте изменить критерии или{' '}
                      <button
                        onClick={clearAllFilters}
                        className='text-primary font-medium transition-colors hover:underline'
                      >
                        очистить все фильтры
                      </button>
                    </span>
                  </>
                ) : (
                  'Компании не соответствуют вашим текущим критериям. Попробуйте обновить или изменить поиск.'
                )}
              </EmptyDescription>
            </EmptyHeader>
            {hasActiveFilters && (
              <EmptyContent>
                <Button size='sm' onClick={clearAllFilters}>
                  Очистить все фильтры
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : null}
      </div>

      {/* Scroll to top button */}
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

      {/* Investor Detail Modal */}
      {investorModalSlug && (
        <InvestorDetailModal
          isOpen={isInvestorModalOpen}
          onClose={handleCloseInvestorModal}
          slug={investorModalSlug}
        />
      )}
    </div>
  );
}
