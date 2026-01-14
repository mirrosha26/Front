'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { CardPreview, CardsResponse } from '@/features/shared/types/cards';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCardOperations } from '@/features/shared/contexts/card-operations-context';
import { getCookie, setCookie } from 'cookies-next';
import { format } from 'date-fns';
import { formatDateForGraphQL } from '@/lib/format';
import { InvestorsGraphQLProvider } from '@/features/investors/contexts/investors-graphql-context';

interface PersonalSignalsContextType {
  signals: CardPreview[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;

  // Signal methods
  fetchSignals: (
    params?: Record<string, any>,
    appendMode?: boolean
  ) => Promise<void>;

  // Filter methods
  applyFilters: (filters: Record<string, any>) => Promise<void>;
  currentFilters: Record<string, any>;

  // Favorite management methods
  handleToggleFavorite: (cardId: number) => Promise<void>;

  // Note methods
  handleAddNote: (cardId: number, noteText: string) => Promise<void>;
}

const PersonalSignalsContext = createContext<
  PersonalSignalsContextType | undefined
>(undefined);

export function PersonalSignalsProvider({ children }: { children: ReactNode }) {
  const [signals, setSignals] = useState<CardPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(
    () => {
      if (typeof window !== 'undefined') {
        try {
          const savedFilters = localStorage.getItem('personal-signals-filters');
          if (savedFilters) {
            return JSON.parse(savedFilters);
          }
        } catch (e) {
          console.error('Error reading settings from localStorage:', e);
        }
      }
      return {
        min_sig: 1 // Default minimum 1 signal
      };
    }
  );

  // Using useRef to track initial loading
  const initialFetchDone = useRef(false);

  const { fetchWithAuth, logout } = useAuth();
  const router = useRouter();
  const { toggleFavorite, addNote } = useCardOperations();

  const handleAuthError = useCallback(
    async (error: any) => {
      if (
        error.message?.includes('Session expired') ||
        error.message?.includes('please login again')
      ) {
        toast.error('Ваша сессия истекла. Пожалуйста, войдите снова.');
        await logout();
        router.push('/auth/sign-in');
        return true;
      }
      return false;
    },
    [logout, router]
  );

  // Loading signals
  const fetchSignals = useCallback(
    async (params: Record<string, any> = {}, appendMode = false) => {
      setIsLoading(true);
      setError(null);

      try {
        // Form request parameters
        const queryParams = new URLSearchParams();

        // Add parameters
        const updatedFilters = { ...currentFilters, ...params };

        // Format dates if they exist and are valid
        if (updatedFilters.start_date) {
          const startDate = new Date(updatedFilters.start_date);
          if (!isNaN(startDate.getTime())) {
            updatedFilters.start_date = formatDateForGraphQL(startDate);
          } else {
            updatedFilters.start_date = undefined;
          }
        }

        if (updatedFilters.end_date) {
          const endDate = new Date(updatedFilters.end_date);
          if (!isNaN(endDate.getTime())) {
            updatedFilters.end_date = formatDateForGraphQL(endDate);
          } else {
            updatedFilters.end_date = undefined;
          }
        }

        Object.entries(updatedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });

        // Save current filters
        setCurrentFilters(updatedFilters);

        // Save filters to localStorage (excluding pagination parameters)
        const filtersForStorage = { ...updatedFilters };
        delete filtersForStorage.page;
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'personal-signals-filters',
            JSON.stringify(filtersForStorage)
          );
        }

        // Send API request
        if (!fetchWithAuth) {
          throw new Error('Auth context is not initialized');
        }

        const response = await fetchWithAuth(
          `/api/feeds/personal?${queryParams.toString()}`
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          }
          throw new Error('Error loading personal signals');
        }

        const data: CardsResponse = await response.json();

        if (data.success) {
          if (appendMode && params.page > 1) {
            // Add new cards to existing ones
            setSignals((prev) => [...prev, ...data.cards]);
          } else {
            // Replace entire list
            setSignals(data.cards);
          }
          setTotalCount(data.total_count);
          setCurrentPage(data.current_page);
          setTotalPages(data.total_pages);
        } else {
          throw new Error('Failed to load personal signals');
        }
      } catch (error) {
        // Check if error is auth-related
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          toast.error('Не удалось загрузить личные сигналы. Попробуйте еще раз.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWithAuth, handleAuthError, currentFilters]
  );

  // Apply filters
  const applyFilters = useCallback(
    async (filters: Record<string, any>) => {
      await fetchSignals(filters);
    },
    [fetchSignals]
  );

  // Load signals only on first render
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchSignals();
      initialFetchDone.current = true;
    }
  }, [fetchSignals]);

  // Favorite toggle handler
  const handleToggleFavorite = useCallback(
    async (cardId: number) => {
      // Find card in list
      const card = signals.find((c) => c.id === cardId);
      if (!card) return;

      const currentStatus = card.is_liked || false;
      const cardName = card.name || card.title || 'Untitled';

      // Optimistically update status in UI
      setSignals((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, is_liked: !currentStatus } : c
        )
      );

      // Send request to server
      const success = await toggleFavorite(cardId, currentStatus);

      // If operation failed, revert to previous status
      if (!success) {
        setSignals((prev) =>
          prev.map((c) =>
            c.id === cardId ? { ...c, is_liked: currentStatus } : c
          )
        );
        toast.error(
          `Не удалось ${currentStatus ? 'убрать из' : 'добавить в'} избранное "${cardName}"`
        );
      }
    },
    [signals, toggleFavorite]
  );

  // Note addition handler
  const handleAddNote = useCallback(
    async (cardId: number, noteText: string) => {
      // Find card in list
      const card = signals.find((c) => c.id === cardId);
      if (!card) return;

      const cardName = card.name || card.title || 'Untitled';

      // Send request to server
      const result = await addNote(cardId, noteText);

      if (result.success) {
        // Update card in list
        setSignals((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, has_note: true } : c))
        );
        toast.success(`Заметка добавлена для "${cardName}"`);
      } else {
        toast.error(`Не удалось добавить заметку для "${cardName}"`);
      }
    },
    [signals, addNote]
  );

  return (
    <PersonalSignalsContext.Provider
      value={{
        signals,
        isLoading,
        error,
        totalCount,
        currentPage,
        totalPages,
        fetchSignals,
        applyFilters,
        currentFilters,
        handleToggleFavorite,
        handleAddNote
      }}
    >
      <InvestorsGraphQLProvider>
        {children}
      </InvestorsGraphQLProvider>
    </PersonalSignalsContext.Provider>
  );
}

export function usePersonalSignals() {
  const context = useContext(PersonalSignalsContext);
  if (context === undefined) {
    throw new Error(
      'usePersonalSignals must be used within PersonalSignalsProvider'
    );
  }
  return context;
}
