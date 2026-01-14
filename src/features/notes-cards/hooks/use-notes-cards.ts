'use client';

import { useNotesCards } from '../contexts/notes-cards-context';
import { useState, useCallback } from 'react';

export function useNotesCardsActions() {
  const {
    notesCards,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    fetchNotesCards,
    applyFilters,
    currentFilters
  } = useNotesCards();

  // Загрузка определенной страницы
  const loadPage = useCallback(
    (page: number, appendMode = false) => {
      fetchNotesCards({ ...currentFilters, page }, appendMode);
    },
    [fetchNotesCards, currentFilters]
  );

  // Изменение размера страницы
  const changePageSize = useCallback(
    (pageSize: number) => {
      fetchNotesCards({ ...currentFilters, page_size: pageSize, page: 1 });
    },
    [fetchNotesCards, currentFilters]
  );

  // Поиск по карточкам
  const searchCards = useCallback(
    (searchQuery: string) => {
      fetchNotesCards({ ...currentFilters, search: searchQuery, page: 1 });
    },
    [fetchNotesCards, currentFilters]
  );

  return {
    notesCards,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    fetchNotesCards,
    applyFilters,
    currentFilters,

    // Дополнительные методы
    loadPage,
    changePageSize,
    searchCards
  };
}
