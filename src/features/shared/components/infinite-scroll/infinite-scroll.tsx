'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  IconLoader2,
  IconWifiOff,
  IconAlertTriangle
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';

interface InfiniteScrollProps {
  // Данные для отображения
  hasMore: boolean;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount?: number; // Добавляем общее количество карточек
  currentCount?: number; // Добавляем текущее количество карточек

  // Функция загрузки
  onLoadMore: () => void;

  // Настройки observer
  rootMargin?: string;
  threshold?: number;

  // Настройки UI
  loadingText?: string;
  instructionText?: string;
  completedText?: string;

  // Дополнительные классы
  className?: string;
}

export function InfiniteScroll({
  hasMore,
  isLoading,
  currentPage,
  totalPages,
  totalCount,
  currentCount,
  onLoadMore,
  rootMargin = '200px',
  threshold = 0.1,
  loadingText = 'Загрузка карточек...',
  instructionText = 'Прокрутите вниз, чтобы загрузить больше',
  completedText = 'Все карточки загружены',
  className = ''
}: InfiniteScrollProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);

  // Use basic online status instead of complex network status
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Simple online/offline detection
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

  const handleLoadMore = useCallback(async () => {
    // Simplified checks - only prevent if already processing or no more data
    if (isProcessingRef.current || !hasMore || isLoading) {
      console.log('🚫 InfiniteScroll: Cannot load more:', {
        isProcessing: isProcessingRef.current,
        hasMore,
        isLoading
      });
      return;
    }

    console.log('🔄 InfiniteScroll LoadMore triggered:', {
      currentPage,
      hasMore,
      isLoading
    });

    isProcessingRef.current = true;
    setIsLoadingMore(true);

    try {
      console.log('📥 Loading more content...');
      await onLoadMore();
      console.log('✅ Load more completed successfully');
    } catch (error) {
      console.error('❌ Error loading more:', error);
    } finally {
      setIsLoadingMore(false);
      isProcessingRef.current = false;
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Setup IntersectionObserver with optimized settings
  useEffect(() => {
    if (loadMoreRef.current && hasMore && !isLoading) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;

          console.log('👀 InfiniteScroll Intersection triggered:', {
            isIntersecting: entry.isIntersecting,
            hasMore,
            isLoading,
            isProcessing: isProcessingRef.current
          });

          if (
            entry.isIntersecting &&
            hasMore &&
            !isLoading &&
            !isProcessingRef.current
          ) {
            console.log('🔄 InfiniteScroll: Loading more content...');
            handleLoadMore();
          }
        },
        {
          threshold: threshold,
          rootMargin: rootMargin
        }
      );

      observerRef.current.observe(loadMoreRef.current);
      console.log('👀 InfiniteScroll Observer attached');
    } else {
      console.log('🚫 InfiniteScroll Observer not attached:', {
        hasRef: !!loadMoreRef.current,
        hasMore,
        isLoading
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, handleLoadMore, threshold, rootMargin]);

  // Show offline indicator only when actually offline
  if (!isOnline && hasMore) {
    return (
      <div className={`py-6 text-center ${className}`}>
        <div className='mb-3 flex items-center justify-center gap-2'>
          <IconWifiOff className='h-5 w-5 text-red-500' />
          <Badge
            variant='outline'
            className='border-red-200 bg-red-50 text-red-700'
          >
            Offline
          </Badge>
        </div>

        <div className='text-muted-foreground text-sm'>
          You're offline. Check your internet connection to load more content.
        </div>

        {currentCount && totalCount && (
          <div className='text-muted-foreground/70 mt-2 text-xs'>
            Показано {currentCount} из {totalCount} карточек (кэшировано)
          </div>
        )}
      </div>
    );
  }

  // Show completion message when no more data
  if (!hasMore) {
    const finalText = totalCount
      ? `Все карточки загружены (${totalCount})`
      : completedText;

    return (
      <div
        className={`text-muted-foreground py-6 text-center text-xs ${className}`}
      >
        <div className='flex items-center justify-center gap-2'>
          <div className='bg-border h-px flex-1'></div>
          <span>{finalText}</span>
          <div className='bg-border h-px flex-1'></div>
        </div>
        {currentCount && totalCount && (
          <div className='text-muted-foreground/70 mt-2 text-xs'>
            Показано {currentCount} из {totalCount} карточек
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={loadMoreRef}
      className={`flex min-h-[60px] flex-col items-center py-4 transition-colors ${
        isOnline
          ? 'hover:bg-muted/50 cursor-pointer'
          : 'cursor-not-allowed opacity-50'
      } ${className}`}
      onClick={
        isOnline && !isLoading && !isProcessingRef.current
          ? handleLoadMore
          : undefined
      }
    >
      {isLoadingMore || isLoading ? (
        <div className='flex items-center gap-2'>
          <IconLoader2 className='h-4 w-4 animate-spin' />
          <span className='text-muted-foreground text-xs'>{loadingText}</span>
        </div>
      ) : (
        <div className='text-center'>
          <div className='text-muted-foreground mb-1 text-xs'>
            {isOnline
              ? 'Прокрутите для загрузки...'
              : 'Не удается загрузить - проверьте соединение'}
          </div>
          {currentCount && totalCount && (
            <div className='text-muted-foreground/70 text-xs'>
              Показано {currentCount} из {totalCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
