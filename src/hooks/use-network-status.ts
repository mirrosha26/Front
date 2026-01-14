import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isBackendAvailable: boolean;
  errorCount: number;
  isInErrorState: boolean;
  lastErrorTime: number;
  canMakeRequest: boolean;
}

interface NetworkStatusConfig {
  maxErrorCount?: number;
  errorCooldown?: number;
  backendCheckInterval?: number;
  onRecovery?: () => void; // Callback for when connectivity is restored
}

export function useNetworkStatus(config: NetworkStatusConfig = {}) {
  const {
    maxErrorCount = 10, // Increased from 5 to be less aggressive
    errorCooldown = 60000, // Increased to 60 seconds
    backendCheckInterval = 30000, // Increased to 30 seconds for less frequent checks
    onRecovery,
  } = config;

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isBackendAvailable: true, // Always start with backend available
    errorCount: 0,
    isInErrorState: false,
    lastErrorTime: 0,
    canMakeRequest: true,
  }));

  // Refs to prevent stale closures
  const statusRef = useRef(networkStatus);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref whenever status changes
  useEffect(() => {
    statusRef.current = networkStatus;
  }, [networkStatus]);

  // Update error state based on error count and time - be more lenient
  const updateErrorState = useCallback((errorCount: number, lastErrorTime: number) => {
    // Only consider it an error state if we have many consecutive errors
    const isInErrorState = errorCount >= maxErrorCount && 
      (Date.now() - lastErrorTime) < errorCooldown;
    
    return isInErrorState;
  }, [maxErrorCount, errorCooldown]);

  // Update network status
  const updateNetworkStatus = useCallback((updates: Partial<NetworkStatus>) => {
    setNetworkStatus(prev => {
      const newStatus = { ...prev, ...updates };
      
      // Recalculate derived states
      newStatus.isInErrorState = updateErrorState(newStatus.errorCount, newStatus.lastErrorTime);
      newStatus.canMakeRequest = newStatus.isOnline && 
        newStatus.isBackendAvailable && 
        !newStatus.isInErrorState;
      
      // Trigger recovery callback if we've recovered
      const wasUnableToMakeRequests = !prev.canMakeRequest;
      const canNowMakeRequests = newStatus.canMakeRequest;
      
      if (wasUnableToMakeRequests && canNowMakeRequests && onRecovery) {
        console.log('🎉 Network recovery detected - triggering recovery callback');
        setTimeout(() => onRecovery(), 100); // Small delay to ensure state is updated
      }
      
      return newStatus;
    });
  }, [updateErrorState, onRecovery]);

  // Track network errors - be more conservative
  const trackError = useCallback(() => {
    const now = Date.now();
    setNetworkStatus(prev => {
      const newErrorCount = prev.errorCount + 1;
      
      // Only update status if we haven't recently reset errors
      const timeSinceLastError = now - prev.lastErrorTime;
      if (timeSinceLastError < 5000 && prev.errorCount > 0) {
        // If errors are happening too frequently, be more aggressive
        const newStatus = {
          ...prev,
          errorCount: newErrorCount,
          lastErrorTime: now,
        };
        
        newStatus.isInErrorState = updateErrorState(newErrorCount, now);
        newStatus.canMakeRequest = newStatus.isOnline && 
          newStatus.isBackendAvailable && 
          !newStatus.isInErrorState;
        
        console.warn(`🔴 Network error tracked. Count: ${newErrorCount}`);
        return newStatus;
      } else {
        // If errors are spaced out, be more lenient
        console.warn(`🟡 Network error noted but not tracked aggressively. Count: ${newErrorCount}`);
        return {
          ...prev,
          errorCount: Math.min(newErrorCount, maxErrorCount - 1), // Cap the error count
          lastErrorTime: now,
        };
      }
    });
  }, [updateErrorState, maxErrorCount]);

  // Reset error state (on successful request)
  const resetErrors = useCallback(() => {
    setNetworkStatus(prev => {
      const newStatus = {
        ...prev,
        errorCount: 0,
        lastErrorTime: 0,
        isInErrorState: false,
        isBackendAvailable: true, // Reset backend availability on successful request
      };
      
      newStatus.canMakeRequest = newStatus.isOnline && 
        newStatus.isBackendAvailable;
      
      console.log('✅ Network errors reset');
      return newStatus;
    });
  }, []);

  // Force error state reset (manual recovery)
  const forceReset = useCallback(() => {
    setNetworkStatus(prev => {
      const newStatus = {
        ...prev,
        errorCount: 0,
        lastErrorTime: 0,
        isBackendAvailable: true,
        isInErrorState: false,
      };
      
      newStatus.canMakeRequest = newStatus.isOnline;
      
      console.log('🔄 Network status force reset');
      
      // Trigger recovery
      if (onRecovery) {
        setTimeout(() => onRecovery(), 100);
      }
      
      return newStatus;
    });
  }, [onRecovery]);

  // Check if enough time has passed to retry
  const canRetryAfterError = useCallback(() => {
    const currentStatus = statusRef.current;
    if (currentStatus.errorCount === 0) return true;
    
    const timeSinceLastError = Date.now() - currentStatus.lastErrorTime;
    return timeSinceLastError >= errorCooldown;
  }, [errorCooldown]);

  // Simplified backend health check function
  const performHealthCheck = useCallback(async () => {
    const currentStatus = statusRef.current;
    
    // Only perform health check if we're really in trouble
    if (!currentStatus.isOnline || currentStatus.errorCount < maxErrorCount - 2) {
      return true; // Skip health check if we're not in severe error state
    }

    console.log('🔍 Performing backend health check...');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout to 10 seconds
      
      const response = await fetch('/api/graphql', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Backend health check passed - backend is available');
        
        updateNetworkStatus({ 
          isBackendAvailable: true 
        });
        
        // Reset errors since backend is working
        resetErrors();
        
        // Dispatch recovery event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('backend-recovered', {
            detail: { message: 'Backend is now available' }
          }));
        }
        
        return true;
      } else {
        console.log('❌ Backend health check failed - bad response');
        return false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏰ Backend health check timed out');
      } else {
        console.log('❌ Backend health check failed:', error);
      }
      return false;
    }
  }, [updateNetworkStatus, resetErrors, maxErrorCount]);

  // Start health checking when in error state
  const startHealthChecking = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }
    
    console.log('🔄 Starting health check monitoring');
    
    // Immediate health check
    performHealthCheck();
    
    // Periodic health checks
    healthCheckIntervalRef.current = setInterval(() => {
      const currentStatus = statusRef.current;
      
      if (currentStatus.isOnline && (!currentStatus.isBackendAvailable || currentStatus.isInErrorState)) {
        performHealthCheck();
      } else if (currentStatus.canMakeRequest) {
        // Stop health checking if we're fully recovered
        console.log('✅ Fully recovered - stopping health checks');
        if (healthCheckIntervalRef.current) {
          clearInterval(healthCheckIntervalRef.current);
          healthCheckIntervalRef.current = null;
        }
      }
    }, backendCheckInterval);
  }, [performHealthCheck, backendCheckInterval]);

  // Stop health checking
  const stopHealthChecking = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      console.log('🛑 Stopping health check monitoring');
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('🟢 Network online detected');
      updateNetworkStatus({ isOnline: true });
      
      // Start health checking to verify backend
      recoveryTimeoutRef.current = setTimeout(() => {
        console.log('🔍 Network online - starting backend verification');
        startHealthChecking();
      }, 1000); // Give it a moment for connection to stabilize
    };

    const handleOffline = () => {
      console.log('🔴 Network offline detected');
      updateNetworkStatus({ 
        isOnline: false,
        isBackendAvailable: false 
      });
      
      stopHealthChecking();
      
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };

    const handleBackendOffline = (event: any) => {
      console.log('🔴 Backend offline detected via event');
      updateNetworkStatus({ 
        isBackendAvailable: false 
      });
      trackError();
      
      // Start health checking to monitor recovery
      startHealthChecking();
    };

    const handleBackendRecovered = (event: any) => {
      console.log('🟢 Backend recovery detected via event');
      updateNetworkStatus({ 
        isBackendAvailable: true 
      });
      resetErrors();
    };

    // Set initial state
    updateNetworkStatus({ isOnline: navigator.onLine });

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('backend-offline', handleBackendOffline);
    window.addEventListener('backend-recovered', handleBackendRecovered);

    // Start monitoring if we're already in a problematic state
    const currentStatus = statusRef.current;
    if (currentStatus.isOnline && (!currentStatus.isBackendAvailable || currentStatus.isInErrorState)) {
      console.log('🔍 Initial health check needed');
      startHealthChecking();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('backend-offline', handleBackendOffline);
      window.removeEventListener('backend-recovered', handleBackendRecovered);
      
      stopHealthChecking();
      
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - effects manage their own state via refs

  return {
    ...networkStatus,
    trackError,
    resetErrors,
    forceReset,
    canRetryAfterError,
    performHealthCheck,
    
    // Helper methods
    getStatusMessage: () => {
      if (!networkStatus.isOnline) return 'You are offline';
      if (!networkStatus.isBackendAvailable) return 'Backend is unavailable';
      if (networkStatus.isInErrorState) return 'Experiencing connection issues';
      return 'Connected';
    },
    
    getStatusColor: () => {
      if (!networkStatus.isOnline || !networkStatus.isBackendAvailable) return 'red';
      if (networkStatus.isInErrorState) return 'amber';
      return 'green';
    },
  };
}

// Hook for components that just need basic online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
} 