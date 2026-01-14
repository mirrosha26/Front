'use client';

import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client';
import { toast } from 'sonner';
import { BASIC_FILTERS_QUERY, USER_FEED_QUERY } from '@/lib/graphql/queries';

/**
 * Hook for managing categories cache invalidation and filter clearing
 * Used when feed settings change (web2/web3/all preference) that affect available categories
 */
export function useCategoriesCache() {
  const apolloClient = useApolloClient();

  const invalidateCategoriesCache = useCallback(async () => {
    try {
      console.log('🔄 Invalidating categories cache for feed settings change...');
      
      // Evict categories-related cache fields
      apolloClient.cache.evict({ 
        fieldName: 'categories' 
      });
      apolloClient.cache.evict({ 
        fieldName: 'availableCategories' 
      });
      
      // Perform garbage collection to clean up orphaned references
      apolloClient.cache.gc();
      
      // Refetch basic filters to get fresh categories data
      await apolloClient.refetchQueries({
        include: [BASIC_FILTERS_QUERY]
      });
      
      console.log('✅ Categories cache invalidated and refetched successfully');
      return true;
    } catch (error) {
      console.error('❌ Error invalidating categories cache:', error);
      throw error;
    }
  }, [apolloClient]);

  const clearFiltersFromCache = useCallback(() => {
    try {
      console.log('🗑️ Clearing saved filters from localStorage...');
      if (typeof window !== 'undefined') {
        // Clear all filter-related cache keys
        const filterCacheKeys = [
          'graphql-signal-filters',
          'all-signals-graphql-saved-filter-name',
          'all-signals-filters',
          'personal-signals-filters'
        ];
        
        filterCacheKeys.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Clear any saved filter data cache (these have dynamic names)
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('saved-filter-data-')) {
            localStorage.removeItem(key);
          }
        });
      }
      console.log('✅ Saved filters cleared from cache');
    } catch (error) {
      console.warn('Failed to clear filters from cache:', error);
    }
  }, []);

  const clearAllFiltersAndCache = useCallback(async () => {
    try {
      console.log('🧹 Performing complete filter cache cleanup...');
      
      // Clear localStorage
      clearFiltersFromCache();
      
      // Clear Apollo cache
      await invalidateCategoriesCache();
      
      // Clear any additional filter-related cache
      apolloClient.cache.evict({ fieldName: 'userFeed' });
      apolloClient.cache.evict({ fieldName: 'signalCards' });
      apolloClient.cache.evict({ fieldName: 'participants' });
      apolloClient.cache.evict({ fieldName: 'regionalLocations' });
      
      apolloClient.cache.gc();
      
      console.log('✅ Complete filter cache cleanup completed');
      toast.success('Cache cleared successfully. Please refresh the page.');
      
    } catch (error) {
      console.error('❌ Error during complete cache cleanup:', error);
      toast.error('Не удалось полностью очистить кеш. Попробуйте обновить страницу.');
    }
  }, [apolloClient, clearFiltersFromCache, invalidateCategoriesCache]);

  const invalidateAndClearForFeedChange = useCallback(async () => {
    try {
      console.log('🔄 Feed preference changed: clearing filters and invalidating cache...');
      
      // First clear the saved filters from localStorage
      clearFiltersFromCache();
      
      // Invalidate the main feed cache to force refetch with new user preference
      console.log('🔄 Invalidating USER_FEED_QUERY cache...');
      apolloClient.cache.evict({ fieldName: 'userFeed' });
      
      // Invalidate saved filters cache to refresh preference badges and compatibility
      console.log('🔄 Invalidating saved filters cache to refresh preference badges...');
      apolloClient.cache.evict({ fieldName: 'savedFilters' });
      apolloClient.cache.evict({ fieldName: 'defaultSavedFilter' });
      apolloClient.cache.evict({ fieldName: 'savedFiltersSummary' });
      
      // Then invalidate and refetch categories cache
      await invalidateCategoriesCache();
      
      // Refetch the user feed with new preference
      await apolloClient.refetchQueries({
        include: [USER_FEED_QUERY]
      });
      
      // Trigger garbage collection to remove orphaned references
      apolloClient.cache.gc();
      
      console.log('✅ Filters cleared, feed and categories refreshed for preference change');
      return true;
    } catch (error) {
      console.error('❌ Error during feed preference change cleanup:', error);
      throw error;
    }
  }, [apolloClient, invalidateCategoriesCache, clearFiltersFromCache]);

  const invalidateCategoriesCacheWithToast = useCallback(async () => {
    try {
      await invalidateCategoriesCache();
      toast.success('Categories refreshed for current feed settings');
      return true;
    } catch (error) {
      toast.error('Не удалось обновить категории');
      return false;
    }
  }, [invalidateCategoriesCache]);

  const invalidateAndClearForFeedChangeWithToast = useCallback(async () => {
    try {
      await invalidateAndClearForFeedChange();
      toast.success('Feed preference updated: data refreshed successfully');
      return true;
    } catch (error) {
      toast.error('Не удалось обновить настройки ленты');
      return false;
    }
  }, [invalidateAndClearForFeedChange]);

  return {
    invalidateCategoriesCache,
    invalidateCategoriesCacheWithToast,
    clearFiltersFromCache,
    invalidateAndClearForFeedChange,
    invalidateAndClearForFeedChangeWithToast,
    clearAllFiltersAndCache
  };
} 