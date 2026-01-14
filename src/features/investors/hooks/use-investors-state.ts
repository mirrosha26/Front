'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { InvestorTab } from '../contexts/investors-graphql-context';

interface InvestorsState {
  selectedFilters: InvestorTab[];
  searchTerm: string;
  sidebarScrollTop: number;
  mainScrollTop: number;
  selectedCategories: string[];
  savedFilter: 'all' | 'saved' | 'not_saved';
}

const STORAGE_KEY = 'investors_page_state';

export function useInvestorsState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [state, setState] = useState<InvestorsState>({
    selectedFilters: [], // Пустой массив означает "All"
    searchTerm: '',
    sidebarScrollTop: 0,
    mainScrollTop: 0,
    selectedCategories: [],
    savedFilter: 'all'
  });

  // Загружаем состояние из localStorage при инициализации
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(prev => ({ ...prev, ...parsedState }));
      } catch (error) {
        console.warn('Failed to parse saved investors state:', error);
      }
    }
  }, []);

  // Сохраняем состояние в localStorage при изменении
  const saveState = useCallback((newState: Partial<InvestorsState>) => {
    console.log('🔍 saveState called with:', newState);
    console.log('🔍 Previous state:', state);
    const updatedState = { ...state, ...newState };
    console.log('🔍 Updated state:', updatedState);
    setState(updatedState);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      console.log('🔍 State saved to localStorage');
    } catch (error) {
      console.warn('Failed to save investors state:', error);
    }
  }, [state]);

  // Обновляем URL с параметрами фильтров и скролла
  const updateURL = useCallback((filters: InvestorTab[], search: string, categories: string[], savedFilter: string, scrollTop?: number) => {
    console.log('🔍 updateURL called with:', { filters, search, categories, savedFilter, scrollTop });
    console.log('🔍 Current searchParams:', searchParams.toString());
    
    const params = new URLSearchParams(searchParams);
    
    // Фильтры
    if (filters.length > 0) {
      params.set('filters', filters.join(','));
      console.log('🔍 Setting filters param to:', filters.join(','));
    } else {
      params.delete('filters');
      console.log('🔍 Deleting filters param (empty array)');
    }
    
    // Поиск
    if (search) {
      params.set('search', search);
      console.log('🔍 Setting search param to:', search);
    } else {
      params.delete('search');
      console.log('🔍 Deleting search param (empty string)');
    }

    // Категории
    if (categories.length > 0) {
      params.set('categories', categories.join(','));
      console.log('🔍 Setting categories param to:', categories.join(','));
    } else {
      params.delete('categories');
      console.log('🔍 Deleting categories param (empty array)');
    }

    // Фильтр сохраненных
    if (savedFilter !== 'all') {
      params.set('saved', savedFilter);
      console.log('🔍 Setting saved param to:', savedFilter);
    } else {
      params.delete('saved');
      console.log('🔍 Deleting saved param (all)');
    }

    // Позиция скролла (только если передана)
    if (scrollTop !== undefined) {
      params.set('scroll', scrollTop.toString());
      console.log('🔍 Setting scroll param to:', scrollTop);
    }

    const newURL = `${pathname}?${params.toString()}`;
    console.log('🔍 New URL will be:', newURL);
    router.replace(newURL, { scroll: false });
  }, [pathname, searchParams, router]);

  // Синхронизируем состояние с URL
  useEffect(() => {
    const urlFilters = searchParams.get('filters');
    const urlSearch = searchParams.get('search');
    const urlCategories = searchParams.get('categories');
    const urlSaved = searchParams.get('saved');
    const urlScroll = searchParams.get('scroll');
    
    // Если нет фильтров в URL или пустая строка, значит выбрано "All"
    const filters = urlFilters && urlFilters.trim() !== '' ? urlFilters.split(',') as InvestorTab[] : [];
    const search = urlSearch || '';
    const categories = urlCategories && urlCategories.trim() !== '' ? urlCategories.split(',') : [];
    const savedFilter = (urlSaved as 'all' | 'saved' | 'not_saved') || 'all';
    const scrollTop = urlScroll ? parseInt(urlScroll, 10) : 0;
    
    setState(prev => ({
      ...prev,
      selectedFilters: filters,
      searchTerm: search,
      selectedCategories: categories,
      savedFilter: savedFilter,
      mainScrollTop: scrollTop
    }));
  }, [searchParams]);

  // Функции для работы с фильтрами
  const setSelectedFilters = useCallback((filters: InvestorTab[] | ((prev: InvestorTab[]) => InvestorTab[])) => {
    console.log('🔍 setSelectedFilters called with:', filters);
    console.log('🔍 Previous state.selectedFilters:', state.selectedFilters);
    
    let newFilters: InvestorTab[];
    
    if (typeof filters === 'function') {
      // Если передана функция, вызываем её с текущими фильтрами
      newFilters = filters(state.selectedFilters);
      console.log('🔍 Function result:', newFilters);
    } else {
      // Если передан массив, используем его
      newFilters = filters;
      console.log('🔍 Direct array:', newFilters);
    }
    
    // Убеждаемся, что newFilters - это массив
    if (!Array.isArray(newFilters)) {
      console.error('🔍 Error: newFilters is not an array:', newFilters);
      newFilters = [];
    }
    
    console.log('🔍 Final newFilters:', newFilters);
    console.log('🔍 Current state.searchTerm:', state.searchTerm);
    console.log('🔍 Current state.selectedCategories:', state.selectedCategories);
    console.log('🔍 Current state.savedFilter:', state.savedFilter);
    
    saveState({ selectedFilters: newFilters });
    
    console.log('🔍 Calling updateURL with:', {
      filters: newFilters,
      searchTerm: state.searchTerm,
      selectedCategories: state.selectedCategories,
      savedFilter: state.savedFilter
    });
    
    updateURL(newFilters, state.searchTerm, state.selectedCategories, state.savedFilter);
    console.log('🔍 setSelectedFilters completed, new state.selectedFilters should be:', newFilters);
  }, [saveState, updateURL, state.searchTerm, state.selectedCategories, state.savedFilter, state.selectedFilters]);

  const toggleFilter = useCallback((filter: InvestorTab) => {
    console.log('🔍 useInvestorsState toggleFilter called with:', filter);
    console.log('🔍 Current state.selectedFilters:', state.selectedFilters);
    
    if (filter === 'all') {
      // All снимает все фильтры
      const newFilters: InvestorTab[] = [];
      console.log('🔍 All selected, setting newFilters to:', newFilters);
      setSelectedFilters(newFilters);
      console.log('🔍 All selected, cleared all filters');
    } else {
      // Выбор любого другого фильтра снимает все остальные
      const newFilters: InvestorTab[] = [filter];
      console.log('🔍 Selected filter:', filter, 'setting newFilters to:', newFilters);
      setSelectedFilters(newFilters);
      console.log('🔍 Selected filter:', filter, 'cleared others');
    }
  }, [setSelectedFilters, state.selectedFilters]);

  const setSearchTerm = useCallback((search: string) => {
    saveState({ searchTerm: search });
    updateURL(state.selectedFilters, search, state.selectedCategories, state.savedFilter);
  }, [saveState, updateURL, state.selectedFilters, state.selectedCategories, state.savedFilter]);

  // Функции для работы с категориями
  const setSelectedCategories = useCallback((categories: string[]) => {
    saveState({ selectedCategories: categories });
    updateURL(state.selectedFilters, state.searchTerm, categories, state.savedFilter);
  }, [saveState, updateURL, state.selectedFilters, state.searchTerm, state.savedFilter]);

  const toggleCategory = useCallback((category: string) => {
    const newCategories = state.selectedCategories.includes(category)
      ? state.selectedCategories.filter(c => c !== category)
      : [...state.selectedCategories, category];
    
    setSelectedCategories(newCategories);
  }, [state.selectedCategories, setSelectedCategories]);

  const clearCategories = useCallback(() => {
    setSelectedCategories([]);
  }, [setSelectedCategories]);

  // Функции для работы с сохраненным фильтром
  const setSavedFilter = useCallback((savedFilter: 'all' | 'saved' | 'not_saved') => {
    saveState({ savedFilter });
    updateURL(state.selectedFilters, state.searchTerm, state.selectedCategories, savedFilter);
  }, [saveState, updateURL, state.selectedFilters, state.searchTerm, state.selectedCategories]);

  // Функции для работы со скроллом
  const saveSidebarScroll = useCallback((scrollTop: number) => {
    saveState({ sidebarScrollTop: scrollTop });
  }, [saveState]);

  const saveMainScroll = useCallback((scrollTop: number) => {
    saveState({ mainScrollTop: scrollTop });
    // Обновляем URL с позицией скролла
    updateURL(state.selectedFilters, state.searchTerm, state.selectedCategories, state.savedFilter, scrollTop);
  }, [saveState, updateURL, state.selectedFilters, state.searchTerm, state.selectedCategories, state.savedFilter]);

  // Восстанавливаем позицию скролла при загрузке страницы
  const restoreScrollPosition = useCallback(() => {
    return {
      sidebarScrollTop: state.sidebarScrollTop,
      mainScrollTop: state.mainScrollTop
    };
  }, [state.sidebarScrollTop, state.mainScrollTop]);

  // Очищаем состояние при переходе на другую страницу
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Сохраняем текущий скролл перед уходом
      const sidebarElement = document.querySelector('[data-sidebar-scroll]');
      const mainElement = document.querySelector('[data-main-scroll]');
      
      if (sidebarElement) {
        saveSidebarScroll(sidebarElement.scrollTop);
      }
      if (mainElement) {
        saveMainScroll(mainElement.scrollTop);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveSidebarScroll, saveMainScroll]);

  return {
    // Состояние
    selectedFilters: state.selectedFilters,
    searchTerm: state.searchTerm,
    selectedCategories: state.selectedCategories,
    savedFilter: state.savedFilter,
    sidebarScrollTop: state.sidebarScrollTop,
    mainScrollTop: state.mainScrollTop,

    // Действия с фильтрами
    setSelectedFilters,
    toggleFilter,
    setSearchTerm,
    setSelectedCategories,
    toggleCategory,
    clearCategories,
    setSavedFilter,

    // Действия со скроллом
    saveSidebarScroll,
    saveMainScroll,
    restoreScrollPosition
  };
} 