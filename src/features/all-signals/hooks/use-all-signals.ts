'use client';

import { useAllSignals } from '../contexts/all-signals-context';
import { useState, useCallback } from 'react';
import { setCookie } from 'cookies-next';

// Map для отслеживания активных запросов
const activeRequests = new Map<string, Promise<any>>();

export function useAllSignalsActions() {
  const {
    signals,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    fetchSignals,
    applyFilters,
    currentFilters,
    resetFilters: contextResetFilters,
    filtersData,
    isLoadingFilters,
    filtersLoaded,
    fetchFiltersData,
    handleToggleFavorite,
    handleAddNote,
    setCurrentFilters
  } = useAllSignals();

  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка определенной страницы
  const loadPage = useCallback(
    async (page: number, appendMode = false) => {
      // Создаем уникальный ключ для запроса
      const requestKey = `all-signals-${JSON.stringify(currentFilters)}-page-${page}-append-${appendMode}`;
      
      // Если запрос уже выполняется, ждем его завершения
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Request already in progress for ${requestKey}, waiting...`);
        return await activeRequests.get(requestKey);
      }

      console.log(`🚀 Starting new request for ${requestKey}`);
      
      // Создаем промис для запроса
      const requestPromise = (async () => {
        try {
          await fetchSignals({ ...currentFilters, page }, appendMode);
        } catch (error) {
          console.error('Error in loadPage:', error);
          throw error;
        } finally {
          // Удаляем запрос из активных
          activeRequests.delete(requestKey);
        }
      })();

      // Сохраняем промис в активных запросах
      activeRequests.set(requestKey, requestPromise);
      
      return await requestPromise;
    },
    [fetchSignals, currentFilters]
  );

  // Изменение размера страницы
  const changePageSize = useCallback(
    async (pageSize: number) => {
      const requestKey = `all-signals-pagesize-${pageSize}`;
      
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Page size change already in progress, waiting...`);
        return await activeRequests.get(requestKey);
      }

      const requestPromise = (async () => {
        try {
          await fetchSignals({ ...currentFilters, page_size: pageSize, page: 1 });
        } finally {
          activeRequests.delete(requestKey);
        }
      })();

      activeRequests.set(requestKey, requestPromise);
      return await requestPromise;
    },
    [fetchSignals, currentFilters]
  );

  // Поиск карточек
  const searchCards = useCallback(
    async (query: string) => {
      const requestKey = `all-signals-search-${query}`;
      
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Search already in progress, waiting...`);
        return await activeRequests.get(requestKey);
      }

      const requestPromise = (async () => {
        try {
          setSearchQuery(query);
          await fetchSignals({ ...currentFilters, search: query, page: 1 });
        } finally {
          activeRequests.delete(requestKey);
        }
      })();

      activeRequests.set(requestKey, requestPromise);
      return await requestPromise;
    },
    [fetchSignals, currentFilters]
  );

  // Применение фильтров
  const handleApplyFilters = useCallback(
    async (filters: Record<string, any>) => {
      const requestKey = `all-signals-filters-${JSON.stringify(filters)}`;
      
      if (activeRequests.has(requestKey)) {
        console.log(`⏳ Filter application already in progress, waiting...`);
        return await activeRequests.get(requestKey);
      }

      const requestPromise = (async () => {
        try {
          // Используем функцию applyFilters из контекста
          await applyFilters({
            ...filters,
            page: 1,
            page_size: 20
          });
        } finally {
          activeRequests.delete(requestKey);
        }
      })();

      activeRequests.set(requestKey, requestPromise);
      return await requestPromise;
    },
    [applyFilters]
  );

  // Сброс фильтров - используем функцию из контекста
  const handleResetFilters = useCallback(async () => {
    setSearchQuery('');
    return await contextResetFilters();
  }, [contextResetFilters]);

  return {
    signals,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    fetchSignals,
    applyFilters,
    currentFilters,
    resetFilters: handleResetFilters,
    filtersData,
    isLoadingFilters,
    filtersLoaded,
    fetchFiltersData,
    handleToggleFavorite,
    handleAddNote,
    setCurrentFilters,
    searchQuery,

    // Дополнительные методы
    loadPage,
    changePageSize,
    searchCards,
    handleApplyFilters
  };
}
