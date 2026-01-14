import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface FilterOption {
  id: string;
  name: string;
  active: boolean;
  image?: string | null;
}

interface FilterCategory {
  name: string;
  options: FilterOption[];
}

interface FiltersContextType {
  localFilters: FilterCategory[];
  setLocalFilters: React.Dispatch<React.SetStateAction<FilterCategory[]>>;
  activeFilters: {
    stages: string[];
    rounds: string[];
    participants: string[];
    categories: string[];
    [key: string]: string[];
  };
  activeFiltersCount: number;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredOptions: FilterOption[];
  handleFilterChange: (categoryIndex: number, optionIndex: number) => void;
  handleToggleSelectAll: () => void;
  initializeFilters: (
    endpoint: string,
    availableTabs?: string[]
  ) => Promise<void>;
  fetchFiltersData: (endpoint: string) => Promise<any>;
  applyFilters: (endpoint: string) => Promise<boolean>;
  handleTabChange: (newTab: string, endpoint: string) => Promise<void>;
  tabsModified: Record<string, boolean>;
  resetAllFilters: (endpoint: string) => Promise<boolean>;
  clearFilters: () => void;
  availableTabs: string[];
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [localFilters, setLocalFilters] = useState<FilterCategory[]>([]);
  const [activeFilters, setActiveFilters] = useState<{
    stages: string[];
    rounds: string[];
    participants: string[];
    categories: string[];
    [key: string]: string[];
  }>({
    stages: [],
    rounds: [],
    participants: [],
    categories: []
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('stages');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabsModified, setTabsModified] = useState<Record<string, boolean>>({
    stages: false,
    rounds: false,
    participants: false,
    categories: false
  });
  const [initialized, setInitialized] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<string[]>([
    'stages',
    'rounds',
    'participants',
    'categories'
  ]);

  const { fetchWithAuth, logout } = useAuth();

  const handleAuthError = async (error: any) => {
    if (
      error.message?.includes('Session expired') ||
      error.message?.includes('please login again')
    ) {
      toast.error('Ваша сессия истекла. Пожалуйста, войдите снова.', {
        duration: 1500
      });
      await logout();
      return true;
    }
    return false;
  };

  // Clear filters when panel is closed
  const clearFilters = useCallback(() => {
    if (!isOpen) {
      setLocalFilters([]);
      setInitialized(false);
      console.log('Filters cleared due to panel close');
    }
  }, [isOpen]);

  // Effect to clear filters when panel is closed
  useEffect(() => {
    if (!isOpen) {
      clearFilters();
    }
  }, [isOpen, clearFilters]);

  // Initialize filters when panel is opened
  const initializeFilters = useCallback(
    async (endpoint: string, customAvailableTabs?: string[]) => {
      if (initialized) return;

      console.log('Initializing filters from API');

      try {
        if (!fetchWithAuth) throw new Error('fetchWithAuth is undefined');
        if (!fetchFiltersData) throw new Error('fetchFiltersData is undefined');
        const data = await fetchFiltersData(endpoint);

        if (!data || !data.success) {
          throw new Error('Failed to initialize filters');
        }

        // Determine available tabs based on data
        let detectedAvailableTabs: string[] = [];
        if (data.stages && data.stages.length > 0)
          detectedAvailableTabs.push('stages');
        if (data.rounds && data.rounds.length > 0)
          detectedAvailableTabs.push('rounds');
        if (data.participants && data.participants.length > 0)
          detectedAvailableTabs.push('participants');
        if (data.categories && data.categories.length > 0)
          detectedAvailableTabs.push('categories');

        // If custom tabs are provided, use them
        if (customAvailableTabs) {
          setAvailableTabs(customAvailableTabs);
          // Set first available tab as active
          if (
            customAvailableTabs.length > 0 &&
            !customAvailableTabs.includes(activeTab)
          ) {
            setActiveTab(customAvailableTabs[0]);
          }
        } else {
          // Otherwise use detected tabs
          setAvailableTabs(detectedAvailableTabs);

          // Set first available tab as active if current is not available
          if (
            detectedAvailableTabs.length > 0 &&
            !detectedAvailableTabs.includes(activeTab)
          ) {
            setActiveTab(detectedAvailableTabs[0]);
          }
        }

        // Collect active filters from API response
        const newActiveFilters = {
          stages: data.stages
            ? data.stages
                .filter((stage: any) => stage.active)
                .map((stage: any) => stage.slug)
            : [],
          rounds: data.rounds
            ? data.rounds
                .filter((round: any) => round.active)
                .map((round: any) => round.slug)
            : [],
          participants: data.participants
            ? data.participants
                .filter((participant: any) => participant.active)
                .map((participant: any) => participant.slug)
            : [],
          categories: data.categories
            ? data.categories
                .filter((category: any) => category.active)
                .map((category: any) => category.slug)
            : []
        };

        // Set active filters
        setActiveFilters(newActiveFilters);

        // Create filter categories with properly set active states
        const newFilters: FilterCategory[] = [];

        if (data.stages) {
          newFilters.push({
            name: 'Стадии',
            options: data.stages.map((stage: any) => ({
              id: stage.slug,
              name: stage.name,
              active: newActiveFilters.stages.includes(stage.slug),
              image: null
            }))
          });
        }

        if (data.rounds) {
          newFilters.push({
            name: 'Раунды',
            options: data.rounds.map((round: any) => ({
              id: round.slug,
              name: round.name,
              active: newActiveFilters.rounds.includes(round.slug),
              image: null
            }))
          });
        }

        if (data.participants) {
          newFilters.push({
            name: 'Participants',
            options: data.participants.map((participant: any) => ({
              id: participant.slug,
              name: participant.name,
              active: newActiveFilters.participants.includes(participant.slug),
              image: participant.image || null
            }))
          });
        }

        if (data.categories) {
          newFilters.push({
            name: 'Категории',
            options: data.categories.map((category: any) => ({
              id: category.slug,
              name: category.name,
              active: newActiveFilters.categories.includes(category.slug),
              image: null
            }))
          });
        }

        // Set local filters
        setLocalFilters(newFilters);

        // Reset modification flags
        setTabsModified({
          stages: false,
          rounds: false,
          participants: false,
          categories: false
        });

        setInitialized(true);
        console.log(
          'Filters initialized successfully',
          newFilters,
          newActiveFilters,
          'Available tabs:',
          customAvailableTabs || detectedAvailableTabs
        );
      } catch (error) {
        console.error('Error initializing filters:', error);
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Ошибка инициализации фильтров: ${errorMessage}`, {
            duration: 1500
          });
        }
      }
    },
    [fetchWithAuth, handleAuthError, initialized, activeTab, fetchFiltersData]
  );

  const fetchFiltersData = useCallback(
    async (endpoint: string) => {
      try {
        console.log('Fetching filters data from:', endpoint);
        if (!fetchWithAuth) throw new Error('fetchWithAuth is undefined');
        const response = await fetchWithAuth(endpoint);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          }
          throw new Error('Error loading filter data');
        }

        const data = await response.json();
        console.log('Received filters data:', data);

        if (data.success) {
          return data;
        } else {
          throw new Error(data.message || 'Error loading filter data');
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage, {
            duration: 1500
          });
        }
        throw error;
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // Get filtered options for current tab with additional validation
  const filteredOptions = React.useMemo(() => {
    // Find category index in localFilters array based on active tab
    const categoryIndex = localFilters.findIndex(
      (category) =>
        (activeTab === 'stages' && category.name === 'Стадии') ||
        (activeTab === 'rounds' && category.name === 'Раунды') ||
        (activeTab === 'participants' && category.name === 'Participants') ||
        (activeTab === 'categories' && category.name === 'Категории')
    );

    if (categoryIndex === -1) {
      console.warn(`Category not found for tab ${activeTab}`);
      return [];
    }

    const category = localFilters[categoryIndex];

    // Add debug information
    console.log(`Filtering options for tab ${activeTab}:`, {
      totalOptions: category.options.length,
      searchQuery: searchQuery
    });

    const filtered = searchQuery
      ? category.options.filter((option) =>
          option.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : category.options;

    console.log(`Filtered options count: ${filtered.length}`);

    // Verify that all elements have correct structure
    filtered.forEach((option, idx) => {
      if (!option.id || !option.name) {
        console.warn(`Invalid option at index ${idx}:`, option);
      }
    });

    return filtered;
  }, [localFilters, activeTab, searchQuery]);

  // Updated function for selecting/deselecting all filters
  const handleToggleSelectAll = useCallback(() => {
    // Find category index in localFilters array based on active tab
    const categoryIndex = localFilters.findIndex(
      (category) =>
        (activeTab === 'stages' && category.name === 'Стадии') ||
        (activeTab === 'rounds' && category.name === 'Раунды') ||
        (activeTab === 'participants' && category.name === 'Participants') ||
        (activeTab === 'categories' && category.name === 'Категории')
    );

    if (categoryIndex === -1) {
      console.warn(`Category not found for tab ${activeTab}`);
      return;
    }
    const categoryName = activeTab;

    // Check if all filtered options are active
    const shouldSelectAll = !filteredOptions.every((option) => option.active);

    console.log(`Toggle select all for ${categoryName}: ${shouldSelectAll}`);

    // Update local filters
    setLocalFilters((prevFilters) => {
      const newFilters = [...prevFilters];

      // Update only filtered options
      filteredOptions.forEach((filteredOption) => {
        const optionIndex = newFilters[categoryIndex].options.findIndex(
          (option) => option.id === filteredOption.id
        );

        if (optionIndex !== -1) {
          newFilters[categoryIndex].options[optionIndex].active =
            shouldSelectAll;
        }
      });

      return newFilters;
    });

    // Update active filters array
    setActiveFilters((prev) => {
      const newActiveFilters = { ...prev };

      if (shouldSelectAll) {
        // Add all filtered options to active
        const filteredIds = filteredOptions.map((option) => option.id);
        const currentIds = new Set(newActiveFilters[categoryName]);

        filteredIds.forEach((id) => currentIds.add(id));
        newActiveFilters[categoryName] = Array.from(currentIds);
      } else {
        // Remove all filtered options from active
        const filteredIds = new Set(filteredOptions.map((option) => option.id));
        newActiveFilters[categoryName] = newActiveFilters[categoryName].filter(
          (id) => !filteredIds.has(id)
        );
      }

      return newActiveFilters;
    });

    // Mark tab as modified
    setTabsModified((prev) => ({
      ...prev,
      [categoryName]: true
    }));
  }, [activeTab, filteredOptions, localFilters]);

  // Updated function for changing filter state
  const handleFilterChange = useCallback(
    (categoryIndex: number, optionIndex: number) => {
      // Get filter information
      const category = localFilters[categoryIndex];
      const option = category.options[optionIndex];
      const filterId = option.id;
      const isActive = !option.active;

      // Determine category name for active filters array
      let categoryName: string;

      if (category.name === 'Стадии') categoryName = 'stages';
      else if (category.name === 'Раунды') categoryName = 'rounds';
      else if (category.name === 'Participants') categoryName = 'participants';
      else categoryName = 'categories';

      console.log(
        `Changing filter: ${categoryName} - ${filterId} to ${isActive}`
      );

      // Update local filters
      setLocalFilters((prevFilters) => {
        const newFilters = [...prevFilters];
        newFilters[categoryIndex].options[optionIndex].active = isActive;
        return newFilters;
      });

      // Update active filters array
      setActiveFilters((prev) => {
        const newActiveFilters = { ...prev };

        if (isActive) {
          // Add filter to active if not already present
          if (!newActiveFilters[categoryName].includes(filterId)) {
            newActiveFilters[categoryName] = [
              ...newActiveFilters[categoryName],
              filterId
            ];
          }
        } else {
          // Remove filter from active
          newActiveFilters[categoryName] = newActiveFilters[
            categoryName
          ].filter((id) => id !== filterId);
        }

        return newActiveFilters;
      });

      // Mark tab as modified
      setTabsModified((prev) => ({
        ...prev,
        [categoryName]: true
      }));
    },
    [localFilters]
  );

  // Count active filters
  const activeFiltersCount = React.useMemo(() => {
    // Only count core filters for the badge
    return (
      activeFilters.stages.length +
      activeFilters.rounds.length +
      activeFilters.participants.length +
      activeFilters.categories.length
      // Do NOT count hideLiked, trending, startDate, endDate, minSignals, maxSignals
    );
  }, [activeFilters]);

  // Updated function for switching tabs
  const handleTabChange = useCallback(
    async (newTab: string, endpoint: string) => {
      console.log(`Tab change to ${newTab}`);

      // Log current active filters array
      console.log('Active filters:', JSON.stringify(activeFilters, null, 2));

      // Check if there were changes in any tab
      const hasAnyModifications = Object.values(tabsModified).some(
        (modified) => modified
      );
      console.log('Has any modifications:', hasAnyModifications);

      if (hasAnyModifications) {
        try {
          console.log('Fetching updated filters due to modifications');

          // Create URL with active filter parameters
          const url = new URL(endpoint, window.location.origin);

          // Add active filters to request parameters
          if (activeFilters.stages.length > 0) {
            activeFilters.stages.forEach((stageId) => {
              url.searchParams.append('stages', stageId);
            });
          }

          if (activeFilters.rounds.length > 0) {
            activeFilters.rounds.forEach((roundId) => {
              url.searchParams.append('rounds', roundId);
            });
          }

          if (activeFilters.participants.length > 0) {
            activeFilters.participants.forEach((participantId) => {
              url.searchParams.append('participants', participantId);
            });
          }

          if (activeFilters.categories.length > 0) {
            activeFilters.categories.forEach((categoryId) => {
              url.searchParams.append('categories', categoryId);
            });
          }

          console.log(`Sending request to: ${url.pathname + url.search}`);

          // Get updated filter data from server
          if (!fetchWithAuth) throw new Error('fetchWithAuth is undefined');
          const response = await fetchWithAuth(url.pathname + url.search);

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('Session expired. Please log in again.');
            }
            throw new Error('Error updating filter data');
          }

          const data = await response.json();

          if (data.success) {
            // Update local filters, preserving active states from our activeFilters array
            setLocalFilters((prevFilters) => {
              const newFilters = [...prevFilters];

              // Update filter lists for all categories
              if (data.stages && newFilters[0]) {
                newFilters[0].options = data.stages.map((stage: any) => ({
                  id: stage.slug,
                  name: stage.name,
                  active: activeFilters.stages.includes(stage.slug),
                  image: null
                }));
              }

              if (data.rounds && newFilters[1]) {
                newFilters[1].options = data.rounds.map((round: any) => ({
                  id: round.slug,
                  name: round.name,
                  active: activeFilters.rounds.includes(round.slug),
                  image: null
                }));
              }

              if (data.participants && newFilters[2]) {
                newFilters[2].options = data.participants.map(
                  (participant: any) => ({
                    id: participant.slug,
                    name: participant.name,
                    active: activeFilters.participants.includes(
                      participant.slug
                    ),
                    image: participant.image || null
                  })
                );
              }

              if (data.categories && newFilters[3]) {
                newFilters[3].options = data.categories.map(
                  (category: any) => ({
                    id: category.slug,
                    name: category.name,
                    active: activeFilters.categories.includes(category.slug),
                    image: null
                  })
                );
              }

              return newFilters;
            });

            // Synchronize active filters - remove those that no longer exist in API response
            setActiveFilters((prev) => {
              const newActiveFilters = { ...prev };

              // Get all available IDs from API response
              const availableStageIds = new Set(
                data.stages?.map((item: any) => item.slug) || []
              );
              const availableRoundIds = new Set(
                data.rounds?.map((item: any) => item.slug) || []
              );
              const availableParticipantIds = new Set(
                data.participants?.map((item: any) => item.slug) || []
              );
              const availableCategoryIds = new Set(
                data.categories?.map((item: any) => item.slug) || []
              );

              // Filter active filters, keeping only those present in API response
              newActiveFilters.stages = newActiveFilters.stages.filter((id) =>
                availableStageIds.has(id)
              );
              newActiveFilters.rounds = newActiveFilters.rounds.filter((id) =>
                availableRoundIds.has(id)
              );
              newActiveFilters.participants =
                newActiveFilters.participants.filter((id) =>
                  availableParticipantIds.has(id)
                );
              newActiveFilters.categories = newActiveFilters.categories.filter(
                (id) => availableCategoryIds.has(id)
              );

              // Log updated active filters array after synchronization
              console.log(
                'Active filters after sync:',
                JSON.stringify(newActiveFilters, null, 2)
              );

              return newActiveFilters;
            });

            // Reset all modification flags as we've updated all data
            setTabsModified({
              stages: false,
              rounds: false,
              participants: false,
              categories: false
            });
          } else {
            throw new Error(data.message || 'Error updating filter data');
          }
        } catch (error) {
          console.error('Error in handleTabChange:', error);
          const isAuthError = await handleAuthError(error);
          if (!isAuthError) {
            const errorMessage =
              error instanceof Error ? error.message : 'Неизвестная ошибка';
            toast.error(errorMessage, {
              duration: 1500
            });
          }
        }
      }

      // Обновляем активный таб
      setActiveTab(newTab);

      // Выводим массив активных фильтров после смены таба
      console.log(
        'Active filters after tab change:',
        JSON.stringify(activeFilters, null, 2)
      );
    },
    [activeFilters, fetchWithAuth, handleAuthError, tabsModified]
  );

  // Updated function to reset all filters
  const resetAllFilters = useCallback(
    async (endpoint: string) => {
      console.log('Resetting all filters');

      // Reset active filters
      setActiveFilters({
        stages: [],
        rounds: [],
        participants: [],
        categories: []
      });

      // Reset local filters
      setLocalFilters((prevFilters) => {
        const newFilters = [...prevFilters];

        newFilters.forEach((category) => {
          category.options.forEach((option) => {
            option.active = false;
          });
        });

        return newFilters;
      });

      // Reset modification flags
      setTabsModified({
        stages: false,
        rounds: false,
        participants: false,
        categories: false
      });

      try {
        // Send POST request with empty parameters
        const filterPayload = {
          categories: [],
          stages: [],
          rounds: [],
          participants: []
        };

        console.log('Sending reset POST request with empty payload');
        if (!fetchWithAuth) throw new Error('fetchWithAuth is undefined');
        const response = await fetchWithAuth(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(filterPayload)
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          }
          throw new Error('Error resetting filters');
        }

        const data = await response.json();

        if (data.success) {
          // Update local filters with response data
          if (
            data.stages &&
            data.rounds &&
            data.participants &&
            data.categories
          ) {
            setLocalFilters([
              {
                name: 'Стадии',
                options: data.stages.map((stage: any) => ({
                  id: stage.slug,
                  name: stage.name,
                  active: false,
                  image: null
                }))
              },
              {
                name: 'Раунды',
                options: data.rounds.map((round: any) => ({
                  id: round.slug,
                  name: round.name,
                  active: false,
                  image: null
                }))
              },
              {
                name: 'Participants',
                options: data.participants.map((participant: any) => ({
                  id: participant.slug,
                  name: participant.name,
                  active: false,
                  image: participant.image || null
                }))
              },
              {
                name: 'Категории',
                options: data.categories.map((category: any) => ({
                  id: category.slug,
                  name: category.name,
                  active: false,
                  image: null
                }))
              }
            ]);
          }

          // Dispatch filter reset event
          const resetEvent = new CustomEvent('filters-reset', {
            detail: { timestamp: Date.now() }
          });
          window.dispatchEvent(resetEvent);

          toast.success('Фильтры сброшены', {
            duration: 1500
          });
          return true;
        } else {
          throw new Error(data.message || 'Error resetting filters');
        }
      } catch (error) {
        console.error('Error in resetAllFilters:', error);
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage, {
            duration: 1500
          });
        }
        return false;
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // Updated function to apply filters
  const applyFilters = useCallback(
    async (endpoint: string) => {
      console.log('Applying filters');

      try {
        // Create object with active filters for server request
        const filterPayload = {
          categories: activeFilters.categories,
          stages: activeFilters.stages,
          rounds: activeFilters.rounds,
          participants: activeFilters.participants
        };

        console.log('Filter payload:', filterPayload);

        // Send request to apply filters
        if (!fetchWithAuth) throw new Error('fetchWithAuth is undefined');
        const response = await fetchWithAuth(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(filterPayload)
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          }
          throw new Error('Error applying filters');
        }

        const data = await response.json();

        if (data.success) {
          // Update local filters with response data
          if (
            data.stages &&
            data.rounds &&
            data.participants &&
            data.categories
          ) {
            setLocalFilters([
              {
                name: 'Стадии',
                options: data.stages.map((stage: any) => ({
                  id: stage.slug,
                  name: stage.name,
                  active: activeFilters.stages.includes(stage.slug),
                  image: null
                }))
              },
              {
                name: 'Раунды',
                options: data.rounds.map((round: any) => ({
                  id: round.slug,
                  name: round.name,
                  active: activeFilters.rounds.includes(round.slug),
                  image: null
                }))
              },
              {
                name: 'Participants',
                options: data.participants.map((participant: any) => ({
                  id: participant.slug,
                  name: participant.name,
                  active: activeFilters.participants.includes(participant.slug),
                  image: participant.image || null
                }))
              },
              {
                name: 'Категории',
                options: data.categories.map((category: any) => ({
                  id: category.slug,
                  name: category.name,
                  active: activeFilters.categories.includes(category.slug),
                  image: null
                }))
              }
            ]);
          }

          // Reset modification flags
          setTabsModified({
            stages: false,
            rounds: false,
            participants: false,
            categories: false
          });

          // Close filters panel
          setIsOpen(false);

          toast.success('Фильтры применены', {
            duration: 1500
          });
          return true;
        } else {
          throw new Error(data.message || 'Error applying filters');
        }
      } catch (error) {
        console.error('Error in applyFilters:', error);
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage, {
            duration: 1500
          });
        }
        return false;
      }
    },
    [activeFilters, fetchWithAuth, handleAuthError]
  );

  return (
    <FiltersContext.Provider
      value={{
        localFilters,
        setLocalFilters,
        activeFilters,
        activeFiltersCount,
        isOpen,
        setIsOpen,
        activeTab,
        setActiveTab,
        handleTabChange,
        searchQuery,
        setSearchQuery,
        filteredOptions,
        handleFilterChange,
        handleToggleSelectAll,
        initializeFilters,
        fetchFiltersData,
        applyFilters,
        tabsModified,
        resetAllFilters,
        clearFilters,
        availableTabs
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
}
