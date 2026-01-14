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

interface FilterOption {
  name: string;
  slug: string;
  active: boolean;
  image?: string | null;
  is_private?: boolean;
}

interface FiltersData {
  success: boolean;
  message?: string;
  stages: FilterOption[];
  rounds: FilterOption[];
  participants: FilterOption[];
  categories: FilterOption[];
}

interface AllSignalsContextType {
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
  resetFilters: () => Promise<void>;

  // Filter data methods
  filtersData: {
    stages: FilterOption[];
    rounds: FilterOption[];
    participants: FilterOption[];
    categories: FilterOption[];
  };
  isLoadingFilters: boolean;
  filtersLoaded: boolean;
  fetchFiltersData: () => Promise<void>;

  // Favorite management methods
  handleToggleFavorite: (cardId: number) => Promise<void>;

  // Note methods
  handleAddNote: (cardId: number, noteText: string) => Promise<void>;

  // Filter update and POST request function
  updateFilters: (newFilters: Record<string, any>) => Promise<void>;

  // Function to add/remove value in filter array
  toggleFilterValue: (filterName: string, value: string) => Promise<void>;
}

const AllSignalsContext = createContext<AllSignalsContextType | undefined>(
  undefined
);

export function AllSignalsProvider({ children }: { children: ReactNode }) {
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
          const savedFilters = localStorage.getItem('all-signals-filters');
          if (savedFilters) {
            const parsed = JSON.parse(savedFilters);
            // Set hideLiked to true by default if not explicitly set to false
            if (parsed.hide_liked === undefined) {
              parsed.hide_liked = true;
            }
            return parsed;
          }
        } catch (e) {
          console.error('Error reading settings from localStorage:', e);
        }
      }
      return {
        sort_by: 'created_at',
        sort_order: 'desc',
        hide_liked: true // Default hide saved to true
      };
    }
  );

  const [filtersData, setFiltersData] = useState<{
    stages: FilterOption[];
    rounds: FilterOption[];
    participants: FilterOption[];
    categories: FilterOption[];
  }>({
    stages: [],
    rounds: [],
    participants: [],
    categories: []
  });
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Use ref to track request in progress
  const filtersRequestInProgress = useRef(false);

  // Use ref to track initial fetch
  const initialFetchDone = useRef(false);

  const { fetchWithAuth, logout } = useAuth();
  const router = useRouter();
  const { toggleFavorite, addNote } = useCardOperations();

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

  // Load signals
  const fetchSignals = useCallback(
    async (params: Record<string, any> = {}, appendMode = false) => {
      setIsLoading(true);
      setError(null);

      try {
        // Form request parameters
        const queryParams = new URLSearchParams();

        // Add parameters
        const updatedFilters = { ...currentFilters, ...params };

        // Pass only necessary parameters
        // Pagination parameters
        if (updatedFilters.page) {
          queryParams.append('page', String(updatedFilters.page));
        }
        if (updatedFilters.page_size) {
          queryParams.append('page_size', String(updatedFilters.page_size));
        }

        // Search parameters
        if (updatedFilters.search) {
          queryParams.append('search', String(updatedFilters.search));
        }

        // FeedSettings parameters
        if (updatedFilters.min_sig) {
          queryParams.append('min_sig', String(updatedFilters.min_sig));
        }
        if (updatedFilters.max_sig) {
          queryParams.append('max_sig', String(updatedFilters.max_sig));
        }
        if (updatedFilters.last_week) {
          queryParams.append('last_week', String(updatedFilters.last_week));
        }
        if (updatedFilters.start_date) {
          queryParams.append('start_date', String(updatedFilters.start_date));
        }
        if (updatedFilters.end_date) {
          queryParams.append('end_date', String(updatedFilters.end_date));
        }
        if (updatedFilters.hide_liked) {
          queryParams.append('hide_liked', String(updatedFilters.hide_liked));
        }

        // Save current filters in context state
        setCurrentFilters(updatedFilters);

        // Save filters in localStorage (excluding pagination parameters)
        const filtersForStorage = { ...updatedFilters };
        delete filtersForStorage.page;
        delete filtersForStorage.page_size;
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'all-signals-filters',
            JSON.stringify(filtersForStorage)
          );
        }

        // Send API request
        const response = await fetchWithAuth(
          `/api/feeds/all-signals?${queryParams.toString()}`
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
          }
          throw new Error('Error loading signals');
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
          throw new Error(data.message || 'Error loading signals');
        }
      } catch (error) {
        // Check if error is auth-related
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          toast.error('Не удалось загрузить сигналы. Попробуйте еще раз.');
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
      await fetchSignals(filters, false);
    },
    [fetchSignals]
  );

  // Reset filters
  const resetFilters = useCallback(async () => {
    const defaultFilters = {
      page: 1,
      page_size: 20
    };

    // Remove saved filters from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('all-signals-filters');
    }

    await fetchSignals(defaultFilters);
  }, [fetchSignals]);

  // Load filter data
  const fetchFiltersData = useCallback(async () => {
    // Check if filters are already loaded or request is in progress
    if (filtersLoaded || isLoadingFilters || filtersRequestInProgress.current) {
      return;
    }

    // Set flag that request is in progress
    filtersRequestInProgress.current = true;
    setIsLoadingFilters(true);

    try {
      const response = await fetchWithAuth('/api/filters/all-signals');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please sign in again.');
        }
        throw new Error('Error loading filter data');
      }

      const data: FiltersData = await response.json();

      if (data.success) {
        setFiltersData({
          stages: data.stages || [],
          rounds: data.rounds || [],
          participants: data.participants || [],
          categories: data.categories || []
        });
        setFiltersLoaded(true);
      } else {
        throw new Error('Error loading filter data');
      }
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (!isAuthError) {
        toast.error('Не удалось загрузить данные фильтров');
      }
    } finally {
      setIsLoadingFilters(false);
      // Сбрасываем флаг запроса в процессе
      filtersRequestInProgress.current = false;
    }
  }, [fetchWithAuth, handleAuthError, filtersLoaded, isLoadingFilters]);

  // Загружаем сигналы только при первом рендере
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchSignals();
      initialFetchDone.current = true;
    }
  }, [fetchSignals]);

  // Обработчик переключения избранного
  const handleToggleFavorite = useCallback(
    async (cardId: number) => {
      // Находим карточку в списке
      const card = signals.find((c) => c.id === cardId);
      if (!card) return;

      const currentStatus = card.is_liked || false;
      const cardName = card.name || card.title || 'No title';

      // Оптимистично обновляем статус в UI
      setSignals((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, is_liked: !currentStatus } : c
        )
      );

      // Отправляем запрос на сервер
      const success = await toggleFavorite(cardId, currentStatus);

      // Если операция не удалась, возвращаем предыдущий статус
      if (!success) {
        setSignals((prev) =>
          prev.map((c) =>
            c.id === cardId ? { ...c, is_liked: currentStatus } : c
          )
        );
        toast.error(
          `Failed to ${currentStatus ? 'remove from' : 'add to'} favorites "${cardName}"`
        );
      }
    },
    [signals, toggleFavorite]
  );

  // Обработчик добавления заметки
  const handleAddNote = useCallback(
    async (cardId: number, noteText: string) => {
      // Находим карточку в списке
      const card = signals.find((c) => c.id === cardId);
      if (!card) return;

      const cardName = card.name || card.title || 'No title';

      // Отправляем запрос на сервер
      const result = await addNote(cardId, noteText);

      if (result.success) {
        // Обновляем карточку в списке
        setSignals((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, has_note: true } : c))
        );
        toast.success(`Заметка для "${cardName}" добавлена`);
      } else {
        toast.error(`Не удалось добавить заметку для "${cardName}"`);
      }
    },
    [signals, addNote]
  );

  // Добавим функцию для обновления фильтров и отправки POST-запроса
  const updateFilters = useCallback(
    async (newFilters: Record<string, any>) => {
      try {
        // Обновляем состояние фильтров
        const updatedFilters = { ...currentFilters, ...newFilters };
        setCurrentFilters(updatedFilters);

        // Сохраняем фильтры в localStorage
        const filtersForStorage = { ...updatedFilters };
        delete filtersForStorage.page;
        delete filtersForStorage.page_size;
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'all-signals-filters',
            JSON.stringify(filtersForStorage)
          );
        }

        // Отправляем POST-запрос на бэкенд для сохранения фильтров
        const filterParams = {
          stages: updatedFilters.stages || [],
          rounds: updatedFilters.rounds || [],
          participants: updatedFilters.participants || [],
          categories: updatedFilters.categories || []
        };

        const response = await fetch('/api/filters/all-signals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(filterParams)
        });

        if (!response.ok) {
          throw new Error('Error saving filters');
        }

        // Загружаем сигналы с обновленными фильтрами
        await fetchSignals(
          {
            page: 1,
            page_size: updatedFilters.page_size || 20
          },
          false
        );
      } catch (error) {
        console.error('Error updating filters:', error);
        setError('Error updating filters');
      }
    },
    [currentFilters, fetchSignals]
  );

  // Функция для добавления/удаления значения в массиве фильтров
  const toggleFilterValue = useCallback(
    async (filterName: string, value: string) => {
      const currentValues = currentFilters[filterName] || [];
      let newValues;

      if (currentValues.includes(value)) {
        // Удаляем значение, если оно уже есть
        newValues = currentValues.filter((v: string) => v !== value);
      } else {
        // Добавляем значение, если его нет
        newValues = [...currentValues, value];
      }

      // Обновляем фильтры и отправляем POST-запрос
      await updateFilters({ [filterName]: newValues });
    },
    [currentFilters, updateFilters]
  );

  return (
    <AllSignalsContext.Provider
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
        resetFilters,
        filtersData,
        isLoadingFilters,
        filtersLoaded,
        fetchFiltersData,
        handleToggleFavorite,
        handleAddNote,
        updateFilters,
        toggleFilterValue
      }}
    >
      <InvestorsGraphQLProvider>{children}</InvestorsGraphQLProvider>
    </AllSignalsContext.Provider>
  );
}

export function useAllSignals() {
  const context = useContext(AllSignalsContext);
  if (context === undefined) {
    throw new Error('useAllSignals must be used within AllSignalsProvider');
  }
  return context;
}
