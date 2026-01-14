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
import { InvestorsGraphQLProvider } from '@/features/investors/contexts/investors-graphql-context';

interface NotesCardsContextType {
  notesCards: CardPreview[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;

  // Methods for working with note cards
  fetchNotesCards: (
    params?: Record<string, any>,
    appendMode?: boolean
  ) => Promise<void>;

  // Methods for managing notes
  handleDeleteNote: (cardId: number) => Promise<void>;
  handleUpdateNote: (cardId: number, noteText: string) => Promise<void>;

  // Filtering methods
  applyFilters: (filters: Record<string, any>) => Promise<void>;
  currentFilters: Record<string, any>;

  // Favorite management methods
  handleToggleFavorite: (cardId: number) => Promise<void>;
}

const NotesCardsContext = createContext<NotesCardsContextType | undefined>(
  undefined
);

export function NotesCardsProvider({ children }: { children: ReactNode }) {
  const [notesCards, setNotesCards] = useState<CardPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

  const initialFetchDone = useRef(false);

  const { fetchWithAuth, logout } = useAuth();
  const router = useRouter();
  const { toggleFavorite, deleteNote, updateNote } = useCardOperations();

  const handleAuthError = async (error: any) => {
    if (
      error.message?.includes('Session expired') ||
      error.message?.includes('please sign in again')
    ) {
      toast.error('Ваша сессия истекла. Пожалуйста, войдите снова.');
      await logout();
      router.push('/auth/sign-in');
      return true;
    }
    return false;
  };

  const fetchNotesCards = useCallback(
    async (params: Record<string, any> = {}, appendMode = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.append('type', 'notes');

        Object.entries({ ...currentFilters, ...params }).forEach(
          ([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              queryParams.append(key, String(value));
            }
          }
        );

        setCurrentFilters({ ...currentFilters, ...params });

        const response = await fetchWithAuth(
          `/api/cards?${queryParams.toString()}`
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
          }
          throw new Error('Error loading note cards');
        }

        const data: CardsResponse = await response.json();

        if (data.success) {
          if (appendMode && params.page > 1) {
            setNotesCards((prev) => [...prev, ...data.cards]);
          } else {
            setNotesCards(data.cards);
          }
          setTotalCount(data.total_count);
          setCurrentPage(data.current_page);
          setTotalPages(data.total_pages);
        } else {
          throw new Error(data.message || 'Error loading note cards');
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          toast.error('Не удалось загрузить карточки с заметками. Попробуйте еще раз.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWithAuth, handleAuthError, currentFilters]
  );

  const applyFilters = useCallback(
    async (filters: Record<string, any>) => {
      await fetchNotesCards(filters);
    },
    [fetchNotesCards]
  );

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchNotesCards();
      initialFetchDone.current = true;
    }
  }, [fetchNotesCards]);

  const handleDeleteNote = useCallback(
    async (cardId: number) => {
      const card = notesCards.find((c) => c.id === cardId);
      if (!card) return;

      console.log(`[NotesCardsContext] Deleting note for card ${cardId}`);

      setNotesCards((prev) => prev.filter((c) => c.id !== cardId));
      setTotalCount((prev) => prev - 1);

      const cardName = card.name || card.title || 'Untitled';

      toast(`Заметка для "${cardName}" удалена`);

      const success = await deleteNote(cardId);

      if (!success) {
        setNotesCards((prev) => [card, ...prev]);
        setTotalCount((prev) => prev + 1);
        toast.error(`Не удалось удалить заметку для "${cardName}"`);
      }
    },
    [notesCards, deleteNote]
  );

  const handleUpdateNote = useCallback(
    async (cardId: number, noteText: string) => {
      const card = notesCards.find((c) => c.id === cardId);
      if (!card) return;

      console.log(`[NotesCardsContext] Updating note for card ${cardId}`);

      const cardName = card.name || card.title || 'Untitled';

      const result = await updateNote(cardId, noteText);

      if (result.success) {
        setNotesCards((prev) =>
          prev.map((c) =>
            c.id === cardId ? { ...c, note_text: result.noteText } : c
          )
        );
        toast.success(`Заметка для "${cardName}" обновлена`);
      } else {
        toast.error(`Не удалось обновить заметку для "${cardName}"`);
      }

      return result.success;
    },
    [notesCards, updateNote]
  );

  const handleToggleFavorite = useCallback(
    async (cardId: number) => {
      const card = notesCards.find((c) => c.id === cardId);
      if (!card) return;

      const currentStatus = card.is_liked || false;
      const cardName = card.name || card.title || 'Untitled';

      setNotesCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, is_liked: !currentStatus } : c
        )
      );

      const success = await toggleFavorite(cardId, currentStatus);

      if (!success) {
        setNotesCards((prev) =>
          prev.map((c) =>
            c.id === cardId ? { ...c, is_liked: currentStatus } : c
          )
        );
        toast.error(
          `Failed to ${currentStatus ? 'remove from' : 'add to'} favorites "${cardName}"`
        );
      }
    },
    [notesCards, toggleFavorite]
  );

  return (
    <NotesCardsContext.Provider
      value={{
        notesCards,
        isLoading,
        error,
        totalCount,
        currentPage,
        totalPages,
        fetchNotesCards,
        handleDeleteNote,
        handleUpdateNote,
        applyFilters,
        currentFilters,
        handleToggleFavorite
      }}
    >
      <InvestorsGraphQLProvider>{children}</InvestorsGraphQLProvider>
    </NotesCardsContext.Provider>
  );
}

export function useNotesCards() {
  const context = useContext(NotesCardsContext);
  if (context === undefined) {
    throw new Error('useNotesCards must be used within NotesCardsProvider');
  }
  return context;
}
