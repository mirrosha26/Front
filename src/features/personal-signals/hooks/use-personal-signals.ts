'use client';

import { usePersonalSignals } from '../contexts/personal-signals-context';
import { useCallback } from 'react';
import { setCookie } from 'cookies-next';

export function usePersonalSignalsActions() {
  const {
    signals,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    fetchSignals,
    applyFilters,
    currentFilters
  } = usePersonalSignals();

  // Загрузка определенной страницы
  const loadPage = useCallback(
    (page: number, appendMode = false) => {
      fetchSignals({ ...currentFilters, page }, appendMode);
    },
    [fetchSignals, currentFilters]
  );

  // Изменение размера страницы
  const changePageSize = useCallback(
    (pageSize: number) => {
      fetchSignals({ ...currentFilters, page_size: pageSize, page: 1 });
    },
    [fetchSignals, currentFilters]
  );

  // Поиск по карточкам
  const searchCards = useCallback(
    (searchQuery: string) => {
      fetchSignals({ ...currentFilters, search: searchQuery, page: 1 });
    },
    [fetchSignals, currentFilters]
  );

  // Сброс всех фильтров к значениям по умолчанию
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      min_sig: 1,
      page: 1,
      page_size: 20
    };

    // Сбрасываем куки
    setCookie('personal-signals-filters', JSON.stringify(defaultFilters), {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    // Сбрасываем localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'personal-signals-filters',
        JSON.stringify(defaultFilters)
      );
    }

    // Применяем фильтры по умолчанию
    fetchSignals(defaultFilters);
  }, [fetchSignals]);

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

    // Дополнительные методы
    loadPage,
    changePageSize,
    searchCards,
    resetFilters
  };
}
