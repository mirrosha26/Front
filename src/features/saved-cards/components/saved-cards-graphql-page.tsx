'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SavedCardsGraphQLProvider } from '../contexts/saved-cards-graphql-context';
import { useSavedCardsGraphQLActions } from '../hooks/use-saved-cards-graphql';
import { CardPreview } from '@/features/shared/components/cards/card-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Folder, RefreshCw } from 'lucide-react';

// Internal component that uses the GraphQL context
function SavedCardsGraphQLContent() {
  const {
    savedCards,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    folderKey,
    searchQuery,
    optimisticallyHiddenCards,
    isHidingCard,
    loadPage,
    searchCards,
    changeFolderKey,
    resetFilters,
    loadMore
  } = useSavedCardsGraphQLActions();

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [selectedFolder, setSelectedFolder] = useState(folderKey);

  const searchParams = useSearchParams();

  // Handle search input changes
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      searchCards(searchInput);
    },
    [searchInput, searchCards]
  );

  // Handle folder change
  const handleFolderChange = useCallback(
    (newFolderKey: string) => {
      setSelectedFolder(newFolderKey);
      changeFolderKey(newFolderKey);
    },
    [changeFolderKey]
  );

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isLoading) {
      loadMore();
    }
  }, [hasNextPage, isLoading, loadMore]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    resetFilters();
    setSearchInput('');
    setSelectedFolder('default');
  }, [resetFilters]);

  // Initialize from URL parameters
  useEffect(() => {
    const folderFromUrl = searchParams.get('folder_key') || 'default';
    if (folderFromUrl !== folderKey) {
      handleFolderChange(folderFromUrl);
    }
  }, [searchParams, folderKey, handleFolderChange]);

  // Render loading skeleton
  if (isLoading && savedCards.length === 0) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-48' />
          <div className='flex gap-2'>
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-10 w-10' />
          </div>
        </div>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className='h-64 w-full' />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert className='border-red-200 bg-red-50'>
        <AlertDescription className='text-red-700'>
          Error loading saved cards: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Folder className='h-6 w-6 text-gray-500' />
          <h1 className='text-2xl font-bold'>
            Сохраненные карточки{' '}
            <span className='text-sm font-normal text-gray-500'>
              ({totalCount} всего)
            </span>
          </h1>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        <form onSubmit={handleSearchSubmit} className='flex-1'>
          <div className='relative'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
            <Input
              placeholder='Поиск сохраненных карточек...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='pl-10'
            />
          </div>
        </form>

        <div className='flex gap-2'>
          <Button
            variant={selectedFolder === 'default' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleFolderChange('default')}
          >
            All Saved
          </Button>
          <Button
            variant={selectedFolder !== 'default' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleFolderChange('custom')}
          >
            Custom Folder
          </Button>
        </div>
      </div>

      {/* Current folder info */}
      <div className='text-sm text-gray-500'>
        Current folder: <span className='font-medium'>{folderKey}</span>
        {searchQuery && (
          <span>
            {' '}
            · Search: <span className='font-medium'>"{searchQuery}"</span>
          </span>
        )}
      </div>

      {/* Cards Grid */}
      {savedCards.length > 0 ? (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {savedCards.map((card) => (
            <CardPreview
              key={card.id}
              card={card}
              showActions={true}
              showFolderActions={true}
              isHiding={isHidingCard[card.id] || false}
            />
          ))}
        </div>
      ) : (
        <div className='py-12 text-center'>
          <Folder className='mx-auto mb-4 h-12 w-12 text-gray-400' />
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            Сохраненные карточки не найдены
          </h3>
          <p className='text-gray-500'>
            {searchQuery
              ? `Карточки по запросу "${searchQuery}" не найдены в этой папке`
              : 'Начните сохранять карточки, чтобы увидеть их здесь'}
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasNextPage && (
        <div className='flex justify-center'>
          <Button
            onClick={handleLoadMore}
            disabled={isLoading}
            variant='outline'
          >
            {isLoading ? (
              <>
                <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                Loading...
              </>
            ) : (
              `Load More (${currentPage}/${totalPages})`
            )}
          </Button>
        </div>
      )}

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className='mt-8 rounded-md bg-gray-100 p-4 text-xs'>
          <strong>Debug Info:</strong>
          <pre className='mt-2 whitespace-pre-wrap'>
            {JSON.stringify(
              {
                folderKey,
                totalCount,
                currentPage,
                totalPages,
                hasNextPage,
                isLoading,
                error,
                searchQuery
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

// Main component that provides the GraphQL context
export default function SavedCardsGraphQLPage() {
  const searchParams = useSearchParams();
  const initialFolderKey = searchParams.get('folder_key') || 'default';

  return (
    <SavedCardsGraphQLProvider initialFolderKey={initialFolderKey}>
      <SavedCardsGraphQLContent />
    </SavedCardsGraphQLProvider>
  );
}
