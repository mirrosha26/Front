'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useMemo
} from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { toast } from 'sonner';
import { Participant } from '@/lib/graphql/types';
import { 
  TOGGLE_PARTICIPANT_FOLLOW_MUTATION,
  FILTERED_PARTICIPANTS_QUERY
} from '@/lib/graphql/queries';
import { useInvestorsState } from '../hooks/use-investors-state';

// Simplified types - only investor types and save status
export type InvestorTab =
  | 'all'
  | 'funds'
  | 'fund_team_members'
  | 'company'
  | 'community'
  | 'angels'
  | 'founders'
  | 'private';

// Simplified state interface
interface InvestorsGraphQLState {
  // New simplified structure
  participants: Participant[];
  selectedFilters: InvestorTab[];
  searchTerm: string;
  savedFilter: 'all' | 'saved' | 'not_saved';
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pagination: {
    hasNextPage: boolean;
    totalCount: number;
  };

  // Backward compatibility - all arrays point to the same participants
  allInvestors: Participant[];
  funds: Participant[];
  fundTeamMembers: Participant[];
  company: Participant[];
  community: Participant[];
  angels: Participant[];
  founders: Participant[];
  privateParticipants: Participant[];

  // Backward compatibility - all pagination objects are the same
  allPagination: { hasNextPage: boolean; totalCount: number };
  fundsPagination: { hasNextPage: boolean; totalCount: number };
  companyPagination: { hasNextPage: boolean; totalCount: number };
  communityPagination: { hasNextPage: boolean; totalCount: number };
  angelsPagination: { hasNextPage: boolean; totalCount: number };
  foundersPagination: { hasNextPage: boolean; totalCount: number };
  privatePagination: { hasNextPage: boolean; totalCount: number };
}

// Simplified actions interface  
interface InvestorsGraphQLActions {
  toggleFilter: (filter: InvestorTab) => void;
  setSearchTerm: (term: string) => void;
  setSavedFilter: (filter: 'all' | 'saved' | 'not_saved') => void;
  loadMoreData: () => Promise<void>;
  refreshInvestors: () => Promise<void>;
  toggleFollow: (participantId: string, currentIsSaved?: boolean) => Promise<void>;

  // Backward compatibility
  loadMoreInvestors: () => Promise<void>;
}

// Context type
type InvestorsGraphQLContextType = InvestorsGraphQLState & InvestorsGraphQLActions;

const InvestorsGraphQLContext = createContext<InvestorsGraphQLContextType | undefined>(undefined);

export function useInvestorsGraphQL() {
  const context = useContext(InvestorsGraphQLContext);
  if (!context) {
    throw new Error('useInvestorsGraphQL must be used within InvestorsGraphQLProvider');
  }
  return context;
}

export function InvestorsGraphQLProvider({ children }: { children: ReactNode }) {
  // Используем хук для работы с URL параметрами
  const {
    selectedFilters,
    searchTerm,
    savedFilter,
    setSelectedFilters,
    setSearchTerm,
    setSavedFilter
  } = useInvestorsState();

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, boolean>>({});

  // Логирование изменений savedFilter
  useEffect(() => {
    console.log('🔍 savedFilter changed to:', savedFilter);
  }, [savedFilter]);

  // Apollo Client
  const client = useApolloClient();
  const [toggleFollowMutation] = useMutation(TOGGLE_PARTICIPANT_FOLLOW_MUTATION);

  // Simple type mapping for GraphQL query
  const getTypesForFilters = (filters: InvestorTab[]): string[] | undefined => {
    // Если выбран private, НЕ передаем никаких типов - только isPrivate: true
    if (filters.includes('private')) {
      console.log('🔍 Private selected, returning undefined for types (will use isPrivate: true)');
      return undefined;
    }
    
    if (filters.length === 0 || filters.includes('all')) return undefined;

    const typeMapping: Record<InvestorTab, string[]> = {
      all: [],
      angels: ['angel'],
      funds: ['accelerator', 'fund', 'platform', 'syndicate'],
      fund_team_members: [],
      company: ['company'],
      community: ['community'],
      founders: ['founder', 'person', 'entrepreneur'],
      private: [] // Этот случай обрабатывается выше
    };

    const allTypes: string[] = [];
    filters.forEach(filter => {
      if (filter !== 'fund_team_members' && typeMapping[filter]) {
        allTypes.push(...typeMapping[filter]);
      }
    });

    return allTypes.length > 0 ? allTypes : undefined;
  };

  // Determine fundsOnly parameter
  const getFundsOnly = (filters: InvestorTab[]): boolean | undefined => {
    // Если выбран private, НЕ передаем fundsOnly
    if (filters.includes('private')) {
      console.log('🔍 Private selected, returning undefined for fundsOnly');
      return undefined;
    }
    
    if (filters.includes('funds')) {
      console.log('🔍 Returning true (funds selected)');
      return true;
    }
    if (filters.includes('fund_team_members')) {
      console.log('🔍 Returning false (fund_team_members selected)');
      return false;
    }
    console.log('🔍 Returning undefined (no funds-related filters)');
    return undefined;
  };

  // GraphQL query variables - simplified
  const queryVariables = useMemo(() => {
    const variables = {
      first: 50,
      after: undefined,
      search: searchTerm || undefined,
      types: getTypesForFilters(selectedFilters),
      isPrivate: selectedFilters.includes('private'),
      isSaved: savedFilter === 'all' ? undefined : savedFilter === 'saved' ? true : false,
      fundsOnly: getFundsOnly(selectedFilters),
      sortByActivity: false
    };

    // Детальное логирование
    console.log('🔍 GraphQL Query Variables:', {
      savedFilter,
      selectedFilters,
      isPrivate: variables.isPrivate,
      types: variables.types,
      fundsOnly: variables.fundsOnly,
      isSaved: variables.isSaved,
      fullVariables: variables
    });

    return variables;
  }, [selectedFilters, searchTerm, savedFilter]);

  // Main GraphQL query
  const { data, loading, error, fetchMore, refetch } = useQuery(FILTERED_PARTICIPANTS_QUERY, {
    variables: queryVariables,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network', // Изменено для обновления при изменении savedFilter
    onCompleted: (data) => {
      console.log('🔍 GraphQL Query Completed:', {
        savedFilter,
        queryVariables,
        participantsCount: data?.participants?.edges?.length || 0,
        totalCount: data?.participants?.totalCount || 0
      });
    }
  });

  // Создаем стабильную ссылку на refetch
  const stableRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  // Принудительно обновляем данные при изменении savedFilter
  useEffect(() => {
    console.log('🔍 savedFilter changed to:', savedFilter);
    stableRefetch();
  }, [savedFilter, stableRefetch]);

  // Extract participants with optimistic updates
  const participants = useMemo(() => {
    const baseData = data?.participants?.edges?.map((edge: any) => edge.node) || [];
    
    const participantsWithOptimisticUpdates = baseData.map((participant: any) => ({
      ...participant,
      isSaved: optimisticUpdates[participant.id] !== undefined 
        ? optimisticUpdates[participant.id] 
        : participant.isSaved
    }));

    // Debug logging
    console.log('🔍 Participants processing:', {
      savedFilter,
      baseDataCount: baseData.length,
      participantsWithOptimisticUpdatesCount: participantsWithOptimisticUpdates.length,
      sampleParticipants: participantsWithOptimisticUpdates.slice(0, 3).map(p => ({ 
        id: p.id, 
        name: p.name, 
        isSaved: p.isSaved 
      }))
    });

    // Убираем клиентскую фильтрацию - теперь бэкенд должен обрабатывать все случаи
    return participantsWithOptimisticUpdates;
  }, [data, optimisticUpdates, savedFilter]);

  // Pagination info
  const pagination = useMemo(() => ({
    hasNextPage: data?.participants?.pageInfo?.hasNextPage || false,
    totalCount: data?.participants?.totalCount || 0
  }), [data]);

  // Actions - Updated to support multiple filter selection with URL updates
  const toggleFilter = useCallback((filter: InvestorTab) => {
    console.log('🔍 toggleFilter called with:', filter);
    console.log('🔍 Current selectedFilters:', selectedFilters);
    console.log('🔍 selectedFilters type:', typeof selectedFilters, Array.isArray(selectedFilters));
    
    if (filter === 'all') {
      // "All" снимает все фильтры
      console.log('🔍 Setting filters to empty array');
      setSelectedFilters([]);
    } else if (filter === 'private') {
      // "Private" снимает все остальные фильтры и оставляет только private
      console.log('🔍 Setting filters to private only');
      setSelectedFilters(['private']);
    } else {
      console.log('🔍 Toggling filter:', filter);
      setSelectedFilters(prev => {
        console.log('🔍 Previous filters in callback:', prev);
        console.log('🔍 Previous filters type:', typeof prev, Array.isArray(prev));
        
        // Убеждаемся, что prev - это массив
        const currentFilters = Array.isArray(prev) ? prev : [];
        
        // Если уже выбран private, снимаем его при выборе другого фильтра
        if (currentFilters.includes('private')) {
          console.log('🔍 Replacing private with:', filter);
          return [filter];
        }
        
        if (currentFilters.includes(filter)) {
          // Remove filter if already selected
          const newFilters = currentFilters.filter(f => f !== filter);
          console.log('🔍 Removing filter, new filters:', newFilters);
          return newFilters;
        } else {
          // Add filter to the list (multiple selection)
          const newFilters = [...currentFilters, filter];
          console.log('🔍 Adding filter, new filters:', newFilters);
          return newFilters;
        }
      });
    }
  }, [setSelectedFilters, selectedFilters]);

  const loadMoreData = useCallback(async () => {
    if (!pagination.hasNextPage || isLoadingMore) {
      console.log('🔍 loadMoreData skipped:', {
        hasNextPage: pagination.hasNextPage,
        isLoadingMore
      });
      return;
    }

    console.log('🔍 loadMoreData starting:', {
      currentCount: participants.length,
      hasNextPage: pagination.hasNextPage,
      endCursor: data?.participants?.pageInfo?.endCursor
    });

    setIsLoadingMore(true);
    try {
      await fetchMore({
        variables: {
          after: data?.participants?.pageInfo?.endCursor
        }
      });
      console.log('🔍 loadMoreData completed successfully');
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [pagination.hasNextPage, isLoadingMore, fetchMore, data, participants.length]);

  const refreshInvestors = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing investors:', error);
      toast.error('Не удалось обновить список инвесторов');
    }
  }, [refetch]);

  const toggleFollow = useCallback(async (participantId: string, currentIsSaved?: boolean) => {
    try {
      let currentStatus = currentIsSaved;
      
      if (currentStatus === undefined) {
        const participant = participants.find(p => p.id === participantId);
        currentStatus = participant?.isSaved || false;
      }

      const newStatus = !currentStatus;

      // Optimistic update
      setOptimisticUpdates(prev => ({
        ...prev,
        [participantId]: newStatus
      }));

      // API call
      const result = await toggleFollowMutation({
        variables: {
          participantId,
          isSaved: newStatus,
        },
      });

      if (!result.data?.toggleParticipantFollow?.success) {
        throw new Error('GraphQL mutation failed');
      }
    } catch (error) {
      // Revert on error
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[participantId];
        return newUpdates;
      });
      
      console.error('Error toggling follow:', error);
      toast.error('Не удалось обновить статус подписки');
      throw error;
    }
  }, [participants, toggleFollowMutation]);

  const value: InvestorsGraphQLContextType = {
    // New simplified structure
    participants,
    selectedFilters,
    searchTerm,
    savedFilter,
    isLoading: loading,
    isLoadingMore,
    error: error?.message || null,
    pagination,

    // Backward compatibility - all arrays point to the same participants
    allInvestors: participants,
    funds: participants,
    fundTeamMembers: participants,
    company: participants,
    community: participants,
    angels: participants,
    founders: participants,
    privateParticipants: participants,

    // Backward compatibility - all pagination objects are the same
    allPagination: pagination,
    fundsPagination: pagination,
    companyPagination: pagination,
    communityPagination: pagination,
    angelsPagination: pagination,
    foundersPagination: pagination,
    privatePagination: pagination,

    // Actions
    toggleFilter,
    setSearchTerm,
    setSavedFilter,
    loadMoreData,
    refreshInvestors,
    toggleFollow,
    loadMoreInvestors: loadMoreData // Backward compatibility
  };

  return (
    <InvestorsGraphQLContext.Provider value={value}>
      {children}
    </InvestorsGraphQLContext.Provider>
  );
}
