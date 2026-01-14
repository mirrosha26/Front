'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useQuery, NetworkStatus, useApolloClient, gql } from '@apollo/client';
import { flushSync } from 'react-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import {
  Loader2,
  Search,
  Building,
  Handshake,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import {
  ANGELS_QUERY,
  VCS_INVESTORS_QUERY,
  SYNDICATES_QUERY,
  FOUNDERS_QUERY,
  GET_FAVORITES_QUERY
} from '@/lib/graphql/queries';
import type {
  EntityQueryResponse,
  Participant,
  SignalCardFilters
} from '@/lib/graphql/types';

type EntityType =
  | 'accelerators'
  | 'vcs_investors'
  | 'angels'
  | 'founders'
  | 'favorites';

// Enhanced interface to support both traditional and smart mode
export interface SmartSelectionData {
  mode: 'traditional' | 'smart';
  entityType?: EntityType; // Now used in both modes for proper handling
  participantIds?: string[];
  excludedParticipants?: string[];
}

export interface EntitySpecificFiltersProps {
  selectedParticipants: string[];
  onParticipantsChange: (participants: string[] | SmartSelectionData) => void;
  className?: string;
  participantFilter?: SignalCardFilters['participantFilter'];
}

interface SmartSelectionState {
  [key: string]: {
    isSmartMode: boolean;
    excludedParticipants: string[];
    isAutoEnabled: boolean; // Track if smart mode was auto-enabled by "Select All"
  };
}

const ITEMS_PER_PAGE = 30;

export function EntitySpecificFilters({
  selectedParticipants = [],
  onParticipantsChange,
  className = '',
  participantFilter
}: EntitySpecificFiltersProps) {
  const [activeTab, setActiveTab] = useState<EntityType>('accelerators');
  const [searchTerm, setSearchTerm] = useState('');
  const apolloClient = useApolloClient();

  // Smart selection state for each tab
  const [smartSelection, setSmartSelection] = useState<SmartSelectionState>({
    accelerators: {
      isSmartMode: false,
      excludedParticipants: [],
      isAutoEnabled: false
    },
    vcs_investors: {
      isSmartMode: false,
      excludedParticipants: [],
      isAutoEnabled: false
    },
    angels: {
      isSmartMode: false,
      excludedParticipants: [],
      isAutoEnabled: false
    },
    founders: {
      isSmartMode: false,
      excludedParticipants: [],
      isAutoEnabled: false
    },
    favorites: {
      isSmartMode: false,
      excludedParticipants: [],
      isAutoEnabled: false
    }
  });

  // Optimistic state for instant visual feedback
  const [optimisticState, setOptimisticState] = useState<{
    pendingSmartMode?: { entityType: EntityType; enabled: boolean };
    pendingDeselect?: { entityType: EntityType };
  }>({});

  // Clear optimistic state when switching tabs to prevent UI inconsistencies
  useEffect(() => {
    setOptimisticState({});
  }, [activeTab]);

  // Synchronize internal smartSelection state with external participantFilter
  useEffect(() => {
    // Map backend participant types to entity types
    const backendToEntityMap: Record<string, EntityType> = {
      angel: 'angels',
      investor: 'vcs_investors',
      accelerator: 'accelerators',
      founder: 'founders'
      // Note: Private is handled separately since it can include all types
      // but with isPrivate: true flag
    };

    if (participantFilter && participantFilter.mode === 'EXCLUDE_FROM_TYPE') {
      // Handle multiple participant types in the filter
      const affectedEntityTypes = participantFilter.participantTypes
        .map((participantType) => backendToEntityMap[participantType])
        .filter(Boolean);

      console.log('🔄 Syncing multi-entity smart mode state:', {
        affectedEntityTypes,
        participantTypes: participantFilter.participantTypes,
        excludedParticipants: participantFilter.participantIds
      });

      setSmartSelection((prev) => {
        const updated = { ...prev };

        // First, reset any auto-enabled smart modes that are no longer in the filter
        Object.keys(updated).forEach((key) => {
          const entityType = key as EntityType;
          if (
            updated[entityType].isAutoEnabled &&
            !affectedEntityTypes.includes(entityType)
          ) {
            // This entity type was auto-enabled but is no longer in the filter
            updated[entityType] = {
              isSmartMode: false,
              excludedParticipants: [],
              isAutoEnabled: false
            };
          }
        });

        // Then, update the affected entity types
        affectedEntityTypes.forEach((entityType) => {
          updated[entityType] = {
            isSmartMode: true,
            excludedParticipants: participantFilter.participantIds || [],
            isAutoEnabled: true // Mark as auto-enabled since it came from external
          };
        });

        return updated;
      });
    } else {
      // No participantFilter active - reset only auto-enabled smart modes, preserve manual ones
      console.log(
        '🔄 No participantFilter - resetting only auto-enabled smart modes'
      );
      setSmartSelection((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          // Only reset if it was auto-enabled (came from external filter)
          if (updated[key].isAutoEnabled) {
            updated[key] = {
              isSmartMode: false,
              excludedParticipants: [],
              isAutoEnabled: false
            };
          }
        });
        return updated;
      });
    }
  }, [participantFilter]);

  // Debounce search
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const debouncedSearch = useCallback((term: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setSearchTerm(term);
    }, 300);
  }, []);

  const queryVariables = {
    first: ITEMS_PER_PAGE,
    search: searchTerm || undefined
  };

  // Angels Query
  const {
    data: angelsData,
    loading: angelsLoading,
    fetchMore: fetchMoreAngels,
    networkStatus: angelsNetworkStatus
  } = useQuery<EntityQueryResponse>(ANGELS_QUERY, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  });

  // VCs & Investors Query
  const {
    data: vcsData,
    loading: vcsLoading,
    fetchMore: fetchMoreVcs,
    networkStatus: vcsNetworkStatus
  } = useQuery<EntityQueryResponse>(VCS_INVESTORS_QUERY, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  });

  // Accelerators Query
  const {
    data: acceleratorsData,
    loading: acceleratorsLoading,
    fetchMore: fetchMoreAccelerators,
    networkStatus: acceleratorsNetworkStatus
  } = useQuery<EntityQueryResponse>(SYNDICATES_QUERY, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  });

  // Founders Query
  const {
    data: foundersData,
    loading: foundersLoading,
    fetchMore: fetchMoreFounders,
    networkStatus: foundersNetworkStatus
  } = useQuery<EntityQueryResponse>(FOUNDERS_QUERY, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  });

  // Private Participants Query
  const {
    data: privateData,
    loading: privateLoading,
    fetchMore: fetchMorePrivate,
    networkStatus: privateNetworkStatus
  } = useQuery<EntityQueryResponse>(GET_FAVORITES_QUERY, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  });

  // Only show loading spinner for initial loads, not pagination - tab-specific
  // Improved loading state logic - handles empty results and prevents infinite loading
  // Only show loading for true initial loads (when we have no data at all yet)
  const isInitialLoadingAngels =
    angelsLoading &&
    angelsNetworkStatus === NetworkStatus.loading &&
    (!angelsData || angelsData === undefined);
  const isInitialLoadingVCs =
    vcsLoading &&
    vcsNetworkStatus === NetworkStatus.loading &&
    (!vcsData || vcsData === undefined);
  const isInitialLoadingAccelerators =
    acceleratorsLoading &&
    acceleratorsNetworkStatus === NetworkStatus.loading &&
    (!acceleratorsData || acceleratorsData === undefined);
  const isInitialLoadingFounders =
    foundersLoading &&
    foundersNetworkStatus === NetworkStatus.loading &&
    (!foundersData || foundersData === undefined);
  const isInitialLoadingPrivate =
    privateLoading &&
    privateNetworkStatus === NetworkStatus.loading &&
    (!privateData || privateData === undefined);

  // Add loading state tracking for each entity type
  const [isLoadingMoreAngels, setIsLoadingMoreAngels] = useState(false);
  const [isLoadingMoreVCs, setIsLoadingMoreVCs] = useState(false);
  const [isLoadingMoreAccelerators, setIsLoadingMoreAccelerators] =
    useState(false);
  const [isLoadingMoreFounders, setIsLoadingMoreFounders] = useState(false);
  const [isLoadingMorePrivate, setIsLoadingMorePrivate] = useState(false);

  // Refs to track load more timeouts and prevent infinite loading
  const loadMoreTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Store original total counts (before search filtering) for accurate smart mode counts
  const [originalTotalCounts, setOriginalTotalCounts] = useState<
    Record<EntityType, number>
  >({
    angels: 0,
    vcs_investors: 0,
    accelerators: 0,
    founders: 0,
    favorites: 0
  });

  // Update original total counts when data loads without search filter
  useEffect(() => {
    if (!searchTerm) {
      // Only update counts when no search is active to capture true totals
      const newCounts = {
        angels:
          angelsData?.participants.totalCount || originalTotalCounts.angels,
        vcs_investors:
          vcsData?.participants.totalCount || originalTotalCounts.vcs_investors,
        accelerators:
          acceleratorsData?.participants.totalCount ||
          originalTotalCounts.accelerators,
        founders:
          foundersData?.participants.totalCount || originalTotalCounts.founders,
        favorites:
          privateData?.participants.totalCount || originalTotalCounts.favorites
      };

      // Only update if there are actual changes to avoid unnecessary re-renders
      const hasChanges = Object.entries(newCounts).some(
        ([key, value]) => value !== originalTotalCounts[key as EntityType]
      );

      if (hasChanges) {
        console.log('📊 Updating original total counts (no search active):', {
          old: originalTotalCounts,
          new: newCounts
        });
        setOriginalTotalCounts(newCounts);
      }
    }
  }, [
    angelsData?.participants.totalCount,
    vcsData?.participants.totalCount,
    acceleratorsData?.participants.totalCount,
    foundersData?.participants.totalCount,
    privateData?.participants.totalCount,
    searchTerm,
    originalTotalCounts
  ]);

  // Handle participant selection - enhanced for smart mode
  const handleParticipantToggle = useCallback(
    (participantId: string) => {
      const currentTabState = smartSelection[activeTab];

      if (currentTabState.isSmartMode) {
        // In smart mode, we're managing excluded participants
        const isExcluded =
          currentTabState.excludedParticipants.includes(participantId);

        const newExcluded = isExcluded
          ? currentTabState.excludedParticipants.filter(
              (id) => id !== participantId
            )
          : [...currentTabState.excludedParticipants, participantId];

        setSmartSelection((prev) => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            excludedParticipants: newExcluded
          }
        }));

        // Send smart mode data to parent
        onParticipantsChange({
          mode: 'smart',
          entityType: activeTab,
          excludedParticipants: newExcluded
        });
      } else {
        // Traditional mode - direct selection
        const isSelected = selectedParticipants.includes(participantId);
        const newSelection = isSelected
          ? selectedParticipants.filter((id) => id !== participantId)
          : [...selectedParticipants, participantId];

        onParticipantsChange({
          mode: 'traditional',
          entityType: activeTab, // Include entity type for proper handling
          participantIds: newSelection
        });
      }
    },
    [selectedParticipants, onParticipantsChange, smartSelection, activeTab]
  );

  // Handle smart mode toggle
  const handleSmartModeToggle = useCallback(
    (entityType: EntityType, enabled: boolean) => {
      setSmartSelection((prev) => ({
        ...prev,
        [entityType]: {
          ...prev[entityType],
          isSmartMode: enabled,
          excludedParticipants: enabled
            ? []
            : prev[entityType].excludedParticipants,
          isAutoEnabled: false // Manual toggle always sets isAutoEnabled to false
        }
      }));

      // Send appropriate data to parent based on mode
      if (enabled) {
        // Entering smart mode - send smart mode data with no exclusions
        onParticipantsChange({
          mode: 'smart',
          entityType: entityType,
          excludedParticipants: []
        });
      } else {
        // Exiting smart mode - send traditional mode with empty selection
        onParticipantsChange({
          mode: 'traditional',
          participantIds: []
        });
      }
    },
    [onParticipantsChange]
  );

  // Handle select all in current tab - automatically enables smart mode with optimistic updates
  const handleAutoSelectAll = useCallback(async () => {
    console.log(
      `🔄 Smart "Select All" for ${activeTab} - entering smart mode (optimistic)`
    );

    // Step 1: Batch all state updates together to prevent multiple re-renders
    flushSync(() => {
      // Update optimistic state for instant visual feedback
      setOptimisticState({
        pendingSmartMode: { entityType: activeTab, enabled: true }
      });

      // Update actual state immediately in the same batch
      setSmartSelection((prev) => ({
        ...prev,
        [activeTab]: {
          isSmartMode: true,
          excludedParticipants: [],
          isAutoEnabled: true // Mark as auto-enabled
        }
      }));
    });

    try {
      // Step 2: Send smart mode data to parent (triggers API request)
      onParticipantsChange({
        mode: 'smart',
        entityType: activeTab,
        excludedParticipants: []
      });

      // Step 3: Clear optimistic state after request likely completes
      setTimeout(() => {
        setOptimisticState({});
      }, 500);

      console.log(`✅ Smart mode enabled for ${activeTab} with no exclusions`);
    } catch (error) {
      console.error(`❌ Error enabling smart mode for ${activeTab}:`, error);

      // Step 4: Revert on error
      flushSync(() => {
        setSmartSelection((prev) => ({
          ...prev,
          [activeTab]: {
            isSmartMode: false,
            excludedParticipants: [],
            isAutoEnabled: false
          }
        }));

        setOptimisticState({});
      });
    }
  }, [activeTab, onParticipantsChange]);

  // Handle deselect all in current tab (from auto-enabled smart mode) with optimistic updates
  const handleAutoDeselectAll = useCallback(async () => {
    console.log(
      `🔄 "Deselect All" for ${activeTab} - exiting auto smart mode (optimistic)`
    );

    // Step 1: Batch all state updates together to prevent multiple re-renders
    flushSync(() => {
      // Update optimistic state for instant visual feedback
      setOptimisticState({
        pendingDeselect: { entityType: activeTab }
      });

      // Update actual state immediately in the same batch
      setSmartSelection((prev) => ({
        ...prev,
        [activeTab]: {
          isSmartMode: false,
          excludedParticipants: [],
          isAutoEnabled: false
        }
      }));
    });

    try {
      // Step 2: Send traditional mode data to parent (triggers API request)
      onParticipantsChange({
        mode: 'traditional',
        entityType: activeTab, // Include entity type for proper handling
        participantIds: [] // Empty means deselect all for this entity type
      });

      // Step 3: Clear optimistic state after request likely completes
      setTimeout(() => {
        setOptimisticState({});
      }, 500);

      console.log(
        `✅ Auto smart mode disabled for ${activeTab} - traditional mode with empty selection`
      );
    } catch (error) {
      console.error(`❌ Error disabling smart mode for ${activeTab}:`, error);

      // Step 4: Revert on error - restore smart mode
      flushSync(() => {
        setSmartSelection((prev) => ({
          ...prev,
          [activeTab]: {
            isSmartMode: true,
            excludedParticipants: [],
            isAutoEnabled: true
          }
        }));

        setOptimisticState({});
      });
    }
  }, [activeTab, onParticipantsChange]);

  // Handle select all in current tab (smart mode)
  const handleSelectAllInTab = useCallback(() => {
    const currentTabState = smartSelection[activeTab];
    if (currentTabState.isSmartMode) {
      // Clear all exclusions to select all
      setSmartSelection((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          excludedParticipants: []
        }
      }));

      // Send updated smart mode data to parent
      onParticipantsChange({
        mode: 'smart',
        entityType: activeTab,
        excludedParticipants: []
      });
    }
  }, [activeTab, smartSelection, onParticipantsChange]);

  // Handle deselect all in current tab (manual smart mode or traditional mode)
  const handleDeselectAllInTab = useCallback(() => {
    const currentTabState = smartSelection[activeTab];
    if (currentTabState.isSmartMode) {
      // Exit smart mode and clear selections
      console.log(
        `🔄 "Deselect All" for ${activeTab} - exiting manual smart mode`
      );

      setSmartSelection((prev) => ({
        ...prev,
        [activeTab]: {
          isSmartMode: false,
          excludedParticipants: [],
          isAutoEnabled: false
        }
      }));

      // Send traditional mode data to parent with explicit entity type
      onParticipantsChange({
        mode: 'traditional',
        entityType: activeTab, // Include entity type for proper handling
        participantIds: [] // Empty means deselect all for this entity type
      });
    } else {
      // Traditional mode - clear all selections for this entity type
      console.log(
        `🔄 "Deselect All" for ${activeTab} - clearing traditional selections`
      );

      onParticipantsChange({
        mode: 'traditional',
        entityType: activeTab, // Include entity type for proper handling
        participantIds: [] // Empty means deselect all for this entity type
      });
    }
  }, [activeTab, smartSelection, onParticipantsChange]);

  // Load more participants - separate functions for each entity type with loading states
  const handleLoadMoreAngels = useCallback(async () => {
    if (isLoadingMoreAngels || angelsNetworkStatus === NetworkStatus.fetchMore)
      return;

    if (fetchMoreAngels && angelsData?.participants.pageInfo.hasNextPage) {
      setIsLoadingMoreAngels(true);
      try {
        await fetchMoreAngels({
          variables: {
            after: angelsData.participants.pageInfo.endCursor
          }
        });
      } catch (error) {
        console.error('❌ Error loading more Angels:', error);
      } finally {
        setIsLoadingMoreAngels(false);
      }
    }
  }, [fetchMoreAngels, angelsData, isLoadingMoreAngels, angelsNetworkStatus]);

  const handleLoadMoreVCs = useCallback(async () => {
    if (isLoadingMoreVCs || vcsNetworkStatus === NetworkStatus.fetchMore)
      return;

    if (fetchMoreVcs && vcsData?.participants.pageInfo.hasNextPage) {
      setIsLoadingMoreVCs(true);
      try {
        await fetchMoreVcs({
          variables: {
            after: vcsData.participants.pageInfo.endCursor
          }
        });
      } catch (error) {
        console.error('❌ Error loading more VCs:', error);
      } finally {
        setIsLoadingMoreVCs(false);
      }
    }
  }, [fetchMoreVcs, vcsData, isLoadingMoreVCs, vcsNetworkStatus]);

  const handleLoadMoreAccelerators = useCallback(async () => {
    if (
      isLoadingMoreAccelerators ||
      acceleratorsNetworkStatus === NetworkStatus.fetchMore
    )
      return;

    if (
      fetchMoreAccelerators &&
      acceleratorsData?.participants.pageInfo.hasNextPage
    ) {
      setIsLoadingMoreAccelerators(true);
      try {
        await fetchMoreAccelerators({
          variables: {
            after: acceleratorsData.participants.pageInfo.endCursor
          }
        });
      } catch (error) {
        console.error('❌ Error loading more accelerators:', error);
      } finally {
        setIsLoadingMoreAccelerators(false);
      }
    }
  }, [
    fetchMoreAccelerators,
    acceleratorsData,
    isLoadingMoreAccelerators,
    acceleratorsNetworkStatus
  ]);

  const handleLoadMoreFounders = useCallback(async () => {
    if (
      isLoadingMoreFounders ||
      foundersNetworkStatus === NetworkStatus.fetchMore
    )
      return;

    console.log('🔄 Loading more Founders...', {
      hasNextPage: foundersData?.participants.pageInfo.hasNextPage,
      endCursor: foundersData?.participants.pageInfo.endCursor
    });

    if (fetchMoreFounders && foundersData?.participants.pageInfo.hasNextPage) {
      setIsLoadingMoreFounders(true);
      try {
        await fetchMoreFounders({
          variables: {
            after: foundersData.participants.pageInfo.endCursor
          }
        });
      } catch (error) {
        console.error('❌ Error loading more founders:', error);
      } finally {
        setIsLoadingMoreFounders(false);
      }
    }
  }, [
    fetchMoreFounders,
    foundersData,
    isLoadingMoreFounders,
    foundersNetworkStatus
  ]);

  const handleLoadMorePrivate = useCallback(async () => {
    // Enhanced guard conditions to prevent infinite loading
    const hasData = (privateData?.participants?.edges?.length ?? 0) > 0;
    const hasNextPage = privateData?.participants?.pageInfo?.hasNextPage;

    if (
      isLoadingMorePrivate ||
      privateNetworkStatus === NetworkStatus.fetchMore ||
      !hasNextPage ||
      !hasData
    ) {
      console.log('🛑 Skipping private load more:', {
        isLoadingMorePrivate,
        networkStatus: privateNetworkStatus,
        hasNextPage,
        hasData
      });
      return;
    }

    console.log('🔄 Loading more Private Participants...', {
      hasNextPage: privateData?.participants.pageInfo.hasNextPage,
      endCursor: privateData?.participants.pageInfo.endCursor,
      currentCount: privateData?.participants?.edges?.length ?? 0
    });

    if (fetchMorePrivate) {
      setIsLoadingMorePrivate(true);
      try {
        await fetchMorePrivate({
          variables: {
            after: privateData.participants.pageInfo.endCursor
          }
        });
        console.log('✅ Private participants load more completed');
      } catch (error) {
        console.error('❌ Error loading more private participants:', error);
      } finally {
        setIsLoadingMorePrivate(false);
      }
    }
  }, [
    fetchMorePrivate,
    privateData,
    isLoadingMorePrivate,
    privateNetworkStatus
  ]);

  // Refs for infinite scroll triggers
  const angelsScrollRef = useRef<HTMLDivElement>(null);
  const vcsScrollRef = useRef<HTMLDivElement>(null);
  const acceleratorsScrollRef = useRef<HTMLDivElement>(null);
  const foundersScrollRef = useRef<HTMLDivElement>(null);
  const privateScrollRef = useRef<HTMLDivElement>(null);

  // Set up intersection observers for each tab
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    // Add a small delay to ensure refs are attached
    const setupObservers = () => {
      // Angels observer - always create if ref exists
      if (
        angelsScrollRef.current &&
        angelsData?.participants.pageInfo.hasNextPage
      ) {
        const angelsObserver = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (
              entry.isIntersecting &&
              activeTab === 'angels' && // Only trigger when on Angels tab
              !isInitialLoadingAngels &&
              !isLoadingMoreAngels &&
              angelsData?.participants.pageInfo.hasNextPage
            ) {
              handleLoadMoreAngels();
            }
          },
          { rootMargin: '150px' }
        );

        angelsObserver.observe(angelsScrollRef.current);
        observers.push(angelsObserver);
      }

      // VCs observer - always create if ref exists
      if (vcsScrollRef.current && vcsData?.participants.pageInfo.hasNextPage) {
        const vcsObserver = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (
              entry.isIntersecting &&
              activeTab === 'vcs_investors' && // Only trigger when on VCs tab
              !isInitialLoadingVCs &&
              !isLoadingMoreVCs &&
              vcsNetworkStatus !== NetworkStatus.fetchMore
            ) {
              handleLoadMoreVCs();
            }
          },
          {
            root: null,
            threshold: 0.1,
            rootMargin: '200px'
          }
        );
        vcsObserver.observe(vcsScrollRef.current);
        observers.push(vcsObserver);
      }

      // Accelerators observer - always create if ref exists
      if (
        acceleratorsScrollRef.current &&
        acceleratorsData?.participants.pageInfo.hasNextPage
      ) {
        const acceleratorsObserver = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (
              entry.isIntersecting &&
              activeTab === 'accelerators' && // Only trigger when on accelerators tab
              !isInitialLoadingAccelerators &&
              !isLoadingMoreAccelerators &&
              acceleratorsNetworkStatus !== NetworkStatus.fetchMore
            ) {
              handleLoadMoreAccelerators();
            }
          },
          {
            root: null,
            threshold: 0.1,
            rootMargin: '200px'
          }
        );
        acceleratorsObserver.observe(acceleratorsScrollRef.current);
        observers.push(acceleratorsObserver);
      }

      // Founders observer - always create if ref exists
      if (
        foundersScrollRef.current &&
        foundersData?.participants.pageInfo.hasNextPage
      ) {
        const foundersObserver = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (
              entry.isIntersecting &&
              activeTab === 'founders' && // Only trigger when on founders tab
              !isInitialLoadingFounders &&
              !isLoadingMoreFounders &&
              foundersNetworkStatus !== NetworkStatus.fetchMore
            ) {
              handleLoadMoreFounders();
            }
          },
          {
            root: null,
            threshold: 0.1,
            rootMargin: '200px'
          }
        );
        foundersObserver.observe(foundersScrollRef.current);
        observers.push(foundersObserver);
      }

      // Private Participants observer - always create if ref exists and has more data
      if (
        privateScrollRef.current &&
        privateData?.participants?.pageInfo?.hasNextPage &&
        privateData?.participants?.edges?.length > 0
      ) {
        const privateObserver = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (
              entry.isIntersecting &&
              activeTab === 'favorites' && // Only trigger when on favorites tab
              !isInitialLoadingPrivate &&
              !isLoadingMorePrivate &&
              privateNetworkStatus !== NetworkStatus.fetchMore &&
              privateData?.participants?.pageInfo?.hasNextPage // Double-check
            ) {
              console.log('🔄 Triggering load more for private participants');
              handleLoadMorePrivate();
            }
          },
          {
            root: null,
            threshold: 0.1,
            rootMargin: '200px'
          }
        );
        privateObserver.observe(privateScrollRef.current);
        observers.push(privateObserver);
      }
    };

    // Set up observers with a small delay
    const timeoutId = setTimeout(setupObservers, 100);

    return () => {
      clearTimeout(timeoutId);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [
    activeTab,
    angelsData?.participants.pageInfo.hasNextPage,
    vcsData?.participants.pageInfo.hasNextPage,
    acceleratorsData?.participants.pageInfo.hasNextPage,
    foundersData?.participants.pageInfo.hasNextPage,
    privateData?.participants.pageInfo.hasNextPage,
    isInitialLoadingAngels,
    isInitialLoadingVCs,
    isInitialLoadingAccelerators,
    isInitialLoadingFounders,
    isInitialLoadingPrivate,
    isLoadingMoreAngels,
    isLoadingMoreVCs,
    isLoadingMoreAccelerators,
    isLoadingMoreFounders,
    isLoadingMorePrivate,
    angelsNetworkStatus,
    vcsNetworkStatus,
    acceleratorsNetworkStatus,
    foundersNetworkStatus,
    privateNetworkStatus,
    handleLoadMoreAngels,
    handleLoadMoreVCs,
    handleLoadMoreAccelerators,
    handleLoadMoreFounders,
    handleLoadMorePrivate
  ]);

  // Helper function to determine entity type from participant type
  const getEntityTypeFromParticipantType = (
    participantType: string
  ): EntityType | null => {
    const type = participantType.toLowerCase();

    if (['angel'].includes(type)) {
      return 'angels';
    } else if (
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
    ) {
      return 'vcs_investors';
    } else if (
      [
        'accelerator',
        'fund',
        'platform',
        'syndicate',
        'community',
        'company'
      ].includes(type)
    ) {
      return 'accelerators';
    } else if (['person', 'entrepreneur'].includes(type)) {
      return 'founders';
    }

    return null;
  };

  // Check if data is ready for each entity type
  const isDataReady = (entityType: EntityType) => {
    const loadingStates = {
      angels: isInitialLoadingAngels,
      vcs_investors: isInitialLoadingVCs,
      accelerators: isInitialLoadingAccelerators,
      founders: isInitialLoadingFounders,
      favorites: isInitialLoadingPrivate
    };

    const dataStates = {
      angels: angelsData,
      vcs_investors: vcsData,
      accelerators: acceleratorsData,
      founders: foundersData,
      favorites: privateData
    };

    // Data is ready if:
    // 1. Not in initial loading state AND
    // 2. We have received data (even if empty with totalCount 0)
    return !loadingStates[entityType] && dataStates[entityType] !== undefined;
  };

  // Count selected participants for each tab - enhanced for smart mode with optimistic updates
  const getSelectedCount = (entityType: EntityType): number | null => {
    // Don't show count until data is loaded to prevent negative/zero display
    if (!isDataReady(entityType)) {
      return null;
    }

    // Check for optimistic state updates for instant visual feedback
    if (optimisticState.pendingSmartMode?.entityType === entityType) {
      if (optimisticState.pendingSmartMode.enabled) {
        // Optimistically show "all selected" - use total count
        const totalCount = originalTotalCounts[entityType] || 0;
        return totalCount;
      }
    }

    if (optimisticState.pendingDeselect?.entityType === entityType) {
      // Optimistically show "none selected"
      return 0;
    }

    const currentTabState = smartSelection[entityType];

    if (currentTabState.isSmartMode) {
      // In smart mode, show original total count (before search filtering) minus excluded participants
      // This ensures the count doesn't change when searching within the tab
      const totalCount = originalTotalCounts[entityType] || 0;
      const excludedCount = currentTabState.excludedParticipants.length;
      return Math.max(0, totalCount - excludedCount); // Ensure non-negative
    } else {
      // Traditional mode - count selected participants using cache data
      let count = 0;

      selectedParticipants.forEach((participantId) => {
        try {
          // Try to read participant from Apollo cache
          const participant = apolloClient.cache.readFragment({
            id: `Participant:${participantId}`,
            fragment: gql`
              fragment ParticipantType on Participant {
                id
                type
                isPrivate
                isSaved
              }
            `
          }) as { id: string; type: string; isPrivate?: boolean; isSaved?: boolean } | null;

          if (participant?.type) {
            // Special handling for favorites participants
            if (entityType === 'favorites') {
              if (participant.isSaved) {
                count++;
              }
            } else {
              // For non-private entity types, only count non-private participants
              if (!participant.isPrivate) {
                const participantEntityType = getEntityTypeFromParticipantType(
                  participant.type
                );
                if (participantEntityType === entityType) {
                  count++;
                }
              }
            }
          }
        } catch (error) {
          // Participant not in cache or error reading - skip silently
          console.debug(`Participant ${participantId} not found in cache`);
        }
      });

      return count;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fund':
      case 'investor':
      case 'angel':
      case 'scout':
        return <Building className='h-3 w-3' />;
      case 'accelerator':
      case 'platform':
      case 'syndicate':
        return <Handshake className='h-3 w-3' />;
      case 'founder':
      case 'person':
      case 'entrepreneur':
        return <Users className='h-3 w-3' />;
      default:
        return <Building className='h-3 w-3' />;
    }
  };

  const getTypeColor = (type: string) => {
    // Return empty string to use default Badge styling
    return '';
  };

  // Helper function to determine if a participant is selected (considering smart mode + optimistic updates)
  const isParticipantSelected = useCallback(
    (participantId: string, tabType: EntityType) => {
      // Check optimistic state first for instant visual feedback
      if (optimisticState.pendingSmartMode?.entityType === tabType) {
        if (optimisticState.pendingSmartMode.enabled) {
          // Optimistically show all items as selected (smart mode "Select All")
          return true;
        }
      }

      if (optimisticState.pendingDeselect?.entityType === tabType) {
        // Optimistically show all items as deselected
        return false;
      }

      // Use actual state
      const tabState = smartSelection[tabType];

      if (tabState.isSmartMode) {
        // In smart mode, selected = not excluded
        return !tabState.excludedParticipants.includes(participantId);
      } else {
        // Traditional mode - check if explicitly selected
        return selectedParticipants.includes(participantId);
      }
    },
    [optimisticState, smartSelection, selectedParticipants]
  );

  return (
    <div className={`w-full flex-1 flex flex-col ${className}`}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as EntityType)}
      >
        <TabsList className='grid h-auto w-full grid-cols-5 p-1'>
          <TabsTrigger
            value='accelerators'
            className='flex min-h-0 flex-1 flex-col text-[9px] sm:text-xs md:text-sm'
          >
            {(() => {
              const count = getSelectedCount('accelerators');
              return count !== null ? (
                <Badge variant='secondary'>{count}</Badge>
              ) : (
                <Badge variant='outline'>
                  <Loader2 className='h-2 w-2 animate-spin sm:h-2.5 sm:w-2.5' />
                </Badge>
              );
            })()}
            <span className='hidden sm:inline'>Фонды</span>
            <span className='sm:hidden'>Фонды</span>
          </TabsTrigger>
          <TabsTrigger
            value='vcs_investors'
            className='flex min-h-0 flex-1 flex-col text-[9px] sm:text-xs md:text-sm'
          >
            {(() => {
              const count = getSelectedCount('vcs_investors');
              return count !== null ? (
                <Badge variant='secondary'>{count}</Badge>
              ) : (
                <Badge variant='outline'>
                  <Loader2 className='h-2 w-2 animate-spin sm:h-2.5 sm:w-2.5' />
                </Badge>
              );
            })()}
            <span className='hidden sm:inline'>ВК</span>
            <span className='sm:hidden'>ВК</span>
          </TabsTrigger>
          <TabsTrigger
            value='angels'
            className='flex min-h-0 flex-1 flex-col text-[9px] sm:text-xs md:text-sm'
          >
            {(() => {
              const count = getSelectedCount('angels');
              return count !== null ? (
                <Badge variant='secondary'>{count}</Badge>
              ) : (
                <Badge variant='outline'>
                  <Loader2 className='h-2 w-2 animate-spin sm:h-2.5 sm:w-2.5' />
                </Badge>
              );
            })()}
            <span className='hidden sm:inline'>Ангелы</span>
            <span className='sm:hidden'>Ангелы</span>
          </TabsTrigger>
          <TabsTrigger
            value='founders'
            className='flex min-h-0 flex-1 flex-col text-[9px] sm:text-xs md:text-sm'
          >
            {(() => {
              const count = getSelectedCount('founders');
              return count !== null ? (
                <Badge variant='secondary'>{count}</Badge>
              ) : (
                <Badge variant='outline'>
                  <Loader2 className='h-2 w-2 animate-spin sm:h-2.5 sm:w-2.5' />
                </Badge>
              );
            })()}
            <span className='hidden sm:inline'>Основатели</span>
            <span className='sm:hidden'>Основатели</span>
          </TabsTrigger>
          <TabsTrigger
            value='favorites'
            className='flex min-h-0 flex-1 flex-col text-[9px] sm:text-xs md:text-sm'
          >
            {(() => {
              const count = getSelectedCount('favorites');
              return count !== null ? (
                <Badge variant='secondary'>{count}</Badge>
              ) : (
                <Badge variant='outline'>
                  <Loader2 className='h-2 w-2 animate-spin sm:h-2.5 sm:w-2.5' />
                </Badge>
              );
            })()}
            <span className='hidden sm:inline'>Избранное</span>
            <span className='sm:hidden'>Избранное</span>
          </TabsTrigger>
        </TabsList>

        <div className='mt-1 sm:mt-2'>
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-2 left-2 h-3 w-3 sm:top-2.5 sm:left-4 sm:h-4 sm:w-4' />
              <Input
                placeholder='Поиск ...'
                className='h-8 pl-8 text-sm sm:h-9 sm:pl-10 sm:text-base'
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            {/* Select All / Deselect All Button */}
            {(() => {
              const currentTabState = smartSelection[activeTab];
              let isSmartModeActive =
                currentTabState.isSmartMode && currentTabState.isAutoEnabled;

              // Apply optimistic state for instant visual feedback
              if (optimisticState.pendingSmartMode?.entityType === activeTab) {
                isSmartModeActive = optimisticState.pendingSmartMode.enabled;
              }
              if (optimisticState.pendingDeselect?.entityType === activeTab) {
                isSmartModeActive = false;
              }

              return (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={
                    isSmartModeActive
                      ? handleAutoDeselectAll
                      : handleAutoSelectAll
                  }
                  className='h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm'
                >
                  {isSmartModeActive ? (
                    <>
                      <XCircle className='mr-0.5 h-3 w-3 sm:h-4 sm:w-4' />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className='mr-0.5 h-3 w-3 sm:h-4 sm:w-4' />
                      Выбрать все
                    </>
                  )}
                </Button>
              );
            })()}
          </div>

          {/* Smart Selection Controls - Only show when manually enabled */}
          {smartSelection[activeTab].isSmartMode &&
            !smartSelection[activeTab].isAutoEnabled && (
              <div className='mt-2 space-y-2 sm:mt-3'>
                {/* Smart Mode Toggle */}
                <div className='bg-muted/50 flex items-center justify-between rounded-lg border p-3'>
                  <div className='flex items-center gap-2'>
                    <Switch
                      id={`smart-mode-${activeTab}`}
                      checked={smartSelection[activeTab].isSmartMode}
                      onCheckedChange={(checked) =>
                        handleSmartModeToggle(activeTab, checked)
                      }
                    />
                    <Label
                      htmlFor={`smart-mode-${activeTab}`}
                      className='text-sm font-medium'
                    >
                      Smart Selection Mode
                    </Label>
                    <Badge variant='secondary' className='ml-2 text-xs'>
                      {smartSelection[activeTab].excludedParticipants.length > 0
                        ? `${smartSelection[activeTab].excludedParticipants.length} excluded`
                        : 'All selected'}
                    </Badge>
                  </div>

                  {/* Smart Mode Controls */}
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleSelectAllInTab}
                      disabled={
                        smartSelection[activeTab].excludedParticipants
                          .length === 0
                      }
                      className='h-8 px-2 text-xs'
                    >
                      <CheckCircle2 className='mr-0.5 h-3 w-3' />
                      Выбрать все
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleDeselectAllInTab}
                      className='h-8 px-2 text-xs'
                    >
                      <XCircle className='mr-0.5 h-3 w-3' />
                      Deselect All
                    </Button>
                  </div>
                </div>

                {/* Smart Mode Status */}
                <div className='rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-blue-600' />
                    <span className='text-sm text-blue-800 dark:text-blue-200'>
                      <strong>Smart Mode Active:</strong> All{' '}
                      {activeTab.replace('_', ' ')} are selected
                      {smartSelection[activeTab].excludedParticipants.length >
                        0 && (
                        <span>
                          {' '}
                          except{' '}
                          {
                            smartSelection[activeTab].excludedParticipants
                              .length
                          }{' '}
                          excluded
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Accelerators Tab */}
        <TabsContent
          key='accelerators'
          value='accelerators'
          className='mt-2 sm:mt-3'
        >
          <ScrollArea className='min-h-[200px] max-h-[calc(100vh-300px)] pr-3 overflow-y-auto flex-1'>
            {isInitialLoadingAccelerators ? (
              <div className='flex items-center justify-center py-6 sm:py-8'>
                <Loader2 className='h-5 w-5 animate-spin sm:h-6 sm:w-6' />
                <span className='text-muted-foreground ml-2 text-xs sm:text-sm'>
                  Loading accelerators...
                </span>
              </div>
            ) : !acceleratorsData?.participants.edges.length ? (
              <div className='py-6 text-center sm:py-8'>
                <p className='text-muted-foreground text-xs sm:text-sm'>
                  {searchTerm
                    ? 'No accelerators found for this search.'
                    : 'No accelerators available.'}
                </p>
              </div>
            ) : (
              <div className='space-y-1 sm:space-y-2'>
                {acceleratorsData.participants.edges.map((edge) => {
                  const participant = edge.node;
                  const isSelected = isParticipantSelected(
                    participant.id,
                    'accelerators'
                  );
                  return (
                    <div
                      key={participant.id}
                      className={`flex cursor-pointer items-center space-x-2 rounded-lg p-2 sm:space-x-3 sm:p-3 ${
                        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleParticipantToggle(participant.id)}
                    >
                      <Avatar
                        className='h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8'
                        variant={
                          participant.isPrivate
                            ? 'favorites'
                            : participant.isSaved
                              ? 'followed'
                              : 'default'
                        }
                      >
                        <AvatarImage
                          src={participant.imageUrl}
                          alt={participant.name}
                        />
                        <AvatarFallback className='text-[10px] sm:text-xs'>
                          {participant.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1 overflow-hidden'>
                        <p className='text-foreground truncate text-xs font-medium sm:text-sm flex items-center gap-1'>
                          {participant.name}
                          {participant.isSaved && !participant.isPrivate && (
                            <IconHeartFilled className='h-3 w-3 text-red-500' />
                          )}
                        </p>
                        {participant.about && (
                          <p className='text-muted-foreground truncate text-[10px] sm:text-xs'>
                            {participant.about.length > 40
                              ? `${participant.about.substring(0, 40)}...`
                              : participant.about}
                          </p>
                        )}
                      </div>
                      <div className='flex-shrink-0 flex items-center gap-1'>
                        <Badge
                          variant='outline'
                          className={`${
                            participant.isPrivate
                              ? 'border-lime-500 text-lime-600'
                              : 'border-primary text-primary'
                          } bg-transparent text-[9px] sm:text-[10px]`}
                        >
                          <span className='hidden sm:inline'>
                            {participant.type.charAt(0).toUpperCase() +
                              participant.type.slice(1).toLowerCase()}
                          </span>
                          <span className='sm:hidden'>
                            {participant.type.substring(0, 3).toUpperCase()}
                          </span>
                        </Badge>
                        {participant.isPrivate && (
                          <Badge
                            variant='default'
                            className='bg-lime-500 text-[9px] text-lime-50 sm:text-[10px]'
                          >
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Infinite scroll trigger */}
                {acceleratorsData?.participants.pageInfo.hasNextPage && (
                  <div
                    ref={acceleratorsScrollRef}
                    className='flex min-h-[35px] items-center justify-center py-2 sm:min-h-[40px] sm:py-3'
                  >
                    {isLoadingMoreAccelerators && (
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm'>
                        <Loader2 className='h-3 w-3 animate-spin sm:h-4 sm:w-4' />
                        Loading more accelerators...
                      </div>
                    )}
                  </div>
                )}

                {/* Completion message */}
                {acceleratorsData?.participants.edges.length > 0 &&
                  !acceleratorsData?.participants.pageInfo.hasNextPage && (
                    <div className='text-muted-foreground py-2 text-center text-[10px] opacity-50 sm:py-3 sm:text-xs'>
                      All accelerators loaded (
                      {acceleratorsData.participants.edges.length} total)
                    </div>
                  )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* ВК & Инвесторы Tab */}
        <TabsContent
          key='vcs_investors'
          value='vcs_investors'
          className='mt-2 sm:mt-3'
        >
          <ScrollArea className='min-h-[200px] max-h-[calc(100vh-300px)] pr-3 overflow-y-auto flex-1'>
            {isInitialLoadingVCs ? (
              <div className='flex items-center justify-center py-6 sm:py-8'>
                <Loader2 className='h-5 w-5 animate-spin sm:h-6 sm:w-6' />
                <span className='text-muted-foreground ml-2 text-xs sm:text-sm'>
                  Загрузка ВК и инвесторов...
                </span>
              </div>
            ) : !vcsData?.participants.edges.length ? (
              <div className='py-6 text-center sm:py-8'>
                <p className='text-muted-foreground text-xs sm:text-sm'>
                  {searchTerm
                    ? 'ВК/Инвесторы не найдены по вашему запросу.'
                    : 'ВК/Инвесторы недоступны.'}
                </p>
              </div>
            ) : (
              <div className='space-y-1 sm:space-y-2'>
                {vcsData.participants.edges.map((edge) => {
                  const participant = edge.node;
                  
                  // Debug logging for isSaved status
                  if (participant.isSaved) {
                    console.log('🔍 Found saved VC:', {
                      id: participant.id,
                      name: participant.name,
                      isSaved: participant.isSaved,
                      isPrivate: participant.isPrivate
                    });
                  }
                  const isSelected = isParticipantSelected(
                    participant.id,
                    'vcs_investors'
                  );
                  return (
                    <div
                      key={participant.id}
                      className={`flex cursor-pointer items-center space-x-2 rounded-lg p-2 sm:space-x-3 sm:p-3 ${
                        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleParticipantToggle(participant.id)}
                    >
                      <Avatar
                        className='h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8'
                        variant={
                          participant.isPrivate
                            ? 'favorites'
                            : participant.isSaved
                              ? 'followed'
                              : 'default'
                        }
                      >
                        <AvatarImage
                          src={participant.imageUrl}
                          alt={participant.name}
                        />
                        <AvatarFallback className='text-[10px] sm:text-xs'>
                          {participant.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1 overflow-hidden'>
                        <p className='text-foreground truncate text-xs font-medium sm:text-sm flex items-center gap-1'>
                          {participant.name}
                          {participant.isSaved && !participant.isPrivate && (
                            <IconHeartFilled className='h-3 w-3 text-red-500' />
                          )}
                        </p>
                        {participant.about && (
                          <p className='text-muted-foreground truncate text-[10px] sm:text-xs'>
                            {participant.about.length > 40
                              ? `${participant.about.substring(0, 40)}...`
                              : participant.about}
                          </p>
                        )}
                      </div>
                      <div className='flex-shrink-0 flex items-center gap-1'>
                        <Badge
                          variant='outline'
                          className={`${
                            participant.isPrivate
                              ? 'border-lime-500 text-lime-600'
                              : 'border-primary text-primary'
                          } bg-transparent text-[9px] sm:text-[10px]`}
                        >
                          <span className='hidden sm:inline'>
                            {participant.type.charAt(0).toUpperCase() +
                              participant.type.slice(1).toLowerCase()}
                          </span>
                          <span className='sm:hidden'>
                            {participant.type.substring(0, 3).toUpperCase()}
                          </span>
                        </Badge>
                        {participant.isPrivate && (
                          <Badge
                            variant='default'
                            className='bg-lime-500 text-[9px] text-lime-50 sm:text-[10px]'
                          >
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Infinite scroll trigger */}
                {vcsData?.participants.pageInfo.hasNextPage && (
                  <div
                    ref={vcsScrollRef}
                    className='flex min-h-[35px] items-center justify-center py-2 sm:min-h-[40px] sm:py-3'
                  >
                    {isLoadingMoreVCs && (
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm'>
                        <Loader2 className='h-3 w-3 animate-spin sm:h-4 sm:w-4' />
                        Загрузка ВК...
                      </div>
                    )}
                  </div>
                )}

                {/* Completion message */}
                {vcsData?.participants.edges.length > 0 &&
                  !vcsData?.participants.pageInfo.hasNextPage && (
                    <div className='text-muted-foreground py-2 text-center text-[10px] opacity-50 sm:py-3 sm:text-xs'>
                      Все ВК загружены ({vcsData.participants.edges.length} всего)
                    </div>
                  )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Angels Tab */}
        <TabsContent key='angels' value='angels' className='mt-2 sm:mt-3'>
          <ScrollArea className='min-h-[200px] max-h-[calc(100vh-300px)] pr-3 overflow-y-auto flex-1'>
            {isInitialLoadingAngels ? (
              <div className='flex items-center justify-center py-6 sm:py-8'>
                <Loader2 className='h-5 w-5 animate-spin sm:h-6 sm:w-6' />
                <span className='text-muted-foreground ml-2 text-xs sm:text-sm'>
                  Загрузка ангелов...
                </span>
              </div>
            ) : !angelsData?.participants.edges.length ? (
              <div className='py-6 text-center sm:py-8'>
                <p className='text-muted-foreground text-xs sm:text-sm'>
                  {searchTerm
                    ? 'Ангелы не найдены по вашему запросу.'
                    : 'Ангелы недоступны.'}
                </p>
              </div>
            ) : (
              <div className='space-y-1 sm:space-y-2'>
                {angelsData.participants.edges.map((edge) => {
                  const participant = edge.node;
                  
                  // Debug logging for isSaved status
                  if (participant.isSaved) {
                    console.log('🔍 Found saved angel:', {
                      id: participant.id,
                      name: participant.name,
                      isSaved: participant.isSaved,
                      isPrivate: participant.isPrivate
                    });
                  }
                  const isSelected = isParticipantSelected(
                    participant.id,
                    'angels'
                  );
                  return (
                    <div
                      key={participant.id}
                      className={`flex cursor-pointer items-center space-x-2 rounded-lg p-2 sm:space-x-3 sm:p-3 ${
                        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleParticipantToggle(participant.id)}
                    >
                      <Avatar
                        className='h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8'
                        variant={
                          participant.isPrivate
                            ? 'favorites'
                            : participant.isSaved
                              ? 'followed'
                              : 'default'
                        }
                      >
                        <AvatarImage
                          src={participant.imageUrl}
                          alt={participant.name}
                        />
                        <AvatarFallback className='text-[10px] sm:text-xs'>
                          {participant.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1 overflow-hidden'>
                        <p className='text-foreground truncate text-xs font-medium sm:text-sm flex items-center gap-1'>
                          {participant.name}
                          {participant.isSaved && !participant.isPrivate && (
                            <IconHeartFilled className='h-3 w-3 text-red-500' />
                          )}
                        </p>
                        {participant.about && (
                          <p className='text-muted-foreground truncate text-[10px] sm:text-xs'>
                            {participant.about.length > 40
                              ? `${participant.about.substring(0, 40)}...`
                              : participant.about}
                          </p>
                        )}
                      </div>
                      <div className='flex-shrink-0 flex items-center gap-1'>
                        <Badge
                          variant='outline'
                          className={`${
                            participant.isPrivate
                              ? 'border-lime-500 text-lime-600'
                              : 'border-primary text-primary'
                          } bg-transparent text-[9px] sm:text-[10px]`}
                        >
                          <span className='hidden sm:inline'>
                            {participant.type.charAt(0).toUpperCase() +
                              participant.type.slice(1).toLowerCase()}
                          </span>
                          <span className='sm:hidden'>
                            {participant.type.substring(0, 3).toUpperCase()}
                          </span>
                        </Badge>
                        {participant.isPrivate && (
                          <Badge
                            variant='default'
                            className='bg-lime-500 text-[9px] text-lime-50 sm:text-[10px]'
                          >
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Infinite scroll trigger */}
                {angelsData?.participants.pageInfo.hasNextPage && (
                  <div
                    ref={angelsScrollRef}
                    className='flex min-h-[35px] items-center justify-center py-2 sm:min-h-[40px] sm:py-3'
                  >
                    {isLoadingMoreAngels && (
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm'>
                        <Loader2 className='h-3 w-3 animate-spin sm:h-4 sm:w-4' />
                        Загрузка ангелов...
                      </div>
                    )}
                  </div>
                )}

                {/* Completion message */}
                {angelsData?.participants.edges.length > 0 &&
                  !angelsData?.participants.pageInfo.hasNextPage && (
                    <div className='text-muted-foreground py-2 text-center text-[10px] opacity-50 sm:py-3 sm:text-xs'>
                      Все ангелы загружены ({angelsData.participants.edges.length}{' '}
                      всего)
                    </div>
                  )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Founders Tab */}
        <TabsContent key='founders' value='founders' className='mt-2 sm:mt-3'>
          <ScrollArea className='min-h-[200px] max-h-[calc(100vh-300px)] pr-3 overflow-y-auto flex-1'>
            {isInitialLoadingFounders ? (
              <div className='flex items-center justify-center py-6 sm:py-8'>
                <Loader2 className='h-5 w-5 animate-spin sm:h-6 sm:w-6' />
                <span className='text-muted-foreground ml-2 text-xs sm:text-sm'>
                  Загрузка основателей...
                </span>
              </div>
            ) : !foundersData?.participants.edges.length ? (
              <div className='py-6 text-center sm:py-8'>
                <p className='text-muted-foreground text-xs sm:text-sm'>
                  {searchTerm
                    ? 'Основатели не найдены по вашему запросу.'
                    : 'Основатели недоступны.'}
                </p>
              </div>
            ) : (
              <div className='space-y-1 sm:space-y-2'>
                {foundersData.participants.edges.map((edge) => {
                  const participant = edge.node;
                  const isSelected = isParticipantSelected(
                    participant.id,
                    'founders'
                  );
                  return (
                    <div
                      key={participant.id}
                      className={`flex cursor-pointer items-center space-x-2 rounded-lg p-2 sm:space-x-3 sm:p-3 ${
                        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleParticipantToggle(participant.id)}
                    >
                      <Avatar
                        className='h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8'
                        variant={
                          participant.isPrivate
                            ? 'favorites'
                            : participant.isSaved
                              ? 'followed'
                              : 'default'
                        }
                      >
                        <AvatarImage
                          src={participant.imageUrl}
                          alt={participant.name}
                        />
                        <AvatarFallback className='text-[10px] sm:text-xs'>
                          {participant.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1 overflow-hidden'>
                        <p className='text-foreground truncate text-xs font-medium sm:text-sm flex items-center gap-1'>
                          {participant.name}
                          {participant.isSaved && !participant.isPrivate && (
                            <IconHeartFilled className='h-3 w-3 text-red-500' />
                          )}
                        </p>
                        {participant.about && (
                          <p className='text-muted-foreground truncate text-[10px] sm:text-xs'>
                            {participant.about.length > 40
                              ? `${participant.about.substring(0, 40)}...`
                              : participant.about}
                          </p>
                        )}
                      </div>
                      <div className='flex-shrink-0 flex items-center gap-1'>
                        <Badge
                          variant='outline'
                          className={`${
                            participant.isPrivate
                              ? 'border-lime-500 text-lime-600'
                              : 'border-primary text-primary'
                          } bg-transparent text-[9px] sm:text-[10px]`}
                        >
                          <span className='hidden sm:inline'>
                            {participant.type.charAt(0).toUpperCase() +
                              participant.type.slice(1).toLowerCase()}
                          </span>
                          <span className='sm:hidden'>
                            {participant.type.substring(0, 3).toUpperCase()}
                          </span>
                        </Badge>
                        {participant.isPrivate && (
                          <Badge
                            variant='default'
                            className='bg-lime-500 text-[9px] text-lime-50 sm:text-[10px]'
                          >
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Infinite scroll trigger */}
                {foundersData?.participants.pageInfo.hasNextPage && (
                  <div
                    ref={foundersScrollRef}
                    className='flex min-h-[35px] items-center justify-center py-2 sm:min-h-[40px] sm:py-3'
                  >
                    {isLoadingMoreFounders && (
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm'>
                        <Loader2 className='h-3 w-3 animate-spin sm:h-4 sm:w-4' />
                        Загрузка основателей...
                      </div>
                    )}
                  </div>
                )}

                {/* Completion message */}
                {foundersData?.participants.edges.length > 0 &&
                  !foundersData?.participants.pageInfo.hasNextPage && (
                    <div className='text-muted-foreground py-2 text-center text-[10px] opacity-50 sm:py-3 sm:text-xs'>
                      Все основатели загружены (
                      {foundersData.participants.edges.length} всего)
                    </div>
                  )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Favorites Participants Tab */}
        <TabsContent key='favorites' value='favorites' className='mt-2 sm:mt-3'>
          <ScrollArea className='min-h-[200px] max-h-[calc(100vh-300px)] pr-3 overflow-y-auto flex-1'>
            {isInitialLoadingPrivate ? (
              <div className='flex items-center justify-center py-6 sm:py-8'>
                <Loader2 className='h-5 w-5 animate-spin sm:h-6 sm:w-6' />
                <span className='text-muted-foreground ml-2 text-xs sm:text-sm'>
                  Загрузка избранных участников...
                </span>
              </div>
            ) : privateData &&
              (!privateData.participants?.edges ||
                privateData.participants.edges.length === 0) ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <IconHeart className='h-8 w-8 text-muted-foreground' />
                  </EmptyMedia>
                  <EmptyTitle>
                  {searchTerm
                    ? 'Любимые участники не найдены'
                    : 'Вы еще не добавили любимых инвесторов.'}
                  </EmptyTitle>
                  <EmptyDescription>
                  {searchTerm ? (
                    'Try adjusting your search terms or check other tabs.'
                  ) : (
                      <>
                      Добавьте своих любимых инвесторов на{' '}
                      <a
                        href='/app/investors'
                        className='text-primary hover:text-primary/80 underline'
                      >
                        вкладке Инвесторы
                      </a>
                      </>
                  )}
                  </EmptyDescription>
                </EmptyHeader>
                {!searchTerm && (
                  <EmptyContent>
                    <Button size='sm' asChild>
                      <a href='/app/investors'>Перейти к инвесторам</a>
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : !privateData ? (
              <div className='py-6 text-center sm:py-8'>
                <p className='text-muted-foreground mb-1 text-xs font-medium sm:text-sm'>
                  Failed to load favorites participants
                </p>
                <p className='text-muted-foreground text-[10px] opacity-70 sm:text-xs'>
                  Please try refreshing the page or contact support.
                </p>
              </div>
            ) : (
              <div className='space-y-1 sm:space-y-2'>
                {privateData.participants.edges.map((edge) => {
                  const participant = edge.node;
                  
                  // Debug logging for isSaved status
                  if (participant.isSaved) {
                    console.log('🔍 Found saved participant:', {
                      id: participant.id,
                      name: participant.name,
                      isSaved: participant.isSaved,
                      isPrivate: participant.isPrivate
                    });
                  }
                  const isSelected = isParticipantSelected(
                    participant.id,
                    'favorites'
                  );
                  return (
                    <div
                      key={participant.id}
                      className={`flex cursor-pointer items-center space-x-2 rounded-lg p-2 sm:space-x-3 sm:p-3 ${
                        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleParticipantToggle(participant.id)}
                    >
                      <Avatar
                        className='h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8'
                        variant={
                          participant.isPrivate
                            ? 'favorites'
                            : participant.isSaved
                              ? 'followed'
                              : 'default'
                        }
                      >
                        <AvatarImage
                          src={participant.imageUrl}
                          alt={participant.name}
                        />
                        <AvatarFallback className='text-[10px] sm:text-xs'>
                          {participant.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1 overflow-hidden'>
                        <p className='text-foreground truncate text-xs font-medium sm:text-sm flex items-center gap-1'>
                          {participant.name}
                          {participant.isSaved && !participant.isPrivate && (
                            <IconHeartFilled className='h-3 w-3 text-red-500' />
                          )}
                        </p>
                        {participant.about && (
                          <p className='text-muted-foreground truncate text-[10px] sm:text-xs'>
                            {participant.about.length > 40
                              ? `${participant.about.substring(0, 40)}...`
                              : participant.about}
                          </p>
                        )}
                      </div>
                      <div className='flex-shrink-0 flex items-center gap-1'>
                        <Badge
                          variant='outline'
                          className={`${
                            participant.isPrivate
                              ? 'border-lime-500 text-lime-600'
                              : 'border-primary text-primary'
                          } bg-transparent text-[9px] sm:text-[10px]`}
                        >
                          <span className='hidden sm:inline'>
                            {participant.type.charAt(0).toUpperCase() +
                              participant.type.slice(1).toLowerCase()}
                          </span>
                          <span className='sm:hidden'>
                            {participant.type.substring(0, 3).toUpperCase()}
                          </span>
                        </Badge>
                        {participant.isPrivate && (
                          <Badge
                            variant='default'
                            className='bg-lime-500 text-[9px] text-lime-50 sm:text-[10px]'
                          >
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Infinite scroll trigger */}
                {privateData?.participants.pageInfo.hasNextPage && (
                  <div
                    ref={privateScrollRef}
                    className='flex min-h-[35px] items-center justify-center py-2 sm:min-h-[40px] sm:py-3'
                  >
                    {isLoadingMorePrivate && (
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm'>
                        <Loader2 className='h-3 w-3 animate-spin sm:h-4 sm:w-4' />
                        Loading more private participants...
                      </div>
                    )}
                  </div>
                )}

                {/* Completion message */}
                {privateData?.participants.edges.length > 0 &&
                  !privateData?.participants.pageInfo.hasNextPage && (
                    <div className='text-muted-foreground py-2 text-center text-[10px] opacity-50 sm:py-3 sm:text-xs'>
                      All private participants loaded (
                      {privateData.participants.edges.length} total)
                    </div>
                  )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
