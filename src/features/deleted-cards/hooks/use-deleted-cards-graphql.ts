'use client';

import { useDeletedCards } from '../contexts/deleted-cards-graphql-context';
import { useCallback, useState } from 'react';

// Map for tracking active requests
const activeRequests = new Map<string, Promise<any>>();

export function useDeletedCardsGraphQLActions() {
  const {
    deletedCards,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    fetchDeletedCards,
    applyFilters,
    handleToggleFavorite,
    handleDelete,
    handleRestoreCard,
    loadMore,
    setCurrentFilters
  } = useDeletedCards();

  const [searchQuery, setSearchQuery] = useState('');

  // Load specific page with append mode support
  const loadPage = useCallback(
    async (page: number, appendMode = false) => {
      // Create unique key for request
      const requestKey = `deleted-cards-graphql-page-${page}-append-${appendMode}`;
      
      // If request is already in progress, wait for completion
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Request already in progress for ${requestKey}, waiting...`);
        return await activeRequests.get(requestKey);
      }

      console.log(`🚀 Starting new request for ${requestKey}`);
      
      // Create promise for request
      const requestPromise = (async () => {
        try {
          console.log('📄 Loading page:', page, 'appendMode:', appendMode);
          await fetchDeletedCards({ ...currentFilters, page }, appendMode);
        } catch (error) {
          console.error('Error in loadPage:', error);
          throw error;
        } finally {
          // Remove request from active
          activeRequests.delete(requestKey);
        }
      })();

      // Save promise in active requests
      activeRequests.set(requestKey, requestPromise);
      
      return await requestPromise;
    },
    [fetchDeletedCards, currentFilters]
  );

  // Change page size
  const changePageSize = useCallback(
    async (pageSize: number) => {
      const requestKey = `deleted-cards-graphql-pagesize-${pageSize}`;
      
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Page size change already in progress, waiting...`);
        return await activeRequests.get(requestKey);
      }

      const requestPromise = (async () => {
        try {
          await fetchDeletedCards({ ...currentFilters, page_size: pageSize, page: 1 });
        } finally {
          activeRequests.delete(requestKey);
        }
      })();

      activeRequests.set(requestKey, requestPromise);
      return await requestPromise;
    },
    [fetchDeletedCards, currentFilters]
  );

  // Search cards (always resets to first page)
  const searchCards = useCallback(
    async (query: string) => {
      const requestKey = `deleted-cards-graphql-search-${query}`;
      
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Search already in progress, waiting...`);
        return await activeRequests.get(requestKey);
      }

      const requestPromise = (async () => {
        try {
          setSearchQuery(query);
          console.log('🔍 Searching deleted cards with query:', query);
          await fetchDeletedCards({ ...currentFilters, search: query, page: 1 });
        } finally {
          activeRequests.delete(requestKey);
        }
      })();

      activeRequests.set(requestKey, requestPromise);
      return await requestPromise;
    },
    [fetchDeletedCards, currentFilters]
  );

  // Apply filters
  const handleApplyFilters = useCallback(
    async (filters: Record<string, any>) => {
      const requestKey = `deleted-cards-graphql-filters-${JSON.stringify(filters)}`;
      
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Filter application already in progress, waiting...`);
        return await activeRequests.get(requestKey);
      }

      const requestPromise = (async () => {
        try {
          // Use the applyFilters function from context
          await applyFilters({
            ...filters,
            page: 1,
            page_size: 20
          });
        } finally {
          activeRequests.delete(requestKey);
        }
      })();

      activeRequests.set(requestKey, requestPromise);
      return await requestPromise;
    },
    [applyFilters]
  );

  // Reset filters
  const resetFilters = useCallback(async () => {
    setSearchQuery('');
    await fetchDeletedCards({ page: 1, page_size: 20 });
  }, [fetchDeletedCards]);

  return {
    // State
    deletedCards,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    searchQuery,

    // Core methods
    fetchDeletedCards,
    applyFilters,
    handleToggleFavorite,
    handleDelete,
    handleRestoreCard,
    loadMore,
    setCurrentFilters,

    // Additional methods
    loadPage,
    changePageSize,
    searchCards,
    handleApplyFilters,
    resetFilters
  };
} 