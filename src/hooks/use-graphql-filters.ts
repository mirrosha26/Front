'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
// Simple debounce function to avoid lodash dependency
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T & { cancel: () => void } {
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
import { toast } from 'sonner';
import { convertEuropeanToISODate } from '@/lib/format';
import {
  USER_FEED_QUERY,
  BASIC_FILTERS_QUERY,
} from '@/lib/graphql/queries';
import {
  SignalCardFilters,
  PaginationInput,
  UserFeedVariables,
  FeedResponse,
  BasicFiltersResponse,
} from '@/lib/graphql/types';

interface FilterState {
  // Current active filters
  activeFilters: SignalCardFilters;
  
  // Cached filter options
  categories: any[];
  stages: any[];
  rounds: any[];
  
  // UI state
  loading: boolean;
  filterCount: number;
  hasActiveFilters: boolean;
}

// Load saved filters from localStorage
const loadSavedFilters = (): SignalCardFilters => {
  if (typeof window === 'undefined') return { hideLiked: true };
  
  try {
    const saved = localStorage.getItem('graphql-signal-filters');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Migrate old participantFilter format (snake_case to camelCase)
      if (parsed.participantFilter) {
        const oldFilter = parsed.participantFilter;
        
        // Check if it has old snake_case fields
        if ((oldFilter as any).participant_types || (oldFilter as any).participant_ids) {
          console.log('🔄 Migrating old participantFilter format to new format');
          
          // Convert to new format
          parsed.participantFilter = {
            mode: oldFilter.mode,
            participantTypes: (oldFilter as any).participant_types || oldFilter.participantTypes || [],
            participantIds: (oldFilter as any).participant_ids || oldFilter.participantIds || []
          };
          
          // Save the migrated version back to localStorage
          localStorage.setItem('graphql-signal-filters', JSON.stringify(parsed));
          console.log('✅ Migration completed');
        }
      }
      
      // Migrate old signalDisplayPreference to displayPreference
      if ((parsed as any).signalDisplayPreference && !parsed.displayPreference) {
        console.log('🔄 Migrating signalDisplayPreference to displayPreference');
        parsed.displayPreference = (parsed as any).signalDisplayPreference;
        delete (parsed as any).signalDisplayPreference;
        
        // Save the migrated version back to localStorage
        localStorage.setItem('graphql-signal-filters', JSON.stringify(parsed));
        console.log('✅ Migration completed for displayPreference');
      }
      
      // Clean up any stale false values that might exist in cache
      const cleanedFilters: SignalCardFilters = {};
      Object.entries(parsed).forEach(([key, value]) => {
        // Skip old signalDisplayPreference field (should use displayPreference instead)
        if (key === 'signalDisplayPreference') {
          return;
        }
        
        if (value !== undefined && value !== null && value !== '' && value !== false && 
            (!Array.isArray(value) || value.length > 0)) {
          cleanedFilters[key as keyof SignalCardFilters] = value as any;
        }
      });
      
      // Set hideLiked to true by default if not explicitly set to false
      if (cleanedFilters.hideLiked === undefined) {
        cleanedFilters.hideLiked = true;
      }
      
      return cleanedFilters;
    }
  } catch (error) {
    console.warn('Failed to load saved filters:', error);
    // If parsing fails, clear the corrupted cache
    try {
      localStorage.removeItem('graphql-signal-filters');
      console.log('🗑️ Cleared corrupted filter cache');
    } catch (clearError) {
      console.warn('Failed to clear corrupted cache:', clearError);
    }
  }
  
  // Return hideLiked: true by default when no saved filters exist
  return { hideLiked: true };
};

// Helper function to check if filters have active non-default values
const hasActiveNonDefaultFilters = (filters: SignalCardFilters): boolean => {
  // Check if any non-default filters exist
  const hasNonDefaultSignals = (
    (filters.minSignals !== undefined && filters.minSignals !== 1) ||
    (filters.maxSignals !== undefined && filters.maxSignals !== 20)
  );
  
  const hasOtherActiveFilters = Object.entries(filters).some(([key, value]) => {
    // Skip default signal values
    if (key === 'minSignals' && value === 1) return false;
    if (key === 'maxSignals' && value === 20) return false;
    
    // Skip hideLiked when it's true (default value)
    if (key === 'hideLiked' && value === true) return false;
    
    // Skip other excluded keys
    if (['trending', 'startDate', 'endDate', 'new'].includes(key)) return false;
    
    // Check if value is meaningful
    return value !== undefined && value !== null && value !== '' && value !== false && 
           (!Array.isArray(value) || value.length > 0);
  });
  
  return hasNonDefaultSignals || hasOtherActiveFilters;
};

// Save filters to localStorage
const saveFiltersToCache = (filters: SignalCardFilters) => {
  if (typeof window === 'undefined') return;
  
  console.log('💾 saveFiltersToCache called with:', filters);
  
  try {
    // Clean filters by removing false/empty values and default values before saving
    const cleanedFilters: SignalCardFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      // Skip old signalDisplayPreference field (should use displayPreference instead)
      if (key === 'signalDisplayPreference') {
        return;
      }
      
      if (value !== undefined && value !== null && value !== '' && value !== false && 
          (!Array.isArray(value) || value.length > 0)) {
        // Don't save hideLiked when it's true (default value)
        if (key === 'hideLiked' && value === true) {
          return;
        }
        cleanedFilters[key as keyof SignalCardFilters] = value;
      }
    });
    
    console.log('💾 cleanedFilters for localStorage:', cleanedFilters);
    
    if (cleanedFilters.participantFilter) {
      console.log('🎯 participantFilter being saved to localStorage:', JSON.stringify(cleanedFilters.participantFilter, null, 2));
    }
    
    // Don't save empty filters
    const hasFilters = Object.keys(cleanedFilters).length > 0;
    
    if (hasFilters) {
      localStorage.setItem('graphql-signal-filters', JSON.stringify(cleanedFilters));
      console.log('✅ Saved to localStorage: graphql-signal-filters');
    } else {
      localStorage.removeItem('graphql-signal-filters');
      console.log('🗑️ Removed empty filters from localStorage');
    }
  } catch (error) {
    console.warn('Failed to save filters to cache:', error);
  }
};

const initialState: FilterState = {
  activeFilters: {}, // Will be loaded in useEffect
  categories: [],
  stages: [],
  rounds: [],
  loading: false,
  filterCount: 0,
  hasActiveFilters: false,
};

export function useGraphQLFilters(initialFilters?: SignalCardFilters) {
  // Get the actual filters that will be used in the initial query
  const initialQueryFilters = initialFilters || loadSavedFilters();
  
  // Initialize filter state with the same filters that are used in the initial query
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const hasActiveFilters = hasActiveNonDefaultFilters(initialQueryFilters);
    const filterCount = Object.entries(initialQueryFilters).filter(([k, v]) => 
      v !== undefined && v !== null && v !== '' && 
      (!Array.isArray(v) || v.length > 0) &&
      !['trending', 'startDate', 'endDate', 'minSignals', 'maxSignals', 'new'].includes(k) &&
      !(k === 'hideLiked' && v === true)
    ).length;
    
    return {
      ...initialState,
      activeFilters: initialQueryFilters, // Start with the same filters as the initial query
      hasActiveFilters,
      filterCount,
    };
  });
  
  const [feedData, setFeedData] = useState<FeedResponse | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [isFilterChange, setIsFilterChange] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  
  // New state for smooth transitions
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  
  // Refs for managing state
  const isInitializedRef = useRef(false);
  const hasInitialFetchRef = useRef(false);
  const debouncedFetchRef = useRef<any>(null);
  const isClearingFiltersRef = useRef(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add a ref to track when we're in a multiple filter update to prevent double loading
  const isUpdatingMultipleFiltersRef = useRef(false);

  // Load basic filter options (categories, stages, rounds) - prefetch for faster loading
  const { 
    data: basicFiltersData, 
    loading: basicFiltersLoading,
    refetch: refetchBasicFilters 
  } = useQuery<BasicFiltersResponse>(
    BASIC_FILTERS_QUERY,
    {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
      // Add prefetching hint for critical filter data
      notifyOnNetworkStatusChange: true,
    }
  );


  // Use the proper useQuery with fetchMore instead of lazy query
  const { 
    data: signalCardsData,
    loading: cardsLoading,
    error: cardsError,
    fetchMore: fetchMoreSignalCards,
    refetch: refetchSignalCards
  } = useQuery(
    USER_FEED_QUERY,
    {
      variables: {
        pagination: { page: 1, pageSize: 30 },
        filters: isInitializedRef.current ? filterState.activeFilters : initialQueryFilters,
      },
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true, // Show loading state during refetch
      // Remove skip condition to enable parallel loading
    }
  );

  // Debug: Log GraphQL variables when they change
  useEffect(() => {
    const currentVariables = {
      pagination: { page: 1, pageSize: 30 },
      filters: isInitializedRef.current ? filterState.activeFilters : initialQueryFilters,
    };
    
    console.log('🔍 GraphQL Query Variables:', JSON.stringify(currentVariables, null, 2));
    
    // Special debug for participantFilter
    if (currentVariables.filters.participantFilter) {
      console.log('🎯 participantFilter structure:', JSON.stringify(currentVariables.filters.participantFilter, null, 2));
      console.log('🎯 participantFilter keys:', Object.keys(currentVariables.filters.participantFilter));
    }
  }, [filterState.activeFilters, isInitializedRef.current, initialQueryFilters]);

  // Helper function to handle smooth transitions to empty state
  const handleEmptyStateTransition = useCallback((isEmpty: boolean, isLoading: boolean) => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    if (isEmpty && !isLoading) {
      // Start transition to empty state
      setIsTransitioning(true);
      setShowEmptyState(false);
      
      // Show empty state after a brief delay for smooth transition
      transitionTimeoutRef.current = setTimeout(() => {
        setShowEmptyState(true);
        setIsTransitioning(false);
      }, 300); // 300ms delay for smooth transition
    } else {
      // Not empty or still loading - hide empty state immediately
      setIsTransitioning(false);
      setShowEmptyState(false);
    }
  }, []);

  // Update feedData when userFeed query data changes
  useEffect(() => {
    if (signalCardsData?.userFeed) {
      const newFeedData = signalCardsData.userFeed;
      setFeedData(newFeedData);
      
      // Check if we should show empty state with smooth transition
      const isEmpty = !newFeedData.nodes || newFeedData.nodes.length === 0;
      handleEmptyStateTransition(isEmpty, cardsLoading);
      
      setFeedLoading(false);
      setIsFilterChange(false);
      setIsPaginating(false);
    } else if (cardsError && feedData) {
      // If there's an error but we have cached data, keep using it
      console.warn('GraphQL error occurred, but using cached feedData');
      setFeedLoading(false);
      setIsFilterChange(false);
      setIsPaginating(false);
    }
  }, [signalCardsData, cardsLoading, cardsError, feedData, handleEmptyStateTransition]);

  // Additional useEffect to handle loading state reset when Apollo's loading state changes
  // This is crucial for handling cache hits where signalCardsData doesn't change but cardsLoading does
  useEffect(() => {
    if (!cardsLoading && signalCardsData?.userFeed) {
      const isEmpty = !signalCardsData.userFeed.nodes || signalCardsData.userFeed.nodes.length === 0;
      handleEmptyStateTransition(isEmpty, false);
      
      setFeedLoading(false);
      setIsFilterChange(false);
      setIsPaginating(false);
    }
  }, [cardsLoading, signalCardsData?.userFeed, handleEmptyStateTransition]);

  // Handle errors
  useEffect(() => {
    if (cardsError) {
      console.error('Error fetching signal cards:', cardsError);
      
      // Check if error is a GraphQL error with backend issues (like logger errors)
      const isBackendError = cardsError.graphQLErrors?.some(
        (err: any) => err.message?.includes('logger') || 
                     err.message?.includes('cannot access local variable')
      );
      
      // Only show toast for user-facing errors, not backend development errors
      if (!isBackendError) {
      toast.error('Не удалось загрузить сигналы');
      } else {
        console.warn('Backend error detected, using cached data if available:', cardsError);
      }
      
      setFeedLoading(false);
      setIsFilterChange(false);
      setIsPaginating(false);
      setIsTransitioning(false);
      
      // If we have cached data, show it even if there's an error
      if (signalCardsData?.userFeed) {
        setShowEmptyState(signalCardsData.userFeed.nodes?.length === 0);
      } else {
      setShowEmptyState(false);
    }
    }
  }, [cardsError, signalCardsData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Handle non-search filter changes - refetch immediately
  useEffect(() => {
    // Skip if we're in the middle of a multiple filter update to prevent double loading
    if (hasInitialFetchRef.current && isInitializedRef.current && !isClearingFiltersRef.current && !isUpdatingMultipleFiltersRef.current) {
      // Extract non-search filters to check if they changed
      const { search, ...nonSearchFilters } = filterState.activeFilters;
      
      console.log('🔄 Reactive useEffect triggered - refetching with filters:', filterState.activeFilters);
      
      // Special debug for participantFilter
      if (filterState.activeFilters.participantFilter) {
        console.log('🎯 Reactive useEffect - participantFilter detected:', JSON.stringify(filterState.activeFilters.participantFilter, null, 2));
      }
      
      setFeedLoading(true);
      setIsFilterChange(true);
      refetchSignalCards({
        pagination: { page: 1, pageSize: 30 },
        filters: filterState.activeFilters,
      }).catch((error) => {
        console.error('🔄 Non-search filter refetch failed:', error);
        setFeedLoading(false);
        setIsFilterChange(false);
      });
    } else {
      console.log('🔄 Reactive useEffect skipped:', {
        hasInitialFetch: hasInitialFetchRef.current,
        isInitialized: isInitializedRef.current,
        isClearingFilters: isClearingFiltersRef.current,
        isUpdatingMultiple: isUpdatingMultipleFiltersRef.current
      });
    }
  }, [
    // Watch only non-search filter changes - removed refetchSignalCards to prevent infinite loop
    filterState.activeFilters.categories,
    filterState.activeFilters.participants,
    filterState.activeFilters.participantFilter, // Added to trigger refetch when participantFilter changes
    filterState.activeFilters.stages,
    filterState.activeFilters.roundStatuses,
    filterState.activeFilters.startDate,
    filterState.activeFilters.endDate,
    filterState.activeFilters.minSignals,
    filterState.activeFilters.maxSignals,
    filterState.activeFilters.featured,
    filterState.activeFilters.isOpen,
    filterState.activeFilters.hideLiked,
    filterState.activeFilters.trending,
    filterState.activeFilters.new // Add new filter to trigger loading states
  ]);

  // Initialize basic filters when data is loaded
  useEffect(() => {
    if (basicFiltersData) {
      // Update filter options whenever basicFiltersData changes
      setFilterState(prev => ({
        ...prev,
        categories: basicFiltersData.categories || [],
        stages: basicFiltersData.stages || [],
        rounds: basicFiltersData.roundStatuses || [],
        // Don't update activeFilters - they're already initialized correctly
      }));
      
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
      }
    }
  }, [basicFiltersData]);

  // Track when filters are initialized - no refetch needed since we start with correct filters
  useEffect(() => {
    if (isInitializedRef.current && !hasInitialFetchRef.current) {
      hasInitialFetchRef.current = true;
      console.log('🔄 Filters initialized - no refetch needed, already using correct filters:', filterState.activeFilters);
    }
  }, [isInitializedRef.current, filterState.activeFilters]);


  // Create debounced refetch function for search
  const createDebouncedSearch = useCallback(() => {
    return debounce(async (filters: SignalCardFilters) => {
      setFeedLoading(true);
      try {
        await refetchSignalCards({
          pagination: { page: 1, pageSize: 30 },
          filters,
        });
        // Force reset loading states after refetch completes
        // This ensures loading states are reset even for cache hits
        setFeedLoading(false);
        setIsFilterChange(false);
      } catch (error) {
        console.error('Search refetch failed:', error);
        setFeedLoading(false);
        setIsFilterChange(false);
      }
    }, 300);
  }, [refetchSignalCards]);

  // Initialize debounced search
  useEffect(() => {
    debouncedFetchRef.current = createDebouncedSearch();
    return () => {
      if (debouncedFetchRef.current) {
        debouncedFetchRef.current.cancel();
      }
    };
  }, [createDebouncedSearch]);

  // Update active filters and trigger search
  const updateFilter = useCallback((key: keyof SignalCardFilters, value: any) => {
    console.log(`🔧 updateFilter called: ${key} =`, value);
    
    // Special debug for participantFilter
    if (key === 'participantFilter') {
      console.log('🎯 participantFilter being set:', JSON.stringify(value, null, 2));
    }
    
    // Convert date values to ISO format for GraphQL
    let processedValue = value;
    if ((key === 'startDate' || key === 'endDate') && value && typeof value === 'string') {
      processedValue = convertEuropeanToISODate(value);
    }
    
    const newFilters = { ...filterState.activeFilters, [key]: processedValue };
    
    // Remove undefined/empty/false values
    if (processedValue === undefined || processedValue === null || processedValue === '' || 
        processedValue === false || (Array.isArray(processedValue) && processedValue.length === 0)) {
      delete newFilters[key];
    }

    // Special handling: Remove maxSignals if it's 20 (default value)
    if (key === 'maxSignals' && processedValue === 20) {
      delete newFilters[key];
    }

    console.log(`🔧 newFilters after updateFilter:`, newFilters);

    const hasActiveFilters = hasActiveNonDefaultFilters(newFilters);
    const filterCount = Object.entries(newFilters).filter(([k, v]) => 
      v !== undefined && v !== null && v !== '' && v !== false && 
      (!Array.isArray(v) || v.length > 0) &&
      !['trending', 'startDate', 'endDate', 'minSignals', 'maxSignals', 'new'].includes(k) &&
      !(k === 'hideLiked' && v === true)
    ).length;

    setFilterState(prev => ({
      ...prev,
      activeFilters: newFilters,
      hasActiveFilters,
      filterCount,
    }));

    // Save to cache
    saveFiltersToCache(newFilters);

    // Show immediate loading feedback for all filter changes
    if (hasInitialFetchRef.current) {
      if (key === 'search') {
        // For search, use debounced loading
        setFeedLoading(true);
        setIsFilterChange(true);

        // Trigger debounced search
        if (debouncedFetchRef.current) {
          debouncedFetchRef.current(newFilters);
        }
      } else {
        // For non-search filters, set loading immediately - reactive useEffect will handle the refetch
        console.log('🔄 Setting loading states for filter:', key, '=', processedValue);
        setFeedLoading(true);
        setIsFilterChange(true);
      }
    }
  }, [filterState.activeFilters]);

  // Search function with debouncing
  const updateSearch = useCallback((searchTerm: string) => {
    updateFilter('search', searchTerm);
  }, [updateFilter]);

  // Clear all filters
  const clearAllFilters = useCallback(async () => {
    // List of filter keys to preserve
    const preserveKeys = [
      'startDate',
      'endDate',
      'hideLiked',
      'trending',
      'minSignals',
      'maxSignals'
    ];

    // Extract current values for keys to preserve
    const preserved: Partial<SignalCardFilters> = {};
    for (const key of preserveKeys) {
      const typedKey = key as keyof SignalCardFilters;
      if (
        filterState.activeFilters &&
        Object.prototype.hasOwnProperty.call(filterState.activeFilters, typedKey)
      ) {
        const value = filterState.activeFilters[typedKey];
        if (value !== undefined) {
          (preserved as any)[typedKey] = value;
        }
      }
    }

    // Set flag to prevent reactive useEffect from triggering
    isClearingFiltersRef.current = true;

    // Reset transition states when clearing filters
    setIsTransitioning(false);
    setShowEmptyState(false);

    // New filter state: only preserved keys
    const newFilters = { ...preserved };
    
    // Ensure hideLiked defaults to true if not explicitly set
    if (newFilters.hideLiked === undefined) {
      newFilters.hideLiked = true;
    }

    // Clear cache first
    saveFiltersToCache(newFilters);

    // Update UI state IMMEDIATELY for instant visual feedback
    setFilterState(prev => ({
      ...prev,
      activeFilters: newFilters,
      hasActiveFilters: hasActiveNonDefaultFilters(newFilters),
      filterCount: 0, // Optionally, recalculate if needed
    }));

    // Give React time to update the UI before starting loading states
    await new Promise(resolve => setTimeout(resolve, 0));

    // Only refetch if initialized - bypass reactive system entirely
    if (hasInitialFetchRef.current) {
      setFeedLoading(true);
      setIsFilterChange(true);
      try {
        await refetchSignalCards({
          pagination: { page: 1, pageSize: 20 },
          filters: newFilters,
        });
      } catch (error) {
        console.error('Error clearing filters:', error);
        toast.error('Не удалось очистить фильтры');

        // Revert to previous state on error (optimistic update rollback)
        const savedFilters = loadSavedFilters();
        const hasActiveFilters = hasActiveNonDefaultFilters(savedFilters);
        const filterCount = Object.entries(savedFilters).filter(([k, v]) =>
          v !== undefined && v !== null && v !== '' &&
          (!Array.isArray(v) || v.length > 0) &&
          !['hideLiked', 'trending', 'startDate', 'endDate', 'minSignals', 'maxSignals', 'new'].includes(k) &&
          !(k === 'hideLiked' && v === true)
        ).length;

        setFilterState(prev => ({
          ...prev,
          activeFilters: savedFilters,
          hasActiveFilters,
          filterCount,
        }));

        setFeedLoading(false);
        setIsFilterChange(false);
        setIsTransitioning(false);
        setShowEmptyState(false);
      } finally {
        // Reset flag after operation completes
        isClearingFiltersRef.current = false;
      }
    } else {
      // Reset flag immediately if not initialized
      isClearingFiltersRef.current = false;
    }
  }, [filterState.activeFilters, refetchSignalCards]);

  // Update multiple filters at once to prevent multiple requests
  const updateMultipleFilters = useCallback((filtersToUpdate: Partial<SignalCardFilters>) => {
    // Set flag to prevent reactive useEffect from triggering
    isUpdatingMultipleFiltersRef.current = true;
    
    const newFilters = { ...filterState.activeFilters };
    
    // Apply all filter updates
    Object.entries(filtersToUpdate).forEach(([key, value]) => {
      const filterKey = key as keyof SignalCardFilters;
      
      // Convert date values to ISO format for GraphQL if needed
      let processedValue = value;
      if ((filterKey === 'startDate' || filterKey === 'endDate') && value && typeof value === 'string') {
        processedValue = convertEuropeanToISODate(value);
      }
      
      // Update filter value
      if (processedValue === undefined || processedValue === null || processedValue === '' || 
          processedValue === false || (Array.isArray(processedValue) && processedValue.length === 0)) {
        delete newFilters[filterKey];
      } else {
        newFilters[filterKey] = processedValue as any;
      }
    });

    // Special handling: Remove maxSignals if it's 20 (default value)
    if (newFilters.maxSignals === 20) {
      delete newFilters.maxSignals;
    }

    const hasActiveFilters = hasActiveNonDefaultFilters(newFilters);
    const filterCount = Object.entries(newFilters).filter(([k, v]) => 
      v !== undefined && v !== null && v !== '' && v !== false && 
      (!Array.isArray(v) || v.length > 0) &&
      !['trending', 'startDate', 'endDate', 'minSignals', 'maxSignals', 'new'].includes(k) &&
      !(k === 'hideLiked' && v === true)
    ).length;

    // Update state
    setFilterState(prev => ({
      ...prev,
      activeFilters: newFilters,
      hasActiveFilters,
      filterCount,
    }));

    // Save to cache
    saveFiltersToCache(newFilters);

    // Trigger single refetch after all filters are applied
    if (hasInitialFetchRef.current) {
      setFeedLoading(true);
      setIsFilterChange(true);
      refetchSignalCards({
        pagination: { page: 1, pageSize: 30 },
        filters: newFilters,
      }).catch((error) => {
        console.error('Multiple filters refetch failed:', error);
        setFeedLoading(false);
        setIsFilterChange(false);
      }).finally(() => {
        // Reset flag after refetch completes
        isUpdatingMultipleFiltersRef.current = false;
      });
    } else {
      // Reset flag immediately if not initialized
      isUpdatingMultipleFiltersRef.current = false;
    }
  }, [filterState.activeFilters, refetchSignalCards]);

  // ✅ OPTIMIZED: Replace all filters at once for saved filters (single GraphQL request)
  const replaceAllFilters = useCallback((filtersToReplace: Partial<SignalCardFilters>) => {
    
    // Set flag to prevent reactive useEffect from triggering
    isUpdatingMultipleFiltersRef.current = true;
    
    // Start with empty filters object - complete replacement, not merge
    const newFilters: SignalCardFilters = {};
    
    // Apply only the provided filter values
    Object.entries(filtersToReplace).forEach(([key, value]) => {
      const filterKey = key as keyof SignalCardFilters;
      
      // Convert date values to ISO format for GraphQL if needed
      let processedValue = value;
      if ((filterKey === 'startDate' || filterKey === 'endDate') && value && typeof value === 'string') {
        processedValue = convertEuropeanToISODate(value);
      }
      
      // Only add non-empty values (skip false for boolean filters)
      if (processedValue !== undefined && processedValue !== null && processedValue !== '' && 
          processedValue !== false && (!Array.isArray(processedValue) || processedValue.length > 0)) {
        newFilters[filterKey] = processedValue as any;
        console.log(`🔧 Added filter ${filterKey}:`, processedValue);
      } else {
        console.log(`🔧 Skipped filter ${filterKey} (empty value):`, processedValue);
      }
    });

    // Special handling: Remove maxSignals if it's 20 (default value)
    if (newFilters.maxSignals === 20) {
      delete newFilters.maxSignals;
      console.log('🔧 Removed maxSignals=20 (default value)');
    }

    const hasActiveFilters = hasActiveNonDefaultFilters(newFilters);
    const filterCount = Object.entries(newFilters).filter(([k, v]) => 
      v !== undefined && v !== null && v !== '' && v !== false && 
      (!Array.isArray(v) || v.length > 0) &&
      !['trending', 'startDate', 'endDate', 'minSignals', 'maxSignals', 'new'].includes(k) &&
      !(k === 'hideLiked' && v === true)
    ).length;

    // Update state immediately for instant UI feedback
    setFilterState(prev => ({
      ...prev,
      activeFilters: newFilters,
      hasActiveFilters,
      filterCount,
    }));

    // Save to cache
    saveFiltersToCache(newFilters);

    // Trigger single refetch - this is the only GraphQL request for saved filters
    if (hasInitialFetchRef.current) {
      setFeedLoading(true);
      setIsFilterChange(true);
      console.log('🔄 Triggering refetch with filters:', newFilters);
      refetchSignalCards({
        pagination: { page: 1, pageSize: 30 },
        filters: newFilters,
      }).catch((error) => {
        console.error('❌ Replace all filters refetch failed:', error);
        setFeedLoading(false);
        setIsFilterChange(false);
      }).finally(() => {
        // Reset flag after refetch completes
        isUpdatingMultipleFiltersRef.current = false;
      });
    } else {
      // Reset flag immediately if not initialized
      isUpdatingMultipleFiltersRef.current = false;
    }
    
    console.log('✅ All filters replaced with single GraphQL request');
  }, [refetchSignalCards]);


  // Load more feed data (pagination) - use proper fetchMore for appending
  const loadMore = useCallback(async () => {
    if (!feedData?.hasNextPage || feedLoading || isPaginating) {
      console.log('🛑 Cannot load more:', { 
        hasNextPage: feedData?.hasNextPage, 
        feedLoading, 
        isPaginating 
      });
      return;
    }

    console.log('🔄 Loading more feed data with fetchMore...');
    setIsPaginating(true);
    
    try {
      await fetchMoreSignalCards({
        variables: {
          pagination: { 
            page: (feedData.currentPage || 1) + 1, 
            pageSize: 30 
          },
          filters: filterState.activeFilters,
        }
      });
      console.log('✅ Successfully loaded more cards');
    } catch (error: any) {
      console.error('❌ Error loading more feed data:', error);
      
      // Check if error is a GraphQL error with backend issues
      const isBackendError = error?.graphQLErrors?.some(
        (err: any) => err.message?.includes('logger') || 
                     err.message?.includes('cannot access local variable')
      );
      
      // Only show toast for user-facing errors, not backend development errors
      if (!isBackendError) {
      toast.error('Не удалось загрузить больше карточек');
      } else {
        console.warn('Backend error during pagination, stopping load more');
      }
    } finally {
      // Always reset pagination state regardless of success/failure
      setIsPaginating(false);
    }
  }, [fetchMoreSignalCards, feedData, filterState.activeFilters, feedLoading, isPaginating]);


  return {
    // Filter state
    activeFilters: filterState.activeFilters,
    hasActiveFilters: filterState.hasActiveFilters,
    activeFiltersCount: filterState.filterCount,
    
    // Filter options
    categories: filterState.categories,
    stages: filterState.stages,
    rounds: filterState.rounds,
    
    // Feed data
    feedData,
    feedLoading: feedLoading || cardsLoading,
    isFilterChange,
    isPaginating,
    
    // Transition states for smooth empty state handling
    isTransitioning,
    showEmptyState,
    
    // Loading states for filter options
    basicFiltersLoading,
    
    // Actions
    updateFilter,
    updateSearch,
    updateMultipleFilters,
    replaceAllFilters, // ✅ New optimized function for saved filters
    clearAllFilters,
    loadMore,
    
    // Cache management
    refetchBasicFilters,
  };
} 