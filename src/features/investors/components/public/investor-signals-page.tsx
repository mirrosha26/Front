'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconRefresh, IconSearch, IconArrowUp, IconLoader2, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';
import { SearchInput } from '@/features/shared/components/feeds/search-input';
import { InfiniteScroll } from '@/features/shared/components/infinite-scroll/infinite-scroll';
import { CardsList } from '@/features/shared/components/lists';
import { Badge } from '@/components/ui/badge';
import { InvestorSignalsGraphQLProvider, useInvestorSignals } from '../../contexts/investor-signals-graphql-context';
import { useCardOperations } from '@/features/shared/contexts/card-operations-context';
import { transformImageUrl } from '@/lib/utils/image-url';
import {
  deduplicateSignalsByPerson,
  generateLegacyParticipantsList
} from '@/features/shared/utils/signal-deduplication';
import { useCategoriesCache } from '@/hooks/use-categories-cache';

// Internal component that uses the GraphQL context
function InvestorSignalsContent({ participantId }: { participantId: string }) {
  const {
    signals,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    fetchSignals,
    applyFilters,
    handleToggleFavorite,
    handleDelete,
    loadMore,
    setCurrentFilters,
    setParticipantId
  } = useInvestorSignals();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use card operations for additional functionality
  const { toggleFavorite, deleteCard } = useCardOperations();

  // Categories cache for better performance
  const { invalidateCategoriesCache } = useCategoriesCache();

  // Update participant ID when prop changes
  useEffect(() => {
    setParticipantId(participantId);
  }, [participantId, setParticipantId]);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    await applyFilters({ search: query, page: 1 });
  };

  // Handle clear search
  const handleClearSearch = async () => {
    setSearchQuery('');
    await applyFilters({ search: '', page: 1 });
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSignals({}, false);
      setSearchQuery('');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle toggle save
  const handleToggleSave = async (cardId: number) => {
    try {
      await handleToggleFavorite(cardId);
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Не удалось изменить статус избранного');
    }
  };

  // Handle delete
  const handleDeleteCard = async (cardId: number) => {
    try {
      await handleDelete(cardId);
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Не удалось удалить карточку');
    }
  };

  // Convert signals to the format expected by CardsList
  const convertedSignals = signals.map((signal) => ({
    id: parseInt(signal.id),
    title: signal.name,
    description: signal.description,
    image_url: transformImageUrl(signal.imageUrl),
    round_status: signal.roundStatus,
    last_round: signal.lastRound,
    categories_list: signal.categories?.map(cat => ({
      id: parseInt(cat.id),
      name: cat.name,
      slug: cat.slug
    })) || [],
    is_liked: signal.userData?.isFavorited ?? false,
    is_heart_liked: signal.userData?.isFavorited ?? false,
    has_note: signal.userData?.userNote?.noteText ? true : false,
    note_text: signal.userData?.userNote?.noteText || '',
    created_at: signal.createdAt,
    latest_signal_date: signal.latestSignalDate,
    stage: signal.stage,
    location: signal.location,
    trending: signal.trending,
    url: signal.url,
    social_links: signal.socialLinks,

    // Deduplicate signals to show only oldest signal per participant
    signals: (() => {
      if (!signal.signals || signal.signals.length === 0) return [];

      // Map to the expected format for deduplication
      const mappedSignals = signal.signals.map((s) => ({
        id: s.id,
        date: s.date,
        description: s.description,
        participant: s.participant
          ? {
              id: s.participant.id,
              name: s.participant.name,
              slug: s.participant.slug,
              type: s.participant.type || '',
              about: s.participant.about,
              imageUrl: s.participant.imageUrl,
              isSaved: s.participant.isSaved,
              isPrivate: s.participant.isPrivate
            }
          : undefined,
        associatedParticipant: s.associatedParticipant
          ? {
              id: s.associatedParticipant.id,
              name: s.associatedParticipant.name,
              slug: s.associatedParticipant.slug,
              type: s.associatedParticipant.type || '',
              about: s.associatedParticipant.about,
              imageUrl: s.associatedParticipant.imageUrl,
              isSaved: s.associatedParticipant.isSaved,
              isPrivate: s.associatedParticipant.isPrivate
            }
          : undefined
      }));

      // Apply deduplication to keep only oldest signal per person
      return deduplicateSignalsByPerson(mappedSignals);
    })(),

    // Legacy participants_list for backward compatibility - generated from deduplicated signals
    participants_list: signal.signals
      ? generateLegacyParticipantsList(signal.signals)
      : [],
    participants_has_more: false,
    participants_more_count: 0,

    // User data
    user_data: signal.userData
  }));



  return (
    <div className='w-full pb-2 pl-1 relative h-full flex flex-col'>
      {/* Header with count and search */}
      <div className='bg-background/90 backdrop-blur-sm sticky top-0 z-20 pt-4 pb-4 w-full border-b flex-shrink-0'>
        <div className='flex items-center justify-between w-full'>
          {/* Count */}
          <div className='flex items-center gap-2'>
            <h3 className='text-lg font-semibold'>
              {isLoading ? (
                <span className='flex items-center gap-2'>
                  <span className='animate-pulse'>••</span>
                  signals
                </span>
              ) : (
                `${totalCount} signals`
              )}
            </h3>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className='h-8 w-8'
            >
              <IconRefresh
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>

          {/* Search */}
          <div className='relative w-80'>
            <IconSearch className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Поиск сигналов...'
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className='bg-background pl-9 pr-10 shadow-none w-full'
            />
            {isLoading ? (
              <IconLoader2 className='absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin' />
            ) : searchQuery && (
              <Button
                variant='ghost'
                size='icon'
                onClick={handleClearSearch}
                className='absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                <IconX className='h-3 w-3' />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className='mb-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400 w-full flex-shrink-0'>
          <p className='text-sm'>{error}</p>
        </div>
      )}

      {/* Content */}
      <div className='space-y-4 flex-1 min-h-0 overflow-y-auto'>
        {convertedSignals && convertedSignals.length > 0 ? (
          <>
            <CardsList
              cards={convertedSignals}
              isLoading={false}
              variant='default'
              emptyMessage='No signals found'
              onToggleSave={handleToggleSave}
              onDelete={handleDeleteCard}
            />

            {/* Infinite scroll */}
            {hasNextPage && (
              <InfiniteScroll
                hasMore={hasNextPage}
                isLoading={isLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                currentCount={convertedSignals.length}
                onLoadMore={loadMore}
                completedText='All signals loaded'
              />
            )}
          </>
        ) : !isLoading ? (
          <div className='text-center py-8'>
            <p className='text-muted-foreground'>
              No signals found for this investor.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Main component that provides the GraphQL context
export function InvestorSignalsPage({ 
  participantId 
}: { 
  participantId: string;
}) {
  return (
    <InvestorSignalsGraphQLProvider initialParticipantId={participantId}>
      <InvestorSignalsContent participantId={participantId} />
    </InvestorSignalsGraphQLProvider>
  );
} 