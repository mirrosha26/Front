'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useRef
} from 'react';
import { useLazyQuery } from '@apollo/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCardOperations } from '@/features/shared/contexts/card-operations-context';
import { GET_GROUP_ASSIGNMENTS_QUERY } from '@/lib/graphql/queries';
import {
  GroupAssignmentsVariables,
  GroupAssignmentsResponse,
  GroupAssignedCardGraphQL,
  AssignmentStatus,
  AssignmentFilterType,
  SignalCard
} from '@/lib/graphql/types';

// Types for context state
interface GroupAssignmentsState {
  assignments: GroupAssignedCardGraphQL[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  currentFilters: any;
}

// Types for context actions
interface GroupAssignmentsActions {
  fetchAssignments: (
    params?: Record<string, any>,
    appendMode?: boolean
  ) => Promise<void>;
  applyFilters: (filters: Record<string, any>) => Promise<void>;
  loadMore: () => Promise<void>;
  resetFilters: () => Promise<void>;
  setCurrentFilters: (filters: any) => void;
  handleToggleFavorite: (cardId: number) => Promise<void>;
  refetchAssignments: () => Promise<void>;
}

type GroupAssignmentsContextType = GroupAssignmentsState & GroupAssignmentsActions;

const GroupAssignmentsContext = createContext<GroupAssignmentsContextType | undefined>(
  undefined
);

export function useGroupAssignments() {
  const context = useContext(GroupAssignmentsContext);
  if (!context) {
    throw new Error(
      'useGroupAssignments must be used within GroupAssignmentsProvider'
    );
  }
  return context;
}

// Provider component
export function GroupAssignmentsProvider({
  children
}: {
  children: ReactNode;
}) {
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({
    page: 1,
    page_size: 20
  });
  // Use ref to store current filters to avoid dependency issues
  const currentFiltersRef = useRef(currentFilters);
  useEffect(() => {
    currentFiltersRef.current = currentFilters;
  }, [currentFilters]);

  const [assignments, setAssignments] = useState<GroupAssignedCardGraphQL[]>([]);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isProcessingData, setIsProcessingData] = useState(false);

  const router = useRouter();

  // Use lazy query for group assignments
  const [getGroupAssignments, { loading: isLoading, error: gqlError }] = useLazyQuery<
    GroupAssignmentsResponse,
    GroupAssignmentsVariables
  >(GET_GROUP_ASSIGNMENTS_QUERY, {
    fetchPolicy: 'cache-and-network', // Use cache for performance, but also fetch fresh data
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      const nodes = data?.groupAssignments?.nodes || [];
      console.log('[Assignments] GraphQL response received:', {
        hasData: !!data,
        hasGroupAssignments: !!data?.groupAssignments,
        nodesCount: nodes.length,
        totalCount: data?.groupAssignments?.totalCount,
        hasNextPage: data?.groupAssignments?.hasNextPage,
        currentPage: data?.groupAssignments?.currentPage,
        totalPages: data?.groupAssignments?.totalPages,
        currentFilters: currentFiltersRef.current,
        filterType: currentFiltersRef.current?.filterType,
        expectedFilterType: currentFiltersRef.current?.filterType || AssignmentFilterType.MY_ASSIGNMENTS,
        'should be MY_ASSIGNMENTS': (currentFiltersRef.current?.filterType || AssignmentFilterType.MY_ASSIGNMENTS) === AssignmentFilterType.MY_ASSIGNMENTS,
        sampleNodes: nodes.slice(0, 3).map(n => ({
          id: n.id,
          status: n.status,
          assignedUsersCount: n.assignedUsersCount,
          totalGroupMembersCount: n.totalGroupMembersCount,
          signalCardId: n.signalCard?.id
        })),
        fullResponse: data?.groupAssignments
      });

      if (data?.groupAssignments?.nodes) {
        setResponseData(data.groupAssignments);

        const newAssignments = data.groupAssignments.nodes;

        if (isPaginating) {
          // Append to existing assignments
          setAssignments((prev) => [...prev, ...newAssignments]);
        } else {
          // Replace all assignments
          setAssignments(newAssignments);
        }

        setIsPaginating(false);
        setIsProcessingData(false);
      } else {
        console.warn('[Assignments] No nodes in response:', data);
        setIsPaginating(false);
        setIsProcessingData(false);
      }
    },
    onError: (error) => {
      // Safely extract error information
      const errorMessage = error?.message || 'Unknown error';
      const graphQLErrors = error?.graphQLErrors || [];
      const networkError = error?.networkError;
      
      // Build detailed error info
      const errorInfo: Record<string, any> = {
        message: errorMessage,
        hasGraphQLErrors: graphQLErrors.length > 0,
        hasNetworkError: !!networkError
      };

      // Add GraphQL errors if present
      if (graphQLErrors.length > 0) {
        errorInfo.graphQLErrors = graphQLErrors.map((err: any) => ({
          message: err?.message,
          extensions: err?.extensions,
          path: err?.path
        }));
      }

      // Add network error if present
      if (networkError) {
        errorInfo.networkError = {
          message: networkError?.message,
          statusCode: (networkError as any)?.statusCode,
          result: (networkError as any)?.result
        };
      }

      // Add full error for debugging (but stringify to avoid empty object issues)
      try {
        errorInfo.fullError = JSON.stringify(error, Object.getOwnPropertyNames(error));
      } catch (e) {
        errorInfo.fullError = String(error);
      }

      console.error('[Assignments] GraphQL error:', errorInfo);
      
      setIsPaginating(false);
      setIsProcessingData(false);

      // Check if it's an authentication error
      const isAuthError = 
        errorMessage?.includes('401') ||
        errorMessage?.includes('Unauthorized') ||
        (networkError as any)?.statusCode === 401 ||
        graphQLErrors.some((err: any) => 
          err?.extensions?.code === 'UNAUTHENTICATED' ||
          err?.message?.includes('401') ||
          err?.message?.includes('Unauthorized')
        );

      if (isAuthError) {
        toast.error('Ваша сессия истекла. Пожалуйста, войдите снова.');
        router.push('/auth/sign-in');
      } else {
        // Show more specific error message if available
        const userMessage = 
          graphQLErrors[0]?.message || 
          networkError?.message || 
          errorMessage ||
          'Не удалось загрузить назначения группы. Попробуйте еще раз.';
        toast.error(userMessage);
      }
    }
  });

  // Use REST API for operations
  const { toggleFavorite } = useCardOperations();

  // Derived state from GraphQL response
  const error = gqlError?.message || null;
  const [responseData, setResponseData] = useState<any>(null);
  const totalCount = responseData?.totalCount || 0;
  const currentPage = responseData?.currentPage || 1;
  const totalPages = responseData?.totalPages || 1;
  const hasNextPage = responseData?.hasNextPage || false;

  // Computed loading state
  const computedIsLoading = isLoading || isProcessingData;

  // Fetch group assignments function
  const fetchAssignments = useCallback(
    async (params: Record<string, any> = {}, appendMode = false) => {
      try {
        // Use ref to get current filters without dependency
        // If params has status: undefined, explicitly remove it from filters
        const finalParams = { ...currentFiltersRef.current, ...params };
        
        // If status is explicitly undefined, remove it from finalParams
        if ('status' in params && params.status === undefined) {
          delete finalParams.status;
        }

        // Update current filters
        setCurrentFilters(finalParams);

        // Set pagination mode
        setIsPaginating(appendMode);

        // Mark that we're processing data
        if (!appendMode) {
          setIsProcessingData(true);
          // Clear existing assignments when starting a new fetch (not append mode)
          setAssignments([]);
        }

        // Map status filter from UI to GraphQL enum
        // Note: Can pass multiple statuses in array (e.g., [REVIEW, REACHING_OUT])
        // Currently UI passes single status, but structure supports multiple
        let statuses: AssignmentStatus[] | undefined;
        if (finalParams.status && finalParams.status !== 'all') {
          const statusMap: Record<string, AssignmentStatus> = {
            review: AssignmentStatus.REVIEW,
            reaching_out: AssignmentStatus.REACHING_OUT,
            connected: AssignmentStatus.CONNECTED,
            not_a_fit: AssignmentStatus.NOT_A_FIT
          };
          const mappedStatus = statusMap[finalParams.status];
          if (mappedStatus) {
            statuses = [mappedStatus];
          }
        }
        // If status is 'all' or undefined, don't pass statuses (get all statuses)

        // Map filterType from params
        // Default: MY_ASSIGNMENTS (only cards where current user is assigned)
        // ALL: all group cards regardless of user assignments
        let filterType = finalParams.filterType || AssignmentFilterType.MY_ASSIGNMENTS;
        
        // Ensure filterType is a valid enum value (string)
        if (typeof filterType !== 'string') {
          console.warn('[Assignments] filterType is not a string, converting:', filterType);
          filterType = String(filterType);
        }
        
        // Validate filterType value
        if (filterType !== AssignmentFilterType.MY_ASSIGNMENTS && filterType !== AssignmentFilterType.ALL) {
          console.warn('[Assignments] Invalid filterType, defaulting to MY_ASSIGNMENTS:', filterType);
          filterType = AssignmentFilterType.MY_ASSIGNMENTS;
        }

        // Execute GraphQL query
        // Cap pageSize at 100 for performance (as per backend documentation)
        const pageSize = Math.min(finalParams.page_size || 20, 100);
        
        console.log('[Assignments] Sending GraphQL query with:', {
          statuses,
          page: finalParams.page || 1,
          pageSize,
          filterType,
          filterTypeType: typeof filterType,
          filterTypeValue: filterType,
          'is MY_ASSIGNMENTS': filterType === AssignmentFilterType.MY_ASSIGNMENTS,
          'is ALL': filterType === AssignmentFilterType.ALL,
          finalParams: finalParams
        });
        
        // Execute GraphQL query with combined filters
        // filterType and statuses work together:
        // - MY_ASSIGNMENTS + [CONNECTED] = my completed cards
        // - ALL + [REACHING_OUT] = all in-progress cards in group
        // - MY_ASSIGNMENTS + undefined = all my assigned cards (any status)
        await getGroupAssignments({
          variables: {
            pagination: {
              page: finalParams.page || 1,
              pageSize: pageSize
            },
            statuses: statuses,
            filterType: filterType as AssignmentFilterType,
            includeSignals: true,
            includeAssignedMembers: true // Include assigned members for preview display
          }
        });
      } catch (error) {
        console.error('Error fetching group assignments:', error);
        toast.error('Не удалось загрузить назначения группы. Попробуйте еще раз.');
        setIsPaginating(false);
        setIsProcessingData(false);
      }
    },
    [getGroupAssignments]
  );

  // Apply filters
  const applyFilters = useCallback(
    async (filters: Record<string, any>) => {
      await fetchAssignments({ ...filters, page: 1 }, false);
    },
    [fetchAssignments]
  );

  // Reset filters
  const resetFilters = useCallback(async () => {
    const resetParams = { page: 1, page_size: 20 };
    await fetchAssignments(resetParams, false);
  }, [fetchAssignments]);

  // Load more
  const loadMore = useCallback(async () => {
    if (hasNextPage && !computedIsLoading) {
      await fetchAssignments({ page: currentPage + 1 }, true);
    }
  }, [hasNextPage, computedIsLoading, currentPage, fetchAssignments]);

  // Handle toggle favorite
  const handleToggleFavorite = useCallback(
    async (cardId: number) => {
      const assignment = assignments.find(
        (a) => a.signalCard.id === cardId.toString()
      );
      if (!assignment) return;

      try {
        await toggleFavorite(cardId, !assignment.signalCard.userData?.isFavorited);
        // Optimistically update
        setAssignments((prev) =>
          prev.map((a) =>
            a.id === assignment.id
              ? {
                  ...a,
                  signalCard: {
                    ...a.signalCard,
                    userData: {
                      ...a.signalCard.userData,
                      isFavorited: !a.signalCard.userData?.isFavorited
                    }
                  }
                }
              : a
          )
        );
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Не удалось обновить статус избранного');
      }
    },
    [assignments, toggleFavorite]
  );

  // Refetch assignments with current filters (for manual refresh after changes)
  const refetchAssignments = useCallback(async () => {
    await fetchAssignments(currentFiltersRef.current, false);
  }, [fetchAssignments]);

  // Note: Initial fetch should be handled by the component that uses this context
  // to ensure it respects the initial selected status/tab

  const contextValue: GroupAssignmentsContextType = {
    assignments,
    isLoading: computedIsLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    fetchAssignments,
    applyFilters,
    loadMore,
    resetFilters,
    setCurrentFilters,
    handleToggleFavorite,
    refetchAssignments
  };

  return (
    <GroupAssignmentsContext.Provider value={contextValue}>
      {children}
    </GroupAssignmentsContext.Provider>
  );
}

