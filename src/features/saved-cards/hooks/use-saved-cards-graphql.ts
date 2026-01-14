'use client';

import { useSavedCards } from '../contexts/saved-cards-graphql-context';
import { useCallback, useState } from 'react';

// Map for tracking active requests
const activeRequests = new Map<string, Promise<any>>();

export function useSavedCardsGraphQLActions() {
  const {
    savedCards,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    folderKey,
    optimisticallyHiddenCards,
    isHidingCard,
    fetchSavedCards,
    applyFilters,
    handleToggleFavorite,
    handleDelete,
    handleRemoveCard,
    loadMore,
    setCurrentFilters,
    setFolderKey
  } = useSavedCards();

  const [searchQuery, setSearchQuery] = useState('');

  // Load specific page with append mode support
  const loadPage = useCallback(
    async (page: number, appendMode = false) => {
      // Create unique key for request
      const requestKey = `saved-cards-graphql-${JSON.stringify(currentFilters)}-${folderKey}-page-${page}-append-${appendMode}`;
      
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
          await fetchSavedCards({ ...currentFilters, page }, appendMode);
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
    [fetchSavedCards, currentFilters, folderKey]
  );

  // Change page size
  const changePageSize = useCallback(
    async (pageSize: number) => {
      const requestKey = `saved-cards-graphql-pagesize-${pageSize}`;
      
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Page size change already in progress, waiting...`);
        return await activeRequests.get(requestKey);
      }

      const requestPromise = (async () => {
        try {
          await fetchSavedCards({ ...currentFilters, page_size: pageSize, page: 1 });
        } finally {
          activeRequests.delete(requestKey);
        }
      })();

      activeRequests.set(requestKey, requestPromise);
      return await requestPromise;
    },
    [fetchSavedCards, currentFilters]
  );

  // Search cards (always resets to first page)
  const searchCards = useCallback(
    async (query: string) => {
      const requestKey = `saved-cards-graphql-search-${query}`;
      
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Search already in progress, waiting...`);
        return await activeRequests.get(requestKey);
      }

      const requestPromise = (async () => {
        try {
          setSearchQuery(query);
          console.log('🔍 Searching cards with query:', query);
          await fetchSavedCards({ ...currentFilters, search: query, page: 1 });
        } finally {
          activeRequests.delete(requestKey);
        }
      })();

      activeRequests.set(requestKey, requestPromise);
      return await requestPromise;
    },
    [fetchSavedCards, currentFilters]
  );

  // Apply filters
  const handleApplyFilters = useCallback(
    async (filters: Record<string, any>) => {
      const requestKey = `saved-cards-graphql-filters-${JSON.stringify(filters)}`;
      
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

  // Change folder
  const changeFolderKey = useCallback(
    async (newFolderKey: string) => {
      const requestKey = `saved-cards-graphql-folder-${newFolderKey}`;
      
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Folder change already in progress, waiting...`);
        return await activeRequests.get(requestKey);
      }

      const requestPromise = (async () => {
        try {
          console.log('📁 Changing folder to:', newFolderKey);
          setFolderKey(newFolderKey);
          await fetchSavedCards({ folder_key: newFolderKey, page: 1 });
        } finally {
          activeRequests.delete(requestKey);
        }
      })();

      activeRequests.set(requestKey, requestPromise);
      return await requestPromise;
    },
    [setFolderKey, fetchSavedCards]
  );

  // Reset filters
  const resetFilters = useCallback(async () => {
    setSearchQuery('');
    await fetchSavedCards({ page: 1, page_size: 20 });
  }, [fetchSavedCards]);

  return {
    // State
    savedCards,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    folderKey,
    searchQuery,
    optimisticallyHiddenCards,
    isHidingCard,

    // Core methods
    fetchSavedCards,
    applyFilters,
    handleToggleFavorite,
    handleDelete,
    handleRemoveCard,
    loadMore,
    setCurrentFilters,
    setFolderKey,

    // Additional methods
    loadPage,
    changePageSize,
    searchCards,
    handleApplyFilters,
    changeFolderKey,
    resetFilters
  };
} 