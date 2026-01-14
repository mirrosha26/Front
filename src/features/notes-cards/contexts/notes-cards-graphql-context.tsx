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
import { GET_CARDS_WITH_NOTES_QUERY } from '@/lib/graphql/queries';
import {
  NotesCardsVariables,
  NotesCardsResponse,
  SignalCard
} from '@/lib/graphql/types';

// Types for context state
interface NotesCardsState {
  notesCards: SignalCard[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  currentFilters: any;
}

// Types for context actions
interface NotesCardsActions {
  fetchNotesCards: (
    params?: Record<string, any>,
    appendMode?: boolean
  ) => Promise<void>;
  applyFilters: (filters: Record<string, any>) => Promise<void>;
  handleDeleteNote: (cardId: number) => Promise<void>;
  handleUpdateNote: (cardId: number, noteText: string) => Promise<void>;
  handleToggleFavorite: (cardId: number) => Promise<void>;
  loadMore: () => Promise<void>;
  resetFilters: () => Promise<void>;
  setCurrentFilters: (filters: any) => void;
}

// Context type
type NotesCardsContextType = NotesCardsState & NotesCardsActions;

// Create context
const NotesCardsContext = createContext<NotesCardsContextType | undefined>(
  undefined
);

// Hook to use context
export function useNotesCards() {
  const context = useContext(NotesCardsContext);
  if (!context) {
    throw new Error(
      'useNotesCards must be used within NotesCardsGraphQLProvider'
    );
  }
  return context;
}

// Provider component
export function NotesCardsGraphQLProvider({
  children
}: {
  children: ReactNode;
}) {
  // State
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({
    page: 1,
    page_size: 20
  });
  const [notesCards, setNotesCards] = useState<SignalCard[]>([]);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isProcessingData, setIsProcessingData] = useState(false);

  // Track if initial fetch was made
  const initialFetchDone = useRef(false);

  const router = useRouter();

  // Use lazy query for notes cards
  const [getNotesCards, { loading: isLoading, error: gqlError }] = useLazyQuery<
    NotesCardsResponse,
    NotesCardsVariables
  >(GET_CARDS_WITH_NOTES_QUERY, {
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
          // Map favorite status
          is_liked: card.userData?.isFavorited ?? false,
          is_heart_liked: card.userData?.isFavorited ?? false,
          has_note: card.userData?.userNote?.noteText ? true : false,
          is_assigned_to_group: card.userData?.isAssignedToGroup ?? false,
          note_text: card.userData?.userNote?.noteText || '',
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
                  !acc.some((p) => p.name === signal.associatedParticipant.name)
                ) {
                  acc.push({
                    name: signal.associatedParticipant.name,
                    image: signal.associatedParticipant.imageUrl,
                    is_saved: signal.associatedParticipant.isSaved,
                    is_private: signal.associatedParticipant.isPrivate || false
                  });
                }
                return acc;
              }, [])
            : []
        }));

        if (isPaginating) {
          // Append to existing cards
          setNotesCards((prev) => [...prev, ...newCards]);
        } else {
          // Replace all cards
          setNotesCards(newCards);
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
        toast.error('Не удалось загрузить карточки с заметками. Попробуйте еще раз.');
      }
    }
  });

  // Use REST API for operations to match the existing pattern
  const { toggleFavorite, deleteNote, updateNote } = useCardOperations();

  // Derived state from GraphQL response
  const error = gqlError?.message || null;
  const [responseData, setResponseData] = useState<any>(null);
  const totalCount = responseData?.totalCount || 0;
  const currentPage = responseData?.currentPage || 1;
  const totalPages = responseData?.totalPages || 1;
  const hasNextPage = responseData?.hasNextPage || false;

  // Computed loading state - true if GraphQL is loading OR we're processing data
  const computedIsLoading = isLoading || isProcessingData;

  // Fetch notes cards function
  const fetchNotesCards = useCallback(
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

        // Execute GraphQL query with cardType: NOTES
        await getNotesCards({
          variables: {
            page: finalParams.page || 1,
            pageSize: finalParams.page_size || 20,
            filters: Object.keys(filters).length > 0 ? filters : undefined
          }
        });
      } catch (error) {
        console.error('Error fetching notes cards:', error);
        toast.error('Не удалось загрузить карточки с заметками. Попробуйте еще раз.');
        setIsProcessingData(false); // Reset processing state on error
      }
    },
    [currentFilters, getNotesCards]
  );

  // Apply filters
  const applyFilters = useCallback(
    async (filters: Record<string, any>) => {
      await fetchNotesCards({ ...filters, page: 1 }, false);
    },
    [fetchNotesCards]
  );

  // Reset filters
  const resetFilters = useCallback(async () => {
    const resetParams = { page: 1, page_size: 20 };
    setCurrentFilters(resetParams);
    await fetchNotesCards(resetParams, false);
  }, [fetchNotesCards]);

  // Load more cards
  const loadMore = useCallback(async () => {
    if (hasNextPage && !computedIsLoading) {
      await fetchNotesCards({ page: currentPage + 1 }, true);
    }
  }, [hasNextPage, computedIsLoading, currentPage, fetchNotesCards]);

  // Handle delete note
  const handleDeleteNote = useCallback(
    async (cardId: number) => {
      try {
        // Find card in list
        const card = notesCards.find((c) => c.id === cardId.toString());
        if (!card) return;

        console.log(
          `[NotesCardsGraphQLContext] Deleting note for card ${cardId}`
        );

        // Optimistically remove card from list (since deleting note removes it from notes cards)
        setNotesCards((prev) => prev.filter((c) => c.id !== cardId.toString()));
        setResponseData((prev: any) =>
          prev
            ? { ...prev, totalCount: Math.max(0, prev.totalCount - 1) }
            : null
        );

        const cardName = card.name || 'Card';

        // Show toast with undo option
        toast(`Заметка для "${cardName}" удалена`, {
          action: {
            label: 'Отменить',
            onClick: async () => {
              // If user clicked "Undo", return card to list
              setNotesCards((prev) => [card, ...prev]);
              setResponseData((prev: any) =>
                prev ? { ...prev, totalCount: prev.totalCount + 1 } : null
              );
              toast.info(`Заметка для "${cardName}" восстановлена`);
            }
          }
        });

        // Send request to server
        const success = await deleteNote(cardId);

        // If operation failed, return card to list
        if (!success) {
          setNotesCards((prev) => [card, ...prev]);
          setResponseData((prev: any) =>
            prev ? { ...prev, totalCount: prev.totalCount + 1 } : null
          );
          toast.error(`Не удалось удалить заметку для "${cardName}"`);
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.error('Не удалось удалить заметку. Попробуйте еще раз.');
      }
    },
    [notesCards, deleteNote]
  );

  // Handle update note
  const handleUpdateNote = useCallback(
    async (cardId: number, noteText: string) => {
      try {
        // Find card in list
        const card = notesCards.find((c) => c.id === cardId.toString());
        if (!card) return false;

        console.log(
          `[NotesCardsGraphQLContext] Updating note for card ${cardId}`
        );

        const cardName = card.name || 'Card';

        // Optimistically update the note text
        setNotesCards((prev) =>
          prev.map((c) =>
            c.id === cardId.toString()
              ? {
                  ...c,
                  note_text: noteText,
                  userData: {
                    ...c.userData,
                    userNote: { ...c.userData?.userNote, noteText }
                  }
                }
              : c
          )
        );

        // Send request to server
        const result = await updateNote(cardId, noteText);

        if (result.success) {
          toast.success(`Заметка для "${cardName}" обновлена`);
          return true;
        } else {
          // Revert optimistic update
          setNotesCards((prev) =>
            prev.map((c) =>
              c.id === cardId.toString()
                ? {
                    ...c,
                    note_text: card.note_text || '',
                    userData: card.userData
                  }
                : c
            )
          );
          toast.error(`Не удалось обновить заметку для "${cardName}"`);
          return false;
        }
      } catch (error) {
        console.error('Error updating note:', error);
        toast.error('Не удалось обновить заметку. Попробуйте еще раз.');
        return false;
      }
    },
    [notesCards, updateNote]
  );

  // Handle toggle favorite
  const handleToggleFavorite = useCallback(
    async (cardId: number) => {
      try {
        // Find card in list
        const card = notesCards.find((c) => c.id === cardId.toString());
        if (!card) return;

        const currentStatus = card.userData?.isFavorited ?? false;
        const cardName = card.name || 'Card';

        // Optimistically update favorite status
        setNotesCards((prev) =>
          prev.map((c) =>
            c.id === cardId.toString()
              ? {
                  ...c,
                  is_liked: !currentStatus,
                  is_heart_liked: !currentStatus,
                  userData: { ...c.userData, isFavorited: !currentStatus }
                }
              : c
          )
        );

        // Send request to server
        const success = await toggleFavorite(cardId, currentStatus);

        if (success) {
          toast.success(
            `"${cardName}" ${!currentStatus ? 'добавлено в' : 'убрано из'} избранное`
          );
        } else {
          // Revert optimistic update
          setNotesCards((prev) =>
            prev.map((c) =>
              c.id === cardId.toString()
                ? {
                    ...c,
                    is_liked: currentStatus,
                    is_heart_liked: currentStatus,
                    userData: { ...c.userData, isFavorited: currentStatus }
                  }
                : c
            )
          );
          toast.error(
            `Не удалось ${!currentStatus ? 'добавить в' : 'убрать из'} избранное "${cardName}"`
          );
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Не удалось обновить избранное. Попробуйте еще раз.');
      }
    },
    [notesCards, toggleFavorite]
  );

  // Load initial data on mount
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchNotesCards({}, false);
      initialFetchDone.current = true;
    }
  }, [fetchNotesCards]);

  const contextValue: NotesCardsContextType = {
    // State
    notesCards,
    isLoading: computedIsLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,

    // Actions
    fetchNotesCards,
    applyFilters,
    handleDeleteNote,
    handleUpdateNote,
    handleToggleFavorite,
    loadMore,
    resetFilters,
    setCurrentFilters
  };

  return (
    <NotesCardsContext.Provider value={contextValue}>
      <InvestorsGraphQLProvider>{children}</InvestorsGraphQLProvider>
    </NotesCardsContext.Provider>
  );
}
