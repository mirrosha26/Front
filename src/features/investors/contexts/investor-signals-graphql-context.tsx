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
import { GET_PARTICIPANT_SIGNALS_QUERY } from '@/lib/graphql/queries';
import {
  ParticipantSignalsVariables,
  ParticipantSignalsResponse,
  SignalCard
} from '@/lib/graphql/types';

// Types for context state
interface InvestorSignalsState {
  signals: SignalCard[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  currentFilters: any;
  participantId: string;
}

// Types for context actions
interface InvestorSignalsActions {
  fetchSignals: (
    params?: Record<string, any>,
    appendMode?: boolean
  ) => Promise<void>;
  applyFilters: (filters: Record<string, any>) => Promise<void>;
  handleToggleFavorite: (cardId: number) => Promise<void>;
  handleDelete: (cardId: number) => Promise<void>;
  loadMore: () => Promise<void>;
  setCurrentFilters: (filters: any) => void;
  setParticipantId: (participantId: string) => void;
}

// Context type
type InvestorSignalsContextType = InvestorSignalsState & InvestorSignalsActions;

// Create context
const InvestorSignalsContext = createContext<InvestorSignalsContextType | undefined>(
  undefined
);

// Hook to use context
export function useInvestorSignals() {
  const context = useContext(InvestorSignalsContext);
  if (!context) {
    throw new Error('useInvestorSignals must be used within InvestorSignalsProvider');
  }
  return context;
}

// Provider component
export function InvestorSignalsGraphQLProvider({
  children,
  initialParticipantId
}: {
  children: ReactNode;
  initialParticipantId: string;
}) {
  // State
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({
    page: 1,
    page_size: 20
  });
  const [signals, setSignals] = useState<SignalCard[]>([]);
  const [participantId, setParticipantId] = useState(initialParticipantId);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isProcessingData, setIsProcessingData] = useState(false);

  // Track if initial fetch was made
  const initialFetchDone = useRef(false);

  const router = useRouter();

  // Response data state for pagination info
  const [responseData, setResponseData] = useState<any>(null);

  // Use lazy query instead of regular query to have more control
  const [getParticipantSignals, { loading: isLoading, error: gqlError }] =
    useLazyQuery<ParticipantSignalsResponse, ParticipantSignalsVariables>(
      GET_PARTICIPANT_SIGNALS_QUERY,
      {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
        onCompleted: (data) => {
          if (data?.signalCards?.nodes) {
            // Update response data for pagination info
            setResponseData(data.signalCards);

            const newSignals = data.signalCards.nodes.map((signal: any) => ({
              ...signal,
              // Map fields for backward compatibility
              title: signal.name || signal.title,
              image_url: signal.imageUrl,
              round_status: signal.roundStatus,
              last_round: signal.lastRound,
              categories_list: signal.categories,
              // Map favorite status
              is_liked: signal.userData?.isFavorited ?? false,
              is_heart_liked: signal.userData?.isFavorited ?? false,
              has_note: signal.userData?.userNote?.noteText ? true : false,
              note_text: signal.userData?.userNote?.noteText || '',
              // Include signals data
              signals: signal.signals || [],
              // Legacy participants data for backward compatibility
              participants_list: signal.signals
                ? signal.signals.reduce((acc: any[], s: any) => {
                    if (
                      s.participant &&
                      !acc.some((p) => p.name === s.participant.name)
                    ) {
                      acc.push({
                        name: s.participant.name,
                        image: s.participant.imageUrl,
                        is_saved: s.participant.isSaved,
                        is_private: s.participant.isPrivate || false
                      });
                    }
                    if (
                      s.associatedParticipant &&
                      !acc.some((p) => p.name === s.associatedParticipant.name)
                    ) {
                      acc.push({
                        name: s.associatedParticipant.name,
                        image: s.associatedParticipant.imageUrl,
                        is_saved: s.associatedParticipant.isSaved,
                        is_private: s.associatedParticipant.isPrivate || false
                      });
                    }
                    return acc;
                  }, [])
                : []
            }));

            if (isPaginating) {
              // Append to existing signals
              setSignals((prev) => [...prev, ...newSignals]);
            } else {
              // Replace all signals
              setSignals(newSignals);
            }

            setIsPaginating(false);
            setIsProcessingData(false); // Mark data processing as complete
          }
        },
        onError: (error) => {
          console.error('GraphQL error:', error);
          setIsProcessingData(false);
          setIsPaginating(false);
        }
      }
    );

  // Computed values
  const totalCount = responseData?.totalCount || 0;
  const currentPage = responseData?.currentPage || 1;
  const totalPages = responseData?.totalPages || 1;
  const hasNextPage = responseData?.hasNextPage || false;
  const computedIsLoading = isLoading || isProcessingData;

  // Use card operations for mutations
  const { toggleFavorite, deleteCard } = useCardOperations();

  // Fetch signals function
  const fetchSignals = useCallback(
    async (params: Record<string, any> = {}, appendMode = false) => {
      if (!participantId) {
        console.warn('No participant ID provided for signals fetch');
        return;
      }

      try {
        setIsProcessingData(true);
        const finalParams = { ...currentFilters, ...params };
        setCurrentFilters(finalParams);
        setIsPaginating(appendMode);

        // Build filters object for GraphQL
        const filters: any = {};
        
        // Add participant filter - this is the key filter for investor signals
        filters.participants = [participantId];
        
        if (finalParams.search) {
          filters.search = finalParams.search;
        }
        if (finalParams.categories && finalParams.categories.length > 0) {
          filters.categories = finalParams.categories;
        }
        if (finalParams.stages && finalParams.stages.length > 0) {
          filters.stages = finalParams.stages;
        }
        if (finalParams.roundStatuses && finalParams.roundStatuses.length > 0) {
          filters.roundStatuses = finalParams.roundStatuses;
        }
        if (finalParams.locations && finalParams.locations.length > 0) {
          filters.locations = finalParams.locations;
        }
        if (finalParams.featured !== undefined) {
          filters.featured = finalParams.featured;
        }
        if (finalParams.isOpen !== undefined) {
          filters.isOpen = finalParams.isOpen;
        }
        if (finalParams.new !== undefined) {
          filters.new = finalParams.new;
        }
        if (finalParams.trending !== undefined) {
          filters.trending = finalParams.trending;
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
        await getParticipantSignals({
          variables: {
            page: finalParams.page || 1,
            pageSize: finalParams.page_size || 20,
            filters: Object.keys(filters).length > 0 ? filters : undefined
          }
        });
      } catch (error) {
        console.error('Error fetching participant signals:', error);
        toast.error('Не удалось загрузить сигналы. Попробуйте еще раз.');
        setIsProcessingData(false); // Reset processing state on error
      }
    },
    [currentFilters, participantId, getParticipantSignals]
  );

  // Apply filters
  const applyFilters = useCallback(
    async (filters: Record<string, any>) => {
      await fetchSignals({ ...filters, page: 1 }, false);
    },
    [fetchSignals]
  );

  // Load more signals
  const loadMore = useCallback(async () => {
    if (hasNextPage && !computedIsLoading) {
      await fetchSignals({ page: currentPage + 1 }, true);
    }
  }, [hasNextPage, computedIsLoading, currentPage, fetchSignals]);

  // Handle toggle favorite
  const handleToggleFavorite = useCallback(
    async (cardId: number) => {
      try {
        // Find the signal to get its current favorite status
        const signal = signals.find((s) => s.id === cardId.toString());
        const currentStatus = signal?.userData?.isFavorited ?? false;

        await toggleFavorite(cardId, currentStatus);
        // Refresh the current page
        await fetchSignals({}, false);
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Не удалось изменить статус избранного. Попробуйте еще раз.');
      }
    },
    [signals, toggleFavorite, fetchSignals]
  );

  // Handle delete signal
  const handleDelete = useCallback(
    async (cardId: number) => {
      try {
        await deleteCard(cardId);
        // Remove from local state
        setSignals((prev) =>
          prev.filter((signal) => signal.id !== cardId.toString())
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
        toast.success('Сигнал успешно удален');
      } catch (error) {
        console.error('Error deleting signal:', error);
        toast.error('Не удалось удалить сигнал. Попробуйте еще раз.');
      }
    },
    [deleteCard]
  );

  // Set participant ID
  const setParticipantIdHandler = useCallback((newParticipantId: string) => {
    setParticipantId(newParticipantId);
    // Reset state when participant changes
    setSignals([]);
    setResponseData(null);
    setCurrentFilters({ page: 1, page_size: 20 });
    initialFetchDone.current = false;
  }, []);

  // Initial fetch
  useEffect(() => {
    if (participantId && !initialFetchDone.current) {
      fetchSignals({}, false);
      initialFetchDone.current = true;
    }
  }, [participantId, fetchSignals]);

  // Context value
  const contextValue: InvestorSignalsContextType = {
    signals,
    isLoading: computedIsLoading,
    error: gqlError?.message || null,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    participantId,
    fetchSignals,
    applyFilters,
    handleToggleFavorite,
    handleDelete,
    loadMore,
    setCurrentFilters,
    setParticipantId: setParticipantIdHandler
  };

  return (
    <InvestorSignalsContext.Provider value={contextValue}>
      {children}
    </InvestorSignalsContext.Provider>
  );
} 