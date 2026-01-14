'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { toast } from 'sonner';
import { Investor } from '../types';
import { useAuth } from '@/contexts/auth-context';

interface InvestorsContextType {
  investors: Investor[];
  followedInvestors: Investor[];
  availableInvestors: Investor[];
  isLoading: boolean;
  error: string | null;
  fetchInvestors: (
    savedParam?: boolean,
    forceRefresh?: boolean
  ) => Promise<void>;
  followInvestor: (id: number) => Promise<boolean>;
  unfollowInvestor: (id: number) => Promise<boolean>;
  followAllInvestors: () => Promise<boolean>;
  unfollowAllInvestors: () => Promise<boolean>;
  filteredInvestors: Investor[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTypes: string[];
  toggleType: (type: string) => void;
  showFollowed: boolean;
  setShowFollowed: (value: boolean) => void;
  followedCount: number;
  availableCount: number;
}

const InvestorsContext = createContext<InvestorsContextType | undefined>(
  undefined
);

export function InvestorsProvider({ children }: { children: ReactNode }) {
  const { fetchWithAuth } = useAuth();
  // Split investors into two categories
  const [followedInvestors, setFollowedInvestors] = useState<Investor[]>([]);
  const [availableInvestors, setAvailableInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFollowed, setShowFollowed] = useState(true); // Start with subscriptions

  // Get current active list based on selected tab
  const investors = showFollowed ? followedInvestors : availableInvestors;

  // Cache loading state for each list type
  const [followedLoaded, setFollowedLoaded] = useState(false);
  const [availableLoaded, setAvailableLoaded] = useState(false);

  // Filter investors by search and types
  const filteredInvestors = investors.filter((investor) => {
    const nameMatch =
      investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.additional_name.toLowerCase().includes(searchTerm.toLowerCase());

    const typeMatch =
      selectedTypes.length === 0 ||
      selectedTypes.includes(investor.type.toLowerCase()) ||
      (selectedTypes.includes('private') && investor.is_private);

    return nameMatch && typeMatch;
  });

  // Toggle type in filter
  const toggleType = (type: string) => {
    setSelectedTypes((prevTypes) =>
      prevTypes.includes(type)
        ? prevTypes.filter((t) => t !== type)
        : [...prevTypes, type]
    );
  };

  // Load investors from API
  const fetchInvestors = async (
    savedParam?: boolean,
    forceRefresh?: boolean
  ) => {
    const isSaved = savedParam !== undefined ? savedParam : showFollowed;

    // Check if data is already loaded for this type
    if (
      !forceRefresh &&
      ((isSaved && followedLoaded) || (!isSaved && availableLoaded))
    ) {
      console.log(
        `Data for ${isSaved ? 'followed' : 'available'} already loaded, skipping request`
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!fetchWithAuth) {
        throw new Error('Authentication not available');
      }

      const url = `/api/investors?saved=${isSaved}`;

      console.log(`Requesting investors with saved=${isSaved}`);
      const response = await fetchWithAuth(url);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      // Check different possible response structures
      let investorsData = [];

      if (data.success === false) {
        throw new Error(data.message || 'Error getting data');
      }

      // Extract data from response
      if (data.data && Array.isArray(data.data)) {
        investorsData = data.data;
      } else if (Array.isArray(data)) {
        investorsData = data;
      } else if (data.results && Array.isArray(data.results)) {
        investorsData = data.results;
      } else {
        console.warn('Unexpected data structure:', data);
        investorsData = [];
      }

      // Mark investors as followed
      const processedInvestors = investorsData.map((investor) => ({
        ...investor,
        is_followed: isSaved
      }));

      // Save data to appropriate list
      if (isSaved) {
        setFollowedInvestors(processedInvestors);
        setFollowedLoaded(true);
      } else {
        setAvailableInvestors(processedInvestors);
        setAvailableLoaded(true);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading investors:', error);
      toast.error('Не удалось загрузить список инвесторов. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  // Follow investor
  const followInvestor = async (id: number): Promise<boolean> => {
    try {
      if (!fetchWithAuth) {
        throw new Error('Authentication not available');
      }

      const response = await fetchWithAuth('/api/investors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participant_id: id })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.message || 'Error following investor');
      }

      // Find investor in available list
      const investorToFollow = availableInvestors.find((inv) => inv.id === id);

      if (investorToFollow) {
        // Remove from available
        setAvailableInvestors((prev) => prev.filter((inv) => inv.id !== id));

        // Add to followed
        setFollowedInvestors((prev) => [
          ...prev,
          { ...investorToFollow, is_followed: true }
        ]);
      }

      toast.success('Инвестор успешно добавлен в избранное');
      return true;
    } catch (error) {
      console.error('Error following investor:', error);
      toast.error('Не удалось добавить инвестора в избранное. Попробуйте еще раз.');
      return false;
    }
  };

  // Unfollow investor
  const unfollowInvestor = async (id: number): Promise<boolean> => {
    try {
      if (!fetchWithAuth) {
        throw new Error('Authentication not available');
      }

      const response = await fetchWithAuth('/api/investors', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participant_id: id })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.message || 'Error unfollowing investor');
      }

      // Find investor in followed list
      const investorToUnfollow = followedInvestors.find((inv) => inv.id === id);

      if (investorToUnfollow) {
        // Remove from followed
        setFollowedInvestors((prev) => prev.filter((inv) => inv.id !== id));

        // Add to available
        setAvailableInvestors((prev) => [
          ...prev,
          { ...investorToUnfollow, is_followed: false }
        ]);
      }

      toast.success('Инвестор успешно удален из избранного');
      return true;
    } catch (error) {
      console.error('Error unfollowing investor:', error);
      toast.error('Не удалось удалить инвестора из избранного. Попробуйте еще раз.');
      return false;
    }
  };

  // Follow all filtered investors
  const followAllInvestors = async (): Promise<boolean> => {
    try {
      if (!fetchWithAuth) {
        throw new Error('Authentication not available');
      }

      // Get IDs of all filtered investors
      const investorsToFollow = filteredInvestors.map(
        (investor) => investor.id
      );

      if (investorsToFollow.length === 0) {
        toast.info('No investors to follow');
        return true;
      }

      // Execute bulk request
      const response = await fetchWithAuth('/api/investors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participant_ids: investorsToFollow })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.message || 'Error following investors');
      }

      // Move investors from available to followed
      const investorsToMove = availableInvestors.filter((inv) =>
        investorsToFollow.includes(inv.id)
      );

      setAvailableInvestors((prev) =>
        prev.filter((inv) => !investorsToFollow.includes(inv.id))
      );

      setFollowedInvestors((prev) => [
        ...prev,
        ...investorsToMove.map((inv) => ({ ...inv, is_followed: true }))
      ]);

      toast.success(
        `Успешно добавлено в избранное ${data.saved_count || investorsToFollow.length} инвесторов`
      );
      return true;
    } catch (error) {
      console.error('Error bulk following:', error);
      toast.error('Не удалось добавить инвесторов в избранное. Попробуйте еще раз.');
      return false;
    }
  };

  // Unfollow all filtered investors
  const unfollowAllInvestors = async (): Promise<boolean> => {
    try {
      if (!fetchWithAuth) {
        throw new Error('Authentication not available');
      }

      // Get IDs of all filtered investors
      const investorsToUnfollow = filteredInvestors.map(
        (investor) => investor.id
      );

      if (investorsToUnfollow.length === 0) {
        toast.info('No investors to unfollow');
        return true;
      }

      // Execute bulk request
      const response = await fetchWithAuth('/api/investors', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participant_ids: investorsToUnfollow })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.message || 'Error unfollowing investors');
      }

      // Move investors from followed to available
      const investorsToMove = followedInvestors.filter((inv) =>
        investorsToUnfollow.includes(inv.id)
      );

      setFollowedInvestors((prev) =>
        prev.filter((inv) => !investorsToUnfollow.includes(inv.id))
      );

      setAvailableInvestors((prev) => [
        ...prev,
        ...investorsToMove.map((inv) => ({ ...inv, is_followed: false }))
      ]);

      toast.success(
        `Успешно удалено из избранного ${data.deleted_count || investorsToUnfollow.length} инвесторов`
      );
      return true;
    } catch (error) {
      console.error('Error bulk unfollowing:', error);
      toast.error('Не удалось удалить инвесторов из избранного. Попробуйте еще раз.');
      return false;
    }
  };

  // Load investors on first render
  useEffect(() => {
    fetchInvestors(true); // First load followed
  }, []);

  // Calculate counters
  const followedCount = followedInvestors.length;
  const availableCount = availableInvestors.length;

  return (
    <InvestorsContext.Provider
      value={{
        investors,
        followedInvestors,
        availableInvestors,
        isLoading,
        error,
        fetchInvestors,
        followInvestor,
        unfollowInvestor,
        followAllInvestors,
        unfollowAllInvestors,
        filteredInvestors,
        searchTerm,
        setSearchTerm,
        selectedTypes,
        toggleType,
        showFollowed,
        setShowFollowed,
        followedCount,
        availableCount
      }}
    >
      {children}
    </InvestorsContext.Provider>
  );
}

// Hook for using investors context
export function useInvestors() {
  const context = useContext(InvestorsContext);
  if (context === undefined) {
    throw new Error('useInvestors must be used within InvestorsProvider');
  }
  return context;
}
