'use client';

import { useNotesCards } from '../contexts/notes-cards-graphql-context';
import { useCallback } from 'react';

export function useNotesCardsGraphQLActions() {
  const {
    notesCards,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    fetchNotesCards,
    applyFilters,
    handleDeleteNote,
    handleUpdateNote,
    handleToggleFavorite,
    loadMore,
    resetFilters,
    setCurrentFilters
  } = useNotesCards();

  // Search cards
  const searchCards = useCallback(
    (searchQuery: string) => {
      fetchNotesCards({ ...currentFilters, search: searchQuery, page: 1 }, false);
    },
    [fetchNotesCards, currentFilters]
  );

  // Load specific page
  const loadPage = useCallback(
    (page: number, appendMode = false) => {
      fetchNotesCards({ ...currentFilters, page }, appendMode);
    },
    [fetchNotesCards, currentFilters]
  );

  // Change page size
  const changePageSize = useCallback(
    (pageSize: number) => {
      fetchNotesCards({ ...currentFilters, page_size: pageSize, page: 1 }, false);
    },
    [fetchNotesCards, currentFilters]
  );

  return {
    // State
    notesCards,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,

    // Actions
    fetchNotesCards,
    applyFilters,
    searchCards,
    loadPage,
    changePageSize,
    loadMore,
    resetFilters,
    setCurrentFilters,

    // Card operations
    handleDeleteNote,
    handleUpdateNote,
    handleToggleFavorite
  };
} 