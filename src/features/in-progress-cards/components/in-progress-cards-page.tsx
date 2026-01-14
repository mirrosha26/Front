'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GroupAssignmentsProvider } from '@/features/in-progress-cards/contexts/group-assignments-context';
import { useGroupAssignmentsActions } from '@/features/in-progress-cards/hooks/use-group-assignments';
import { CardsList } from '@/features/shared/components/lists';
import { Button } from '@/components/ui/button';
import { IconRefresh, IconArrowUp } from '@tabler/icons-react';
import { InfiniteScroll } from '@/features/shared/components/infinite-scroll/infinite-scroll';
import { AvatarSkeleton } from '@/features/shared/components/ui/avatar-skeleton';
import { InvestorDetailModal } from '@/features/investors/components/public/investor-detail-modal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { AssignmentStatus, AssignmentFilterType } from '@/lib/graphql/types';
import { useAuth } from '@/contexts/auth-context';

// Internal component that uses the GraphQL context
function AssignmentsContent() {
  const {
    cards,
    assignments,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    fetchAssignments,
    handleToggleFavorite,
    resetFilters,
    loadMore
  } = useGroupAssignmentsActions();
  
  const { user } = useAuth();

  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'review' | 'reaching_out' | 'connected' | 'not_a_fit' | 'all'>('all');
  const [filterType, setFilterType] = useState<AssignmentFilterType>(AssignmentFilterType.MY_ASSIGNMENTS);
  
  // Investor modal state
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [investorModalSlug, setInvestorModalSlug] = useState<string>('');

  // Track scroll for showing "Scroll to top" button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Refresh data handler
  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Reset to first page and reload
      await resetFilters();

      // Scroll to top after a short delay
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to load next batch of data
  const handleLoadMore = useCallback(async () => {
    if (hasNextPage && !isLoading) {
      await loadMore();
    }
  }, [hasNextPage, isLoading, loadMore]);

  const handleToggleSave = (cardId: number) => {
    handleToggleFavorite(cardId);
  };

  // Function to open investor modal
  const handleOpenInvestorModal = useCallback((participantId: string, participantSlug: string) => {
    setInvestorModalSlug(participantSlug);
    setIsInvestorModalOpen(true);
  }, []);

  // Function to close investor modal
  const handleCloseInvestorModal = useCallback(() => {
    setIsInvestorModalOpen(false);
    setInvestorModalSlug('');
  }, []);

  // Fetch assignments when status or filterType changes
  useEffect(() => {
    const params: Record<string, any> = {
      page: 1,
      filterType: filterType
    };

    // Explicitly set status - if 'all', don't include it (will get all statuses)
    // If specific status, include it
    if (selectedStatus !== 'all') {
      params.status = selectedStatus;
    } else {
      // Explicitly clear status when 'all' is selected
      params.status = undefined;
    }

    console.log('[Assignments] Tab or filter changed, fetching with params:', {
      params,
      filterType,
      filterTypeType: typeof filterType,
      'is MY_ASSIGNMENTS': filterType === AssignmentFilterType.MY_ASSIGNMENTS,
      'is ALL': filterType === AssignmentFilterType.ALL,
      selectedStatus,
      userId: user?.id
    });
    fetchAssignments(params, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, filterType]);

  // Cards are filtered by server, but add client-side filter as safety check
  // Create a map of card ID to assignment status and assigned members for efficient lookup
  const assignmentStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((assignment) => {
      if (assignment.signalCard?.id) {
        map.set(assignment.signalCard.id, assignment.status);
      }
    });
    return map;
  }, [assignments]);

  // Create a map of card ID to assigned members for preview display
  const assignedMembersMap = useMemo(() => {
    const map = new Map<string, Array<{
      id: number | string;
      username: string;
      first_name?: string;
      last_name?: string;
      avatar?: string;
      assigned_by?: {
        id: number | string;
        username: string;
        first_name?: string;
        last_name?: string;
        avatar?: string;
      };
      assigned_at?: string;
    }>>();
    assignments.forEach((assignment) => {
      if (assignment.signalCard?.id && assignment.assignedMembers && assignment.assignedMembers.length > 0) {
        const members = assignment.assignedMembers.map((am) => ({
          id: am.user.id,
          username: am.user.username,
          first_name: am.user.firstName,
          last_name: am.user.lastName,
          avatar: am.user.avatar,
          assigned_by: am.assignedBy ? {
            id: am.assignedBy.id,
            username: am.assignedBy.username,
            first_name: am.assignedBy.firstName,
            last_name: am.assignedBy.lastName,
            avatar: am.assignedBy.avatar
          } : undefined,
          assigned_at: am.assignedAt
        }));
        map.set(assignment.signalCard.id, members);
      }
    });
    return map;
  }, [assignments]);
  
  // Map UI status to GraphQL status for comparison
  const statusMap: Record<string, string> = {
    all: '',
    review: 'REVIEW',
    reaching_out: 'REACHING_OUT',
    connected: 'CONNECTED',
    not_a_fit: 'NOT_A_FIT'
  };
  
  const expectedStatus = statusMap[selectedStatus];
  
  // Log filterType and currentFilters for debugging
  useEffect(() => {
    console.log('[Assignments] Filter state changed:', {
      filterType,
      selectedStatus,
      currentFilters,
      assignmentsCount: assignments.length,
      cardsCount: cards.length,
      userId: user?.id
    });
  }, [filterType, selectedStatus, currentFilters, assignments.length, cards.length, user?.id]);
  
  // Filter cards by assignment status
  // Note: filterType (MY_ASSIGNMENTS/ALL) is handled by server via GraphQL query
  // Client-side filtering is only for status (as safety check)
  const filteredCards = useMemo(() => {
    let result = cards;
    
    // Filter by status if specific status is selected
    // Server should already filter by status, but we add client-side check as safety
    if (selectedStatus !== 'all') {
      result = result.filter((card) => {
        const assignmentStatus = assignmentStatusMap.get(card.id);
        return assignmentStatus === expectedStatus;
      });
    }
    
    // filterType filtering is done on server side via GraphQL query parameter
    // No need for client-side filtering by filterType
    
    console.log('[Assignments] Filtered cards:', {
      filterType,
      selectedStatus,
      totalCards: cards.length,
      filteredCards: result.length,
      assignmentStatusMapSize: assignmentStatusMap.size,
      userId: user?.id
    });
    
    return result;
  }, [cards, assignmentStatusMap, selectedStatus, expectedStatus, filterType, user?.id]);

  return (
    <div className='w-full px-4 py-2 sm:px-6'>
      {/* Header - sticky */}
      <div className='bg-background sticky top-0 z-10 pt-4 pb-4 w-full'>
        <div className='flex items-center justify-between w-full'>
          <h1 className='text-2xl font-bold tracking-tight'>
            CRM
          </h1>
          <Button
            variant='ghost'
            size='icon'
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <IconRefresh
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        {/* Status Filter Tabs */}
        <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as typeof selectedStatus)}>
          <TabsList className='gap-2'>
            <TabsTrigger value='all' className='px-4'>Все</TabsTrigger>
            <TabsTrigger value='review' className='px-4'>На рассмотрении</TabsTrigger>
            <TabsTrigger value='reaching_out' className='px-4'>Связь устанавливается</TabsTrigger>
            <TabsTrigger value='connected' className='px-4'>Связано</TabsTrigger>
            <TabsTrigger value='not_a_fit' className='px-4 opacity-60 text-zinc-500 data-[state=active]:opacity-100 data-[state=active]:text-foreground'>Не подходит</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filter Type Toggle */}
        <div className='bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] gap-2'>
          <Toggle
            pressed={filterType === AssignmentFilterType.MY_ASSIGNMENTS}
            onPressedChange={(pressed) => {
              if (pressed) {
                setFilterType(AssignmentFilterType.MY_ASSIGNMENTS);
              }
            }}
            aria-label='Мои назначения'
            className='data-[state=on]:bg-background dark:data-[state=on]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=on]:border-input dark:data-[state=on]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-4 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:shadow-sm cursor-pointer'
          >
            Мои
          </Toggle>
          <Toggle
            pressed={filterType === AssignmentFilterType.ALL}
            onPressedChange={(pressed) => {
              if (pressed) {
                setFilterType(AssignmentFilterType.ALL);
              }
            }}
            aria-label='Все группы'
            className='data-[state=on]:bg-background dark:data-[state=on]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=on]:border-input dark:data-[state=on]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-4 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:shadow-sm cursor-pointer'
          >
            Все
          </Toggle>
        </div>
      </div>

      {/* Card list */}
      <div className='py-4 w-full'>
        {/* Show loading skeletons when initially loading and no cards */}
        {isLoading && filteredCards.length === 0 ? (
          <div className='space-y-4 w-full'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='enhanced-pulse w-full'>
                <div className='flex gap-4 rounded-lg border p-4 transition-transform duration-200 w-full bg-card hover:bg-accent/40'>
                  <div className='bg-muted h-16 w-16 flex-shrink-0 rounded-lg'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='bg-muted h-4 w-3/4 rounded'></div>
                    <div className='bg-muted h-3 w-1/2 rounded'></div>
                    <div className='flex gap-2'>
                      <div className='bg-muted h-5 w-16 rounded-full'></div>
                      <div className='bg-muted h-5 w-20 rounded-full'></div>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <AvatarSkeleton count={3} size='sm' spacing='separate' />
                    <AvatarSkeleton count={4} size='lg' spacing='loose' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CardsList
            cards={filteredCards.map((card) => {
              // Get assigned members and assignment status for this card
              const assignedMembers = assignedMembersMap.get(card.id);
              const assignmentStatus = assignmentStatusMap.get(card.id);
              
              // Debug: Log open_to_intro status for CRM cards
              if (card.openToIntro !== undefined) {
                console.log('[CRM] Card with openToIntro:', {
                  cardId: card.id,
                  cardName: card.name,
                  openToIntro: card.openToIntro,
                  openToIntroType: typeof card.openToIntro
                });
              }
              
              return {
                ...card,
                id: parseInt(card.id) || 0,
                slug: card.slug || undefined, // Ensure slug is explicitly mapped, handle null
                categories:
                  card.categories?.map((cat) => ({
                    ...cat,
                    id: parseInt(cat.id) || 0
                  })) || [],
                categories_list:
                  card.categories?.map((cat) => ({
                    ...cat,
                    id: parseInt(cat.id) || 0
                  })) || [],
                // Map GraphQL SignalCard fields to CardPreview format
                title: card.name,
                image_url: card.imageUrl,
                is_liked: card.userData?.isFavorited ?? false,
                is_heart_liked: card.userData?.isFavorited ?? false,
                has_note: !!card.userData?.userNote?.noteText,
                is_assigned_to_group: card.userData?.isAssignedToGroup ?? false,
                open_to_intro: Boolean(card.openToIntro),
                // Add assignment status for preview display
                assignment_status: assignmentStatus,
                // Add assigned members for preview display (rectangular avatars)
                assigned_members: assignedMembers || undefined
              };
            })}
            isLoading={false}
            variant='notes'
            emptyMessage='No cards found'
            onToggleSave={handleToggleSave}
            onOpenInvestorModal={handleOpenInvestorModal}
            hideDeleteButton={true}
          />
        )}

        {/* Infinite scroll component */}
        {filteredCards.length > 0 && !isLoading && (
          <InfiniteScroll
            hasMore={hasNextPage}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            currentCount={filteredCards.length}
            onLoadMore={handleLoadMore}
            completedText={`Все карточки загружены`}
          />
        )}
      </div>

      {/* Scroll to top button */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          size='icon'
          variant='default'
          className='bg-primary hover:bg-primary/90 fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full shadow-lg hover:scale-110'
          aria-label='Прокрутить наверх'
        >
          <IconArrowUp className='text-primary-foreground h-5 w-5' />
        </Button>
      )}

      {/* Investor Detail Modal */}
      {investorModalSlug && (
        <InvestorDetailModal
          isOpen={isInvestorModalOpen}
          onClose={handleCloseInvestorModal}
          slug={investorModalSlug}
        />
      )}
    </div>
  );
}

// Main component that provides the GraphQL context
export function AssignmentsPage() {
  return (
    <GroupAssignmentsProvider>
      <AssignmentsContent />
    </GroupAssignmentsProvider>
  );
}

