import { useQuery, useMutation } from '@apollo/client';
import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  USER_FEED_QUERY,
  BASIC_FILTERS_QUERY,
  ANGELS_QUERY,
  VCS_INVESTORS_QUERY,
  SYNDICATES_QUERY,
  FOUNDERS_QUERY,
  GET_FAVORITES_QUERY,
  ALL_PARTICIPANTS_QUERY,
} from '@/lib/graphql/queries';
import {
  UserFeedVariables,
  FeedResponse,
  BasicFiltersResponse,
  RelayParticipantsResponse,
  RelayLocationsResponse,
  SortBy,
  SortOrder,
} from '@/lib/graphql/types';

// Hook for using the comprehensive signalCards query
export function useUserFeed(variables: UserFeedVariables = {}) {
  const { data, loading, error, fetchMore, refetch } = useQuery(USER_FEED_QUERY, {
    variables: {
      pagination: { page: 1, pageSize: 30 },
      ...variables,
    },
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });
  const loadMore = useCallback(
    async (currentPage: number) => {
      try {
        await fetchMore({
          variables: {
            ...variables,
            pagination: {
              ...variables.pagination,
              page: currentPage + 1,
            },
          },
        });
      } catch (error) {
        console.error('Error loading more items:', error);
        toast.error('Не удалось загрузить больше элементов');
      }
    },
    [fetchMore, variables]
  );

  const refetchFeed = useCallback(
    async (newVariables?: Partial<UserFeedVariables>) => {
      try {
        await refetch({
          ...variables,
          ...newVariables,
          pagination: {
            page: 1,
            pageSize: variables.pagination?.pageSize || 30,
            ...newVariables?.pagination,
          },
        });
      } catch (error) {
        console.error('Error refetching feed:', error);
        toast.error('Не удалось обновить ленту');
      }
    },
    [refetch, variables]
  );

  return {
    data: data?.userFeed as FeedResponse | undefined,
    loading,
    error,
    loadMore,
    refetch: refetchFeed,
  };
}

// Hook for loading basic filters (lightweight)
export function useBasicFilters() {
  const { data, loading, error, refetch } = useQuery(BASIC_FILTERS_QUERY, {
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  return {
    data: data as BasicFiltersResponse | undefined,
    loading,
    error,
    refetch,
  };
}


// Hook for loading Angels only
export function useAngels(variables: {
  first?: number;
  after?: string;
  search?: string;
} = {}) {
  console.log('🔥 useAngels called with variables:', variables);
  
  const { data, loading, error, fetchMore, refetch } = useQuery(ANGELS_QUERY, {
    variables: {
      first: 50,
      ...variables,
    },
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  console.log('🔥 useAngels query result:', {
    data: data?.participants?.edges?.length || 0,
    loading,
    error: error?.message,
    variables
  });

  const loadMore = useCallback(
    async (cursor?: string) => {
      if (!data?.participants?.pageInfo?.hasNextPage) {
        return;
      }

      try {
        await fetchMore({
          variables: {
            ...variables,
            after: cursor || data.participants.pageInfo.endCursor,
          },
        });
      } catch (error) {
        console.error('Error loading more Angels:', error);
        toast.error('Не удалось загрузить больше ангелов');
      }
    },
    [fetchMore, variables, data]
  );

  const searchAngels = useCallback(
    async (searchTerm: string) => {
      try {
        await refetch({
          ...variables,
          search: searchTerm,
          after: undefined, // Reset pagination when searching
        });
      } catch (error) {
        console.error('Error searching Angels:', error);
        toast.error('Не удалось выполнить поиск ангелов');
      }
    },
    [refetch, variables]
  );

  return {
    data: data as RelayParticipantsResponse | undefined,
    loading,
    error,
    loadMore,
    searchAngels,
    refetch,
  };
}

// Hook for loading ALL participants (all types, non-private)
export function useAllParticipants(variables: {
  first?: number;
  after?: string;
  search?: string;
} = {}) {
  console.log('🔥 useAllParticipants called with variables:', variables);
  
  const { data, loading, error, fetchMore, refetch } = useQuery(ALL_PARTICIPANTS_QUERY, {
    variables: {
      first: 50,
      ...variables,
    },
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  console.log('🔥 useAllParticipants query result:', {
    data: data?.participants?.edges?.length || 0,
    loading,
    error: error?.message,
    variables
  });

  const loadMore = useCallback(
    async (cursor?: string) => {
      if (!data?.participants?.pageInfo?.hasNextPage) {
        return;
      }

      try {
        await fetchMore({
          variables: {
            ...variables,
            after: cursor || data.participants.pageInfo.endCursor,
          },
        });
      } catch (error) {
        console.error('Error loading more participants:', error);
        toast.error('Не удалось загрузить больше участников');
      }
    },
    [fetchMore, variables, data]
  );

  const searchAllParticipants = useCallback(
    async (searchTerm: string) => {
      try {
        await refetch({
          ...variables,
          search: searchTerm,
          after: undefined, // Reset pagination when searching
        });
      } catch (error) {
        console.error('Error searching participants:', error);
        toast.error('Не удалось выполнить поиск участников');
      }
    },
    [refetch, variables]
  );

  return {
    data: data as RelayParticipantsResponse | undefined,
    loading,
    error,
    loadMore,
    searchAllParticipants,
    refetch,
  };
}

// Hook for loading VCs and Investors (excluding Angels)
export function useFundsInvestors(variables: {
  first?: number;
  after?: string;
  search?: string;
} = {}) {
  const { data, loading, error, fetchMore, refetch } = useQuery(VCS_INVESTORS_QUERY, {
    variables: {
      first: 50,
      ...variables,
    },
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  const loadMore = useCallback(
    async (cursor?: string) => {
      if (!data?.participants?.pageInfo?.hasNextPage) {
        return;
      }

      try {
        await fetchMore({
          variables: {
            ...variables,
            after: cursor || data.participants.pageInfo.endCursor,
          },
        });
      } catch (error) {
        console.error('Error loading more VCs/Investors:', error);
        toast.error('Не удалось загрузить больше VC/Инвесторов');
      }
    },
    [fetchMore, variables, data]
  );

  const searchInvestors = useCallback(
    async (searchTerm: string) => {
      try {
        await refetch({
          ...variables,
          search: searchTerm,
          after: undefined, // Reset pagination when searching
        });
      } catch (error) {
        console.error('Error searching VCs/Investors:', error);
        toast.error('Не удалось выполнить поиск VC/Инвесторов');
      }
    },
    [refetch, variables]
  );

  return {
    data: data as RelayParticipantsResponse | undefined,
    loading,
    error,
    loadMore,
    searchInvestors,
    refetch,
  };
}

// Hook for loading Syndicates and Funds
export function useSyndicates(variables: {
  first?: number;
  after?: string;
  search?: string;
} = {}) {
  const { data, loading, error, fetchMore, refetch } = useQuery(SYNDICATES_QUERY, {
    variables: {
      first: 50,
      ...variables,
    },
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  const loadMore = useCallback(
    async (cursor?: string) => {
      if (!data?.participants?.pageInfo?.hasNextPage) {
        return;
      }

      try {
        await fetchMore({
          variables: {
            ...variables,
            after: cursor || data.participants.pageInfo.endCursor,
          },
        });
      } catch (error) {
        console.error('Error loading more Syndicates/Funds:', error);
        toast.error('Не удалось загрузить больше синдикатов/фондов');
      }
    },
    [fetchMore, variables, data]
  );

  const searchSyndicates = useCallback(
    async (searchTerm: string) => {
      try {
        await refetch({
          ...variables,
          search: searchTerm,
          after: undefined, // Reset pagination when searching
        });
      } catch (error) {
        console.error('Error searching Syndicates/Funds:', error);
        toast.error('Не удалось выполнить поиск синдикатов/фондов');
      }
    },
    [refetch, variables]
  );

  return {
    data: data as RelayParticipantsResponse | undefined,
    loading,
    error,
    loadMore,
    searchSyndicates,
    refetch,
  };
}

// Hook for loading Founders
export function useFounders(variables: {
  first?: number;
  after?: string;
  search?: string;
} = {}) {
  const { data, loading, error, fetchMore, refetch } = useQuery(FOUNDERS_QUERY, {
    variables: {
      first: 50,
      ...variables,
    },
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  const loadMore = useCallback(
    async (cursor?: string) => {
      if (!data?.participants?.pageInfo?.hasNextPage) {
        return;
      }

      try {
        await fetchMore({
          variables: {
            ...variables,
            after: cursor || data.participants.pageInfo.endCursor,
          },
        });
      } catch (error) {
        console.error('Error loading more Founders:', error);
        toast.error('Не удалось загрузить больше основателей');
      }
    },
    [fetchMore, variables, data]
  );

  const searchFounders = useCallback(
    async (searchTerm: string) => {
      try {
        await refetch({
          ...variables,
          search: searchTerm,
          after: undefined, // Reset pagination when searching
        });
      } catch (error) {
        console.error('Error searching Founders:', error);
        toast.error('Не удалось выполнить поиск основателей');
      }
    },
    [refetch, variables]
  );

  return {
    data: data as RelayParticipantsResponse | undefined,
    loading,
    error,
    loadMore,
    searchFounders,
    refetch,
  };
}

// Hook for loading Private Participants (all types)
export function usePrivateParticipants(variables: {
  first?: number;
  after?: string;
  search?: string;
} = {}) {
  const { data, loading, error, fetchMore, refetch } = useQuery(GET_FAVORITES_QUERY, {
    variables: {
      first: 50,
      ...variables,
    },
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  const loadMore = useCallback(
    async (cursor?: string) => {
      if (!data?.participants?.pageInfo?.hasNextPage) {
        return;
      }

      try {
        await fetchMore({
          variables: {
            ...variables,
            after: cursor || data.participants.pageInfo.endCursor,
          },
        });
      } catch (error) {
        console.error('Error loading more Private Participants:', error);
        toast.error('Не удалось загрузить больше приватных участников');
      }
    },
    [fetchMore, variables, data]
  );

  const searchPrivateParticipants = useCallback(
    async (searchTerm: string) => {
      try {
        await refetch({
          ...variables,
          search: searchTerm,
          after: undefined, // Reset pagination when searching
        });
      } catch (error) {
        console.error('Error searching Private Participants:', error);
        toast.error('Не удалось выполнить поиск приватных участников');
      }
    },
    [refetch, variables]
  );

  return {
    data: data as RelayParticipantsResponse | undefined,
    loading,
    error,
    loadMore,
    searchPrivateParticipants,
    refetch,
  };
}
