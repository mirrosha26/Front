import { useApolloClient } from '@apollo/client';
import { useCallback, useRef } from 'react';

interface ApolloRecoveryConfig {
  invalidateCache?: boolean;
  refetchQueries?: string[] | 'active' | 'all';
  onRecovery?: () => void;
}

export function useApolloRecovery(config: ApolloRecoveryConfig = {}) {
  const {
    invalidateCache = true,
    refetchQueries = 'active',
    onRecovery,
  } = config;

  const client = useApolloClient();
  const lastRecoveryRef = useRef(0);

  const handleRecovery = useCallback(async () => {
    // Prevent too frequent recovery attempts
    const now = Date.now();
    if (now - lastRecoveryRef.current < 3000) {
      console.log('⏸️ Skipping Apollo recovery - too soon since last attempt');
      return;
    }
    lastRecoveryRef.current = now;

    console.log('🎉 Apollo Client recovery initiated');

    try {
      // Clear Apollo Client error states
      if (invalidateCache) {
        console.log('🧹 Clearing Apollo Client cache errors');
        // Reset error policies on queries
        client.clearStore();
        
        // Or if you want to keep cache but reset error states:
        // await client.resetStore();
      }

      // Refetch queries
      if (refetchQueries) {
        console.log('🔄 Refetching Apollo queries:', refetchQueries);
        
        await client.refetchQueries({
          include: refetchQueries,
          updateCache: (cache) => {
            // Reset any cached network error states
            cache.evict({ 
              fieldName: '__networkError__' // Custom field if used
            });
          }
        });
      }

      // Trigger custom recovery callback
      if (onRecovery) {
        await onRecovery();
      }

      console.log('✅ Apollo Client recovery completed');
    } catch (error) {
      console.error('❌ Apollo Client recovery failed:', error);
    }
  }, [client, invalidateCache, refetchQueries, onRecovery]);

  // Disabled network status monitoring to prevent false offline detection
  // useNetworkStatus({
  //   onRecovery: handleRecovery
  // });

  return {
    triggerRecovery: handleRecovery,
    clearCache: () => {
      console.log('🧹 Clearing Apollo cache');
      client.clearStore();
    }
  };
} 