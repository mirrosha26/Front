'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { toast } from 'sonner';
import {
  SAVED_FILTERS_QUERY,
  DEFAULT_SAVED_FILTER_QUERY,
  SAVED_FILTERS_SUMMARY_QUERY,
  CREATE_SAVED_FILTER_MUTATION,
  UPDATE_SAVED_FILTER_MUTATION,
  DELETE_SAVED_FILTER_MUTATION,
  APPLY_SAVED_FILTER_MUTATION,
  SAVE_CURRENT_FILTER_AS_MUTATION,
  SET_DEFAULT_SAVED_FILTER_MUTATION
} from '@/lib/graphql/queries';
import {
  SavedFilter,
  SavedFilterInput,
  SavedFiltersResponse,
  SavedFiltersSummary,
  SavedFilterMutationResponse,
  PaginationInput
} from '@/lib/graphql/types';
import { cleanSavedFilterInput } from '@/lib/utils/saved-filters';

interface UseSavedFiltersProps {
  pagination?: PaginationInput;
}

interface UseSavedFiltersReturn {
  // Data
  savedFilters: SavedFilter[];
  defaultFilter: SavedFilter | null;
  summary: SavedFiltersSummary | null;
  loading: boolean;
  error: string | null;

  // Pagination
  totalCount: number;
  hasNextPage: boolean;
  currentPage: number;
  totalPages: number;

  // Actions
  createFilter: (input: SavedFilterInput) => Promise<SavedFilter | null>;
  updateFilter: (id: string, input: SavedFilterInput) => Promise<SavedFilter | null>;
  deleteFilter: (id: string) => Promise<boolean>;
  applyFilter: (id: string) => Promise<SavedFilter | null>;
  saveCurrentFilterAs: (
    name: string, 
    description?: string, 
    isDefault?: boolean,
    currentFilters?: any
  ) => Promise<SavedFilter | null>;
  setAsDefault: (id: string) => Promise<boolean>;
  loadMore: () => void;
  refetch: () => void;
}

export function useSavedFilters({ pagination }: UseSavedFiltersProps = {}): UseSavedFiltersReturn {
  const apolloClient = useApolloClient();
  const [error, setError] = useState<string | null>(null);

  // Query for saved filters list
  const {
    data: savedFiltersData,
    loading: savedFiltersLoading,
    error: savedFiltersError,
    fetchMore,
    refetch: refetchSavedFilters
  } = useQuery<{ savedFilters: SavedFiltersResponse }>(SAVED_FILTERS_QUERY, {
    variables: { 
      pagination,
      includeRecentCounts: true
    },
    errorPolicy: 'all',
    onError: (error) => {
      console.error('Error loading saved filters:', error);
      setError(error.message);
    }
  });

  // Query for default filter
  const {
    data: defaultFilterData,
    loading: defaultFilterLoading,
    refetch: refetchDefaultFilter
  } = useQuery<{ defaultSavedFilter: SavedFilter | null }>(DEFAULT_SAVED_FILTER_QUERY, {
    errorPolicy: 'all'
  });

  // Query for summary
  const {
    data: summaryData,
    loading: summaryLoading,
    refetch: refetchSummary
  } = useQuery<{ savedFiltersSummary: SavedFiltersSummary }>(SAVED_FILTERS_SUMMARY_QUERY, {
    errorPolicy: 'all'
  });

  // Mutations
  const [createSavedFilterMutation] = useMutation<
    { createSavedFilter: SavedFilterMutationResponse },
    { filterInput: SavedFilterInput }
  >(CREATE_SAVED_FILTER_MUTATION);

  const [updateSavedFilterMutation] = useMutation<
    { updateSavedFilter: SavedFilterMutationResponse },
    { filterId: string; filterInput: SavedFilterInput }
  >(UPDATE_SAVED_FILTER_MUTATION);

  const [deleteSavedFilterMutation] = useMutation<
    { deleteSavedFilter: SavedFilterMutationResponse },
    { filterId: string }
  >(DELETE_SAVED_FILTER_MUTATION);

  const [applySavedFilterMutation] = useMutation<
    { applySavedFilter: SavedFilterMutationResponse },
    { filterId: string }
  >(APPLY_SAVED_FILTER_MUTATION);

  const [saveCurrentFilterAsMutation] = useMutation<
    { saveCurrentFilterAs: SavedFilterMutationResponse },
    { filterInput: SavedFilterInput }
  >(SAVE_CURRENT_FILTER_AS_MUTATION);

  const [setDefaultSavedFilterMutation] = useMutation<
    { setDefaultSavedFilter: SavedFilterMutationResponse },
    { filterId: string }
  >(SET_DEFAULT_SAVED_FILTER_MUTATION);

  // Derived state
  const savedFilters = savedFiltersData?.savedFilters?.nodes || [];
  const defaultFilter = defaultFilterData?.defaultSavedFilter || null;
  const summary = summaryData?.savedFiltersSummary || null;
  const loading = savedFiltersLoading || defaultFilterLoading || summaryLoading;

  // Pagination data
  const totalCount = savedFiltersData?.savedFilters?.totalCount || 0;
  const hasNextPage = savedFiltersData?.savedFilters?.hasNextPage || false;
  const currentPage = savedFiltersData?.savedFilters?.currentPage || 1;
  const totalPages = savedFiltersData?.savedFilters?.totalPages || 1;

  // Actions
  const createFilter = useCallback(async (input: SavedFilterInput): Promise<SavedFilter | null> => {
    try {
      setError(null);
      const cleanedInput = cleanSavedFilterInput(input);
      const result = await createSavedFilterMutation({
        variables: { filterInput: cleanedInput },
        refetchQueries: [
          { 
            query: SAVED_FILTERS_QUERY, 
            variables: { 
              pagination,
              includeRecentCounts: true
            }
          },
          { query: SAVED_FILTERS_SUMMARY_QUERY },
          ...(input.isDefault ? [{ query: DEFAULT_SAVED_FILTER_QUERY }] : [])
        ]
      });

      if (result.data?.createSavedFilter?.success && result.data.createSavedFilter.savedFilter) {
        toast.success(`Фильтр "${input.name}" успешно создан!`);
        return result.data.createSavedFilter.savedFilter;
      } else {
        const backendMessage = result.data?.createSavedFilter?.message || 'Не удалось создать фильтр';
        const userFriendlyMessage = backendMessage.includes('LocMemCache') 
          ? 'Проблема конфигурации сервера. Обратитесь в поддержку или попробуйте позже.'
          : backendMessage;
        toast.error(userFriendlyMessage);
        setError(userFriendlyMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating saved filter:', error);
      toast.error(`Не удалось создать фильтр: ${errorMessage}`);
      setError(errorMessage);
      return null;
    }
  }, [createSavedFilterMutation, pagination]);

  const updateFilter = useCallback(async (id: string, input: SavedFilterInput): Promise<SavedFilter | null> => {
    try {
      setError(null);
      const cleanedInput = cleanSavedFilterInput(input);
      const result = await updateSavedFilterMutation({
        variables: { filterId: id, filterInput: cleanedInput },
        refetchQueries: [
          { 
            query: SAVED_FILTERS_QUERY, 
            variables: { 
              pagination,
              includeRecentCounts: true
            }
          },
          { query: SAVED_FILTERS_SUMMARY_QUERY },
          ...(input.isDefault ? [{ query: DEFAULT_SAVED_FILTER_QUERY }] : [])
        ]
      });

      if (result.data?.updateSavedFilter?.success && result.data.updateSavedFilter.savedFilter) {
        toast.success(`Фильтр "${input.name}" успешно обновлен!`);
        return result.data.updateSavedFilter.savedFilter;
      } else {
        const errorMessage = result.data?.updateSavedFilter?.message || 'Не удалось обновить фильтр';
        toast.error(errorMessage);
        setError(errorMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating saved filter:', error);
      toast.error(`Не удалось обновить фильтр: ${errorMessage}`);
      setError(errorMessage);
      return null;
    }
  }, [updateSavedFilterMutation, pagination]);

  const deleteFilter = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const result = await deleteSavedFilterMutation({
        variables: { filterId: id },
        refetchQueries: [
          { 
            query: SAVED_FILTERS_QUERY, 
            variables: { 
              pagination,
              includeRecentCounts: true
            }
          },
          { query: SAVED_FILTERS_SUMMARY_QUERY },
          { query: DEFAULT_SAVED_FILTER_QUERY }
        ]
      });

      if (result.data?.deleteSavedFilter?.success) {
        toast.success('Фильтр успешно удален!');
        return true;
      } else {
        const errorMessage = result.data?.deleteSavedFilter?.message || 'Не удалось удалить фильтр';
        toast.error(errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error deleting saved filter:', error);
      toast.error(`Не удалось удалить фильтр: ${errorMessage}`);
      setError(errorMessage);
      return false;
    }
  }, [deleteSavedFilterMutation, pagination]);

  const applyFilter = useCallback(async (id: string): Promise<SavedFilter | null> => {
    try {
      setError(null);
      const result = await applySavedFilterMutation({
        variables: { filterId: id }
      });

      if (result.data?.applySavedFilter?.success && result.data.applySavedFilter.savedFilter) {
        toast.success('Фильтр успешно применен!');
        return result.data.applySavedFilter.savedFilter;
      } else {
        const errorMessage = result.data?.applySavedFilter?.message || 'Не удалось применить фильтр';
        toast.error(errorMessage);
        setError(errorMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error applying saved filter:', error);
      toast.error(`Не удалось применить фильтр: ${errorMessage}`);
      setError(errorMessage);
      return null;
    }
  }, [applySavedFilterMutation]);

  const saveCurrentFilterAs = useCallback(async (
    name: string,
    description?: string,
    isDefault?: boolean,
    currentFilters?: any
  ): Promise<SavedFilter | null> => {
    try {
      setError(null);
      
      // If currentFilters are provided, construct SavedFilterInput from them
      let filterInput: SavedFilterInput;
      if (currentFilters) {
        filterInput = {
          name,
          description,
          isDefault,
          categories: currentFilters.categories,
          participants: currentFilters.participants,
          stages: currentFilters.stages,
          roundStatuses: currentFilters.roundStatuses,
          search: currentFilters.search,
          featured: currentFilters.featured,
          isOpen: currentFilters.isOpen,
          new: currentFilters.new,
          trending: currentFilters.trending,
          hideLiked: currentFilters.hideLiked,
          // Include smart filter mode
          participantFilter: currentFilters.participantFilter,
          minSignals: currentFilters.minSignals,
          maxSignals: currentFilters.maxSignals
        };
      } else {
        // Fallback to basic input (backend should capture current filters)
        filterInput = { name, description, isDefault };
      }

      const result = await saveCurrentFilterAsMutation({
        variables: { filterInput },
        refetchQueries: [
          { query: SAVED_FILTERS_QUERY, variables: { 
            pagination,
            includeRecentCounts: true
          } },
          { query: SAVED_FILTERS_SUMMARY_QUERY },
          ...(isDefault ? [{ query: DEFAULT_SAVED_FILTER_QUERY }] : [])
        ]
      });

      if (result.data?.saveCurrentFilterAs?.success && result.data.saveCurrentFilterAs.savedFilter) {
        toast.success(`Текущие фильтры сохранены как "${name}"!`);
        return result.data.saveCurrentFilterAs.savedFilter;
      } else {
        const errorMessage = result.data?.saveCurrentFilterAs?.message || 'Не удалось сохранить текущий фильтр';
        toast.error(errorMessage);
        setError(errorMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving current filter:', error);
      toast.error(`Failed to save current filter: ${errorMessage}`);
      setError(errorMessage);
      return null;
    }
  }, [saveCurrentFilterAsMutation, pagination]);

  const setAsDefault = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const result = await setDefaultSavedFilterMutation({
        variables: { filterId: id },
        refetchQueries: [
          { query: DEFAULT_SAVED_FILTER_QUERY },
          { query: SAVED_FILTERS_QUERY, variables: { 
            pagination,
            includeRecentCounts: true
          } },
          { query: SAVED_FILTERS_SUMMARY_QUERY }
        ]
      });

      if (result.data?.setDefaultSavedFilter?.success) {
        toast.success('Default filter updated!');
        return true;
      } else {
        const errorMessage = result.data?.setDefaultSavedFilter?.message || 'Failed to set default filter';
        toast.error(errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error setting default filter:', error);
      toast.error(`Failed to set default filter: ${errorMessage}`);
      setError(errorMessage);
      return false;
    }
  }, [setDefaultSavedFilterMutation, pagination]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      fetchMore({
        variables: {
          pagination: {
            page: currentPage + 1,
            pageSize: pagination?.pageSize || 10
          },
          includeRecentCounts: true
        }
      });
    }
  }, [hasNextPage, loading, fetchMore, currentPage, pagination]);

  const refetch = useCallback(() => {
    refetchSavedFilters();
    refetchDefaultFilter();
    refetchSummary();
  }, [refetchSavedFilters, refetchDefaultFilter, refetchSummary]);

  // Clear error when data changes successfully
  useEffect(() => {
    if (savedFiltersData || defaultFilterData || summaryData) {
      setError(null);
    }
  }, [savedFiltersData, defaultFilterData, summaryData]);

  return {
    // Data
    savedFilters,
    defaultFilter,
    summary,
    loading,
    error: error || savedFiltersError?.message || null,

    // Pagination
    totalCount,
    hasNextPage,
    currentPage,
    totalPages,

    // Actions
    createFilter,
    updateFilter,
    deleteFilter,
    applyFilter,
    saveCurrentFilterAs,
    setAsDefault,
    loadMore,
    refetch
  };
} 