'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useRef
} from 'react';
import { useLazyQuery } from '@apollo/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCardOperations } from '@/features/shared/contexts/card-operations-context';
import { InvestorsGraphQLProvider } from '@/features/investors/contexts/investors-graphql-context';
import { GET_FOLDER_CARDS_QUERY } from '@/lib/graphql/queries';
import {
  FolderCardsVariables,
  FolderCardsResponse,
  SignalCard
} from '@/lib/graphql/types';

// Types for context state
interface DeletedCardsState {
  deletedCards: SignalCard[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  currentFilters: any;
}

// Types for context actions
interface DeletedCardsActions {
  fetchDeletedCards: (
    params?: Record<string, any>,
    appendMode?: boolean
  ) => Promise<void>;
  applyFilters: (filters: Record<string, any>) => Promise<void>;
  handleDelete: (cardId: number) => Promise<void>;
  handleRestoreCard: (cardId: number) => Promise<void>;
  loadMore: () => Promise<void>;
  setCurrentFilters: (filters: any) => void;
}

// Context type
type DeletedCardsContextType = DeletedCardsState & DeletedCardsActions;

// Create context
const DeletedCardsContext = createContext<DeletedCardsContextType | undefined>(
  undefined
);

// Hook to use context
export function useDeletedCards() {
  const context = useContext(DeletedCardsContext);
  if (!context) {
    throw new Error('useDeletedCards must be used within DeletedCardsProvider');
  }
  return context;
}

// Provider component
export function DeletedCardsGraphQLProvider({
  children
}: {
  children: ReactNode;
}) {
  // State
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({
    page: 1,
    page_size: 20
  });
  const [deletedCards, setDeletedCards] = useState<SignalCard[]>([]);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isProcessingData, setIsProcessingData] = useState(false);

  // Track if initial fetch was made
  const initialFetchDone = useRef(false);

  const router = useRouter();

  // Use lazy query instead of regular query to have more control
  const [getFolderCards, { loading: isLoading, error: gqlError }] =
    useLazyQuery<FolderCardsResponse, FolderCardsVariables>(
      GET_FOLDER_CARDS_QUERY,
      {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
        onCompleted: (data) => {
          if (data?.signalCards?.nodes) {
            // Update response data for pagination info
            setResponseData(data.signalCards);

            const newCards = data.signalCards.nodes.map((card: any) => ({
              ...card,
              // Map fields for backward compatibility
              slug: card.slug || undefined, // Ensure slug is explicitly mapped, handle null
              title: card.name || card.title,
              image_url: card.imageUrl,
              round_status: card.roundStatus,
              last_round: card.lastRound,
              categories_list: card.categories,
              social_links: card.socialLinks, // Map socialLinks to social_links for backward compatibility
              // Map favorite status - deleted cards should show their actual favorite status
              is_liked: card.userData?.isFavorited ?? false,
              is_heart_liked: card.userData?.isFavorited ?? false,
              has_note: card.userData?.userNote?.noteText ? true : false,
              is_assigned_to_group: card.userData?.isAssignedToGroup ?? false,
              open_to_intro: Boolean(card.openToIntro),
              // Include signals data
              signals: card.signals || [],
              // Legacy participants data for backward compatibility
              participants_list: card.signals
                ? card.signals.reduce((acc: any[], signal: any) => {
                    if (
                      signal.participant &&
                      !acc.some((p) => p.name === signal.participant.name)
                    ) {
                      acc.push({
                        name: signal.participant.name,
                        image: signal.participant.imageUrl,
                        is_saved: signal.participant.isSaved,
                        is_private: signal.participant.isPrivate || false
                      });
                    }
                    if (
                      signal.associatedParticipant &&
                      !acc.some(
                        (p) => p.name === signal.associatedParticipant.name
                      )
                    ) {
                      acc.push({
                        name: signal.associatedParticipant.name,
                        image: signal.associatedParticipant.imageUrl,
                        is_saved: signal.associatedParticipant.isSaved,
                        is_private:
                          signal.associatedParticipant.isPrivate || false
                      });
                    }
                    return acc;
                  }, [])
                : []
            }));

            if (isPaginating) {
              // Append to existing cards
              setDeletedCards((prev) => [...prev, ...newCards]);
            } else {
              // Replace all cards
              setDeletedCards(newCards);
            }

            setIsPaginating(false);
            setIsProcessingData(false); // Mark data processing as complete
          }
        },
        onError: (error) => {
          console.error('GraphQL error:', error);
          setIsPaginating(false);

          // Check if it's an authentication error
          if (
            error.message?.includes('401') ||
            error.message?.includes('Unauthorized')
          ) {
            toast.error('Ваша сессия истекла. Пожалуйста, войдите снова.');
            router.push('/auth/sign-in');
          } else {
            toast.error('Не удалось загрузить удаленные карточки. Попробуйте еще раз.');
          }
        }
      }
    );

  // Use REST API for operations to match the existing pattern
  const { toggleFavorite, deleteCard, restoreCard } = useCardOperations();

  // Derived state from GraphQL response
  const error = gqlError?.message || null;
  const [responseData, setResponseData] = useState<any>(null);
  const totalCount = responseData?.totalCount || 0;
  const currentPage = responseData?.currentPage || 1;
  const totalPages = responseData?.totalPages || 1;
  const hasNextPage = responseData?.hasNextPage || false;

  // Computed loading state - true if GraphQL is loading OR we're processing data
  const computedIsLoading = isLoading || isProcessingData;

  // Fetch deleted cards function
  const fetchDeletedCards = useCallback(
    async (params: Record<string, any> = {}, appendMode = false) => {
      try {
        const finalParams = { ...currentFilters, ...params };

        // Update current filters
        setCurrentFilters(finalParams);

        // Set pagination mode
        setIsPaginating(appendMode);

        // Mark that we're processing data
        if (!appendMode) {
          setIsProcessingData(true);
        }

        // Build filters for GraphQL
        const filters: any = {};

        // Add search filter if provided
        if (finalParams.search) {
          filters.search = finalParams.search;
        }

        // Add other filters as needed
        if (finalParams.categories) {
          filters.categories = finalParams.categories;
        }
        if (finalParams.participants) {
          filters.participants = finalParams.participants;
        }
        if (finalParams.stages) {
          filters.stages = finalParams.stages;
        }
        if (finalParams.roundStatuses) {
          filters.roundStatuses = finalParams.roundStatuses;
        }
        if (finalParams.featured !== undefined) {
          filters.featured = finalParams.featured;
        }
        if (finalParams.trending !== undefined) {
          filters.trending = finalParams.trending;
        }
        if (finalParams.isOpen !== undefined) {
          filters.isOpen = finalParams.isOpen;
        }
        if (finalParams.new !== undefined) {
          filters.new = finalParams.new;
        }
        if (finalParams.hideLiked !== undefined) {
          filters.hideLiked = finalParams.hideLiked;
        }
        if (finalParams.startDate) {
          filters.startDate = finalParams.startDate;
        }
        if (finalParams.endDate) {
          filters.endDate = finalParams.endDate;
        }
        if (finalParams.minSignals !== undefined) {
          filters.minSignals = finalParams.minSignals;
        }
        if (finalParams.maxSignals !== undefined) {
          filters.maxSignals = finalParams.maxSignals;
        }

        // Execute GraphQL query with "remote" folderKey for deleted cards
        await getFolderCards({
          variables: {
            folderKey: 'remote', // Always use "remote" for deleted cards
            page: finalParams.page || 1,
            pageSize: finalParams.page_size || 20,
            filters: Object.keys(filters).length > 0 ? filters : undefined
          }
        });
      } catch (error) {
        console.error('Error fetching deleted cards:', error);
        toast.error('Не удалось загрузить удаленные карточки. Попробуйте еще раз.');
        setIsProcessingData(false); // Reset processing state on error
      }
    },
    [currentFilters, getFolderCards]
  );

  // Apply filters
  const applyFilters = useCallback(
    async (filters: Record<string, any>) => {
      await fetchDeletedCards({ ...filters, page: 1 }, false);
    },
    [fetchDeletedCards]
  );

  // Load more cards
  const loadMore = useCallback(async () => {
    if (hasNextPage && !computedIsLoading) {
      await fetchDeletedCards({ page: currentPage + 1 }, true);
    }
  }, [hasNextPage, computedIsLoading, currentPage, fetchDeletedCards]);

  // Handle toggle favorite (this also restores the card from deleted)
  const handleToggleFavorite = useCallback(
    async (cardId: number) => {
      // Find the card to get its current favorite status
      const card = deletedCards.find((c) => c.id === cardId.toString());
      if (!card) return;

      const currentStatus = card.userData?.isFavorited ?? false;
      const cardName = card.name || 'Card';

      // Optimistically remove card from list immediately (since favorite = restore)
      setDeletedCards((prev) => prev.filter((c) => c.id !== cardId.toString()));
      setResponseData((prev: any) =>
        prev ? { ...prev, totalCount: Math.max(0, prev.totalCount - 1) } : null
      );

      try {
        const success = await toggleFavorite(cardId, currentStatus);

        if (success) {
          // Show success message with undo option
          toast(`"${cardName}" добавлено в избранное и восстановлено`, {
            action: {
              label: 'Отменить',
              onClick: async () => {
                // Put the card back in deleted state
                const undoSuccess = await deleteCard(cardId);
                if (undoSuccess) {
                  // Reload the deleted cards to get the card back in the list
                  await fetchDeletedCards({}, false);
                  toast.success(`"${cardName}" возвращено в удаленные`);
                } else {
                  toast.error(`Не удалось отменить "${cardName}"`);
                }
              }
            }
          });
        } else {
          // Operation failed - restore card to list
          setDeletedCards((prev) => [card, ...prev]);
          setResponseData((prev: any) =>
            prev ? { ...prev, totalCount: prev.totalCount + 1 } : null
          );
          toast.error('Не удалось добавить в избранное. Попробуйте еще раз.');
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
        // Operation failed - restore card to list
        setDeletedCards((prev) => [card, ...prev]);
        setResponseData((prev: any) =>
          prev ? { ...prev, totalCount: prev.totalCount + 1 } : null
        );
        toast.error('Не удалось добавить в избранное. Попробуйте еще раз.');
      }
    },
    [deletedCards, toggleFavorite, fetchDeletedCards, deleteCard]
  );

  // Handle delete card (permanently delete)
  const handleDelete = useCallback(
    async (cardId: number) => {
      try {
        await deleteCard(cardId);
        // Remove from local state
        setDeletedCards((prev) =>
          prev.filter((card) => card.id !== cardId.toString())
        );
        // Update response data to reflect the new count
        setResponseData((prev: any) =>
          prev
            ? {
                ...prev,
                totalCount: Math.max(0, prev.totalCount - 1)
              }
            : null
        );
        toast.success('Карточка окончательно удалена');
      } catch (error) {
        console.error('Error deleting card:', error);
        toast.error('Не удалось удалить карточку. Попробуйте еще раз.');
      }
    },
    [deleteCard]
  );

  // Handle restore card (move back to active)
  const handleRestoreCard = useCallback(
    async (cardId: number) => {
      try {
        // Find card in list
        const card = deletedCards.find((c) => c.id === cardId.toString());
        if (!card) return;

        console.log(`[DeletedCardsGraphQLContext] Restoring card ${cardId}`);

        // Optimistically remove card from list
        setDeletedCards((prev) =>
          prev.filter((c) => c.id !== cardId.toString())
        );
        setResponseData((prev: any) =>
          prev
            ? { ...prev, totalCount: Math.max(0, prev.totalCount - 1) }
            : null
        );

        const cardName = card.name || 'Card';

        // Show toast with undo option
        toast(`"${cardName}" восстановлено`, {
          action: {
            label: 'Отменить',
            onClick: async () => {
              // If user clicked "Undo", return card to list
              setDeletedCards((prev) => [card, ...prev]);
              setResponseData((prev: any) =>
                prev ? { ...prev, totalCount: prev.totalCount + 1 } : null
              );

              // And cancel restoration on server
              const success = await deleteCard(cardId);
              if (!success) {
                // If failed to cancel restoration, refresh the list
                await fetchDeletedCards({}, false);
                toast.error(`Не удалось отменить "${cardName}"`);
              }
            }
          }
        });

        // Send request to server
        const success = await restoreCard(cardId);

        // If operation failed, return card to list
        if (!success) {
          setDeletedCards((prev) => [card, ...prev]);
          setResponseData((prev: any) =>
            prev ? { ...prev, totalCount: prev.totalCount + 1 } : null
          );
          toast.error(`Не удалось восстановить "${cardName}"`);
        }
      } catch (error) {
        console.error('Error restoring card:', error);
        toast.error('Не удалось восстановить карточку. Попробуйте еще раз.');
      }
    },
    [deletedCards, restoreCard, deleteCard, fetchDeletedCards]
  );

  // Load initial data on mount
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchDeletedCards({}, false);
      initialFetchDone.current = true;
    }
  }, [fetchDeletedCards]);

  const contextValue: DeletedCardsContextType = {
    // State
    deletedCards,
    isLoading: computedIsLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,

    // Actions
    fetchDeletedCards,
    applyFilters,
    handleDelete,
    handleRestoreCard,
    loadMore,
    setCurrentFilters
  };

  return (
    <DeletedCardsContext.Provider value={contextValue}>
      <InvestorsGraphQLProvider>{children}</InvestorsGraphQLProvider>
    </DeletedCardsContext.Provider>
  );
}
