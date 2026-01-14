'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useNetworkStatus } from './use-network-status';

export const useFilterInfiniteScroll = (
  hasMore: boolean,
  isLoading: boolean,
  onLoadMore: (() => void) | undefined,
  debugName?: string
) => {

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isApproachingBottom, setIsApproachingBottom] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isProcessingRef = useRef(false);
  const [hasCheckedInitialLoad, setHasCheckedInitialLoad] = useState(false);
  const scrollListenerRef = useRef<(() => void) | null>(null);

  // Network status monitoring to prevent infinite loops
  const {
    canMakeRequest,
    isOnline,
    isBackendAvailable,
    isInErrorState,
    trackError,
    resetErrors
  } = useNetworkStatus();

  const handleLoadMore = useCallback(async () => {
    // Enhanced checks to prevent infinite loops
    if (!canMakeRequest) {
      return;
    }

    if (
      isProcessingRef.current ||
      !hasMore ||
      isLoadingMore ||
      isLoading ||
      !onLoadMore
    ) {
      return;
    }

    isProcessingRef.current = true;
    setIsLoadingMore(true);

    try {
      await onLoadMore();
      // Reset errors on successful request
      resetErrors();
    } catch (error) {
      console.error('❌ Error loading more in filter section:', error);
      // Track error for circuit breaker
      trackError();
    } finally {
      setTimeout(() => {
        setIsLoadingMore(false);
        isProcessingRef.current = false;
      }, 100); // Reduced timeout for better responsiveness
    }
  }, [
    hasMore,
    isLoadingMore,
    isLoading,
    onLoadMore,
    canMakeRequest,
    isOnline,
    isBackendAvailable,
    isInErrorState,
    trackError,
    resetErrors
  ]);

  // Check for initial load when data is first available
  useEffect(() => {
    if (
      !hasCheckedInitialLoad &&
      hasMore &&
      !isLoading &&
      onLoadMore &&
      loadMoreRef.current &&
      canMakeRequest
    ) {

      // Delay the check to ensure the element is fully rendered
      const checkVisibility = () => {
        if (!loadMoreRef.current || !canMakeRequest) return;

        // Check if the load more trigger is already visible
        const scrollContainer = loadMoreRef.current.closest(
          '[data-radix-scroll-area-viewport]'
        );
        const element = loadMoreRef.current;

        if (scrollContainer && element) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();

          console.log('📐 Initial visibility check:', {
            containerHeight: containerRect.height,
            elementTop: elementRect.top,
            elementBottom: elementRect.bottom,
            containerTop: containerRect.top,
            containerBottom: containerRect.bottom,
            isVisible:
              elementRect.top < containerRect.bottom &&
              elementRect.bottom > containerRect.top,
            canMakeRequest
          });

          // If the load more trigger is visible in the scroll container, trigger initial load
          if (
            elementRect.top < containerRect.bottom &&
            elementRect.bottom > containerRect.top &&
            canMakeRequest
          ) {
            console.log(
              '📥 Load more trigger is visible, starting initial load'
            );
            setTimeout(() => handleLoadMore(), 200);
          }
        }
      };

      // Check visibility after a short delay to ensure DOM is settled
      setTimeout(checkVisibility, 500);
      setHasCheckedInitialLoad(true);
    }
  }, [
    hasCheckedInitialLoad,
    hasMore,
    isLoading,
    onLoadMore,
    canMakeRequest,
    handleLoadMore
  ]);

  // Reset initial load check when hasMore changes (e.g., on search)
  useEffect(() => {
    setHasCheckedInitialLoad(false);
    setIsApproachingBottom(false);
  }, [hasMore]);

  // Set up intersection observer with improved detection and network monitoring
  useEffect(() => {
    if (!onLoadMore || !canMakeRequest) {
      return;
    }

    // Use setTimeout to wait for DOM to be ready
    const timeoutId = setTimeout(() => {
      if (!loadMoreRef.current || !canMakeRequest) {
        return;
      }

      // Find the ScrollArea container - try multiple selectors
      const element = loadMoreRef.current;
      let scrollContainer = element.closest(
        '[data-radix-scroll-area-viewport]'
      );

      // If not found, try other common scroll containers
      if (!scrollContainer) {
        scrollContainer =
          element.closest('.scroll-area-viewport') ||
          element.closest('[data-scroll-area]') ||
          element.closest('.overflow-auto') ||
          element.closest('.overflow-y-auto');
      }



      // Create observer with scroll container as root if available
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;

          if (
            entry.isIntersecting &&
            hasMore &&
            !isLoading &&
            !isLoadingMore &&
            !isProcessingRef.current &&
            canMakeRequest
          ) {
            handleLoadMore();
          }
        },
        {
          root: null, // Use viewport as root for better compatibility
          threshold: 0.1,
          rootMargin: '300px' // Increased to start fetching earlier
        }
      );

      observer.observe(element);
      observerRef.current = observer;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [
    onLoadMore,
    hasMore,
    isLoading,
    isLoadingMore,
    handleLoadMore,
    canMakeRequest,
    isApproachingBottom
  ]);

  // Add scroll event listener as fallback with network monitoring
  useEffect(() => {
    if (!onLoadMore || !loadMoreRef.current || !hasMore || !canMakeRequest)
      return;

    const element = loadMoreRef.current;
    const scrollContainer =
      element.closest('[data-radix-scroll-area-viewport]') ||
      element.closest('.overflow-auto') ||
      element.closest('.overflow-y-auto') ||
      document.body;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      
      ticking = true;
      requestAnimationFrame(() => {
        if (
          !element ||
          !hasMore ||
          isLoading ||
          isLoadingMore ||
          isProcessingRef.current ||
          !canMakeRequest
        ) {
          ticking = false;
          return;
        }

        const containerRect =
          scrollContainer === document.body
            ? { top: 0, bottom: window.innerHeight }
            : scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        // Check if element is approaching the bottom (for visual indicator)
        const approaching = elementRect.top < containerRect.bottom + 400;
        if (approaching !== isApproachingBottom) {
          setIsApproachingBottom(approaching);
        }

        // Check if element is near the bottom of the container (for actual loading)
        if (elementRect.top < containerRect.bottom + 200) {
          // 200px threshold for loading (more responsive)
          handleLoadMore();
        }

        ticking = false;
      });
    };

    scrollListenerRef.current = handleScroll;

    if (scrollContainer === document.body) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      scrollContainer.addEventListener('scroll', handleScroll, {
        passive: true
      });
    }



    return () => {
      if (scrollListenerRef.current) {
        if (scrollContainer === document.body) {
          window.removeEventListener('scroll', scrollListenerRef.current);
        } else {
          scrollContainer.removeEventListener(
            'scroll',
            scrollListenerRef.current
          );
        }
        scrollListenerRef.current = null;
      }
    };
  }, [
    onLoadMore,
    hasMore,
    isLoading,
    isLoadingMore,
    handleLoadMore,
    canMakeRequest
  ]);

  return { loadMoreRef, isLoadingMore, isApproachingBottom };
}; 