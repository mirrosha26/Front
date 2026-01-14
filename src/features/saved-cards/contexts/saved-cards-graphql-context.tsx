'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useRef,
  startTransition
} from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCardOperations } from '@/features/shared/contexts/card-operations-context';
import { filterOutLinkedInCards } from '@/features/shared/utils/linkedin-detection';
import { InvestorsGraphQLProvider } from '@/features/investors/contexts/investors-graphql-context';
import { GET_FOLDER_CARDS_QUERY } from '@/lib/graphql/queries';
import {
  FolderCardsVariables,
  FolderCardsResponse,
  SignalCard
} from '@/lib/graphql/types';

// Types for context state
interface SavedCardsState {
  savedCards: SignalCard[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  currentFilters: any;
  folderKey: string;
  // New state for optimistic updates
  optimisticallyHiddenCards: Set<string>;
  isHidingCard: Record<string, boolean>;
}

// Types for context actions
interface SavedCardsActions {
  fetchSavedCards: (
    params?: Record<string, any>,
    appendMode?: boolean
  ) => Promise<void>;
  applyFilters: (filters: Record<string, any>) => Promise<void>;
  handleToggleFavorite: (cardId: number) => Promise<void>;
  handleDelete: (cardId: number) => Promise<void>;
  handleRemoveCard: (cardId: number) => Promise<void>;
  loadMore: () => Promise<void>;
  setCurrentFilters: (filters: any) => void;
  setFolderKey: (folderKey: string) => void;
}

// Context type
type SavedCardsContextType = SavedCardsState & SavedCardsActions;

// Create context
const SavedCardsContext = createContext<SavedCardsContextType | undefined>(
  undefined
);

// Hook to use context
export function useSavedCards() {
  const context = useContext(SavedCardsContext);
  if (!context) {
    throw new Error('useSavedCards must be used within SavedCardsProvider');
  }
  return context;
}

// Provider component
export function SavedCardsGraphQLProvider({
  children,
  initialFolderKey = 'default'
}: {
  children: ReactNode;
  initialFolderKey?: string;
}) {
  // State
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({
    page: 1,
    page_size: 20
  });
  const [savedCards, setSavedCards] = useState<SignalCard[]>([]);
  const [folderKey, setFolderKey] = useState(initialFolderKey);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isProcessingData, setIsProcessingData] = useState(false);
  // New state for optimistic updates
  const [optimisticallyHiddenCards, setOptimisticallyHiddenCards] = useState<Set<string>>(new Set());
  const [isHidingCard, setIsHidingCard] = useState<Record<string, boolean>>({});

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
              // Map favorite status - cards in saved folders should be liked by default
              is_liked: card.userData?.isFavorited ?? true, // Default to true for saved cards
              is_heart_liked: card.userData?.isFavorited ?? true, // Default to true for saved cards
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

            // Filter out cards with LinkedIn data
            const filteredCards = filterOutLinkedInCards(newCards);

            if (isPaginating) {
              // Append to existing cards
              setSavedCards((prev) => [...prev, ...filteredCards] as unknown as SignalCard[]);
            } else {
              // Replace all cards
              setSavedCards(filteredCards as unknown as SignalCard[]);
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
            toast.error('Не удалось загрузить сохраненные карточки. Попробуйте еще раз.');
          }
        }
      }
    );

  // Use REST API for operations to match the existing pattern
  const { toggleFavorite, deleteCard, removeFromFavorites } =
    useCardOperations();

  // Derived state from GraphQL response
  const error = gqlError?.message || null;
  const [responseData, setResponseData] = useState<any>(null);
  const totalCount = responseData?.totalCount || 0;
  const currentPage = responseData?.currentPage || 1;
  const totalPages = responseData?.totalPages || 1;
  const hasNextPage = responseData?.hasNextPage || false;

  // Computed loading state - true if GraphQL is loading OR we're processing data
  const computedIsLoading = isLoading || isProcessingData;

  // Filter out optimistically hidden cards
  const visibleSavedCards = savedCards.filter(card => !optimisticallyHiddenCards.has(card.id));

  // Fetch saved cards function
  const fetchSavedCards = useCallback(
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

        // Execute GraphQL query
        await getFolderCards({
          variables: {
            folderKey: params.folder_key || folderKey,
            page: finalParams.page || 1,
            pageSize: finalParams.page_size || 20,
            filters: Object.keys(filters).length > 0 ? filters : undefined
          }
        });
      } catch (error) {
        console.error('Error fetching saved cards:', error);
        toast.error('Не удалось загрузить сохраненные карточки. Попробуйте еще раз.');
        setIsProcessingData(false); // Reset processing state on error
      }
    },
    [currentFilters, folderKey, getFolderCards]
  );

  // Apply filters
  const applyFilters = useCallback(
    async (filters: Record<string, any>) => {
      await fetchSavedCards({ ...filters, page: 1 }, false);
    },
    [fetchSavedCards]
  );

  // Load more cards
  const loadMore = useCallback(async () => {
    if (hasNextPage && !computedIsLoading) {
      await fetchSavedCards({ page: currentPage + 1 }, true);
    }
  }, [hasNextPage, computedIsLoading, currentPage, fetchSavedCards]);

  // Handle toggle favorite
  const handleToggleFavorite = useCallback(
    async (cardId: number) => {
      try {
        // Find the card to get its current favorite status
        const card = savedCards.find((c) => c.id === cardId.toString());
        const currentStatus = card?.userData?.isFavorited ?? false;

        await toggleFavorite(cardId, currentStatus);
        // Refresh the current page
        await fetchSavedCards({}, false);
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Не удалось изменить статус избранного. Попробуйте еще раз.');
      }
    },
    [savedCards, toggleFavorite, fetchSavedCards]
  );

  // Handle delete card with optimistic updates
  const handleDelete = useCallback(
    async (cardId: number) => {
      const cardIdStr = cardId.toString();
      
      // Immediate UI update for instant feedback - remove card immediately
      setSavedCards(prev => prev.filter(card => card.id !== cardIdStr));
      setOptimisticallyHiddenCards(prev => new Set(Array.from(prev).concat(cardIdStr)));
      setIsHidingCard(prev => ({ ...prev, [cardIdStr]: true }));
      
      // Update total count immediately
      setResponseData((prev: any) =>
        prev
          ? {
              ...prev,
              totalCount: Math.max(0, prev.totalCount - 1)
            }
          : null
      );
      
      try {
        const success = await deleteCard(cardId);
        
        if (success) {
          // Clean up optimistic state
          setOptimisticallyHiddenCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(cardIdStr);
            return newSet;
          });
          setIsHidingCard(prev => ({ ...prev, [cardIdStr]: false }));
          toast.success('Карточка успешно скрыта');
        } else {
          // Revert optimistic update on failure
          setSavedCards(prev => [...prev, savedCards.find(card => card.id === cardIdStr)!].filter(Boolean));
          setResponseData((prev: any) =>
            prev
              ? {
                  ...prev,
                  totalCount: prev.totalCount + 1
                }
              : null
          );
          setOptimisticallyHiddenCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(cardIdStr);
            return newSet;
          });
          setIsHidingCard(prev => ({ ...prev, [cardIdStr]: false }));
          toast.error('Не удалось скрыть карточку. Попробуйте еще раз.');
        }
      } catch (error) {
        console.error('Error hiding card:', error);
        // Revert optimistic update on error
        setSavedCards(prev => [...prev, savedCards.find(card => card.id === cardIdStr)!].filter(Boolean));
        setResponseData((prev: any) =>
          prev
            ? {
                ...prev,
                totalCount: prev.totalCount + 1
              }
            : null
        );
        setOptimisticallyHiddenCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardIdStr);
          return newSet;
        });
        setIsHidingCard(prev => ({ ...prev, [cardIdStr]: false }));
        toast.error('Не удалось скрыть карточку. Попробуйте еще раз.');
      }
    },
    [deleteCard, savedCards]
  );

  // Handle remove card from folder with optimistic updates
  const handleRemoveCard = useCallback(
    async (cardId: number) => {
      const cardIdStr = cardId.toString();
      
      // Find card in list
      const card = savedCards.find((c) => c.id === cardIdStr);
      if (!card) return;

      // Immediate UI update for instant feedback - remove card immediately
      setSavedCards(prev => prev.filter(c => c.id !== cardIdStr));
      setOptimisticallyHiddenCards(prev => new Set(Array.from(prev).concat(cardIdStr)));
      setIsHidingCard(prev => ({ ...prev, [cardIdStr]: true }));

      try {
        const success = await removeFromFavorites(cardId);
        
        if (success) {
          // Clean up optimistic state
          setOptimisticallyHiddenCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(cardIdStr);
            return newSet;
          });
          setIsHidingCard(prev => ({ ...prev, [cardIdStr]: false }));
          const cardName = card.name || 'Card';
          toast.success(`"${cardName}" removed from folder`);
        } else {
          // Revert optimistic update on failure
          setSavedCards(prev => [...prev, card]);
          setOptimisticallyHiddenCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(cardIdStr);
            return newSet;
          });
          setIsHidingCard(prev => ({ ...prev, [cardIdStr]: false }));
          toast.error('Не удалось удалить карточку из папки. Попробуйте еще раз.');
        }
      } catch (error) {
        console.error('Error removing card from folder:', error);
        // Revert optimistic update on error
        setSavedCards(prev => [...prev, card]);
        setOptimisticallyHiddenCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardIdStr);
          return newSet;
        });
        setIsHidingCard(prev => ({ ...prev, [cardIdStr]: false }));
        toast.error('Не удалось удалить карточку из папки. Попробуйте еще раз.');
      }
    },
    [savedCards, removeFromFavorites]
  );

  // Load initial data on mount
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchSavedCards({}, false);
      initialFetchDone.current = true;
    }
  }, [fetchSavedCards]);

  // Listen for folder key changes
  useEffect(() => {
    if (folderKey !== initialFolderKey) {
      setCurrentFilters((prev) => ({
        ...prev,
        folder_key: folderKey,
        page: 1
      }));
      fetchSavedCards({ folder_key: folderKey, page: 1 }, false);
    }
  }, [folderKey, initialFolderKey]); // Removed fetchSavedCards from dependencies to prevent infinite loop

  // Handle card removal events
  useEffect(() => {
    const handleCardRemovedFromFolder = (event: CustomEvent) => {
      const { cardId, folderId, folderKey: eventFolderKey } = event.detail;

      // Check if current folder matches the one card was removed from
      if (eventFolderKey === folderKey || folderId.toString() === folderKey) {
        // Remove card from list
        setSavedCards((prev) => prev.filter((c) => c.id !== cardId.toString()));

        // Find card for notification
        const card = savedCards.find((c) => c.id === cardId.toString());
        const cardName = card ? card.name || 'Card' : 'Card';

        toast.success(`"${cardName}" removed from current folder`);
      }
    };

    window.addEventListener(
      'card-removed-from-folder',
      handleCardRemovedFromFolder as EventListener
    );

    return () => {
      window.removeEventListener(
        'card-removed-from-folder',
        handleCardRemovedFromFolder as EventListener
      );
    };
  }, [savedCards, folderKey]);

  const contextValue: SavedCardsContextType = {
    // State
    savedCards: visibleSavedCards, // Use filtered cards
    isLoading: computedIsLoading, // Use computed loading state
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    folderKey,
    // New state for optimistic updates
    optimisticallyHiddenCards,
    isHidingCard,

    // Actions
    fetchSavedCards,
    applyFilters,
    handleToggleFavorite,
    handleDelete,
    handleRemoveCard,
    loadMore,
    setCurrentFilters,
    setFolderKey
  };

  return (
    <SavedCardsContext.Provider value={contextValue}>
      <InvestorsGraphQLProvider>{children}</InvestorsGraphQLProvider>
    </SavedCardsContext.Provider>
  );
}
