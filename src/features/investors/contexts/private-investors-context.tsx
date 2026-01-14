'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { toast } from 'sonner';
import {
  PrivateInvestorsData,
  PrivateInvestorRequest,
  PrivateInvestor
} from '../types';
import { useAuth } from '@/contexts/auth-context';

interface PrivateInvestorsContextType {
  data: PrivateInvestorsData;
  isLoading: boolean;
  error: string | null;
  fetchPrivateInvestors: () => Promise<void>;
  createPrivateInvestorRequest: (
    request: Partial<PrivateInvestorRequest>
  ) => Promise<boolean>;
  deletePrivateInvestorRequest: (id: number) => Promise<boolean>;
  followPrivateInvestor: (id: number) => Promise<boolean>;
  unfollowPrivateInvestor: (id: number) => Promise<boolean>;
}

const PrivateInvestorsContext = createContext<
  PrivateInvestorsContextType | undefined
>(undefined);

export function PrivateInvestorsProvider({
  children
}: {
  children: ReactNode;
}) {
  const { fetchWithAuth } = useAuth();
  const [data, setData] = useState<PrivateInvestorsData>({
    pending_requests: [],
    processing_requests: [],
    investors_with_signals: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load private investors data
  const fetchPrivateInvestors = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!fetchWithAuth) {
        throw new Error('Authentication not available');
      }

      const response = await fetchWithAuth('/api/investors/private');

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success === false) {
        throw new Error(responseData.message || 'Error fetching data');
      }

      // Extract data from response
      if (responseData.data) {
        setData(responseData.data);
      } else {
        console.warn('Unexpected data structure:', responseData);
        setData({
          pending_requests: [],
          processing_requests: [],
          investors_with_signals: []
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading private investors:', error);
      toast.error('Не удалось загрузить список приватных инвесторов. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create private investor request
  const createPrivateInvestorRequest = async (
    request: Partial<PrivateInvestorRequest>
  ): Promise<boolean> => {
    try {
      if (!fetchWithAuth) {
        throw new Error('Authentication not available');
      }

      const response = await fetchWithAuth('/api/investors/private', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success === false) {
        throw new Error(responseData.message || 'Error creating request');
      }

      // Update requests list
      await fetchPrivateInvestors();

      toast.success('Запрос на инвестора успешно создан');
      return true;
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Не удалось создать запрос. Попробуйте еще раз.');
      return false;
    }
  };

  // Delete private investor request
  const deletePrivateInvestorRequest = async (id: number): Promise<boolean> => {
    try {
      if (!fetchWithAuth) {
        throw new Error('Authentication not available');
      }

      const response = await fetchWithAuth('/api/investors/private', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ req_id: id })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success === false) {
        throw new Error(responseData.message || 'Error deleting request');
      }

      // Update requests list after deletion
      setData((prevData) => ({
        ...prevData,
        pending_requests: prevData.pending_requests.filter(
          (request) => request.id !== id
        ),
        processing_requests: prevData.processing_requests.filter(
          (request) => request.id !== id
        )
      }));

      toast.success('Запрос успешно удален');
      return true;
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Не удалось удалить запрос. Попробуйте еще раз.');
      return false;
    }
  };

  // Follow private investor
  const followPrivateInvestor = async (id: number): Promise<boolean> => {
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

      const responseData = await response.json();

      if (responseData.success === false) {
        throw new Error(responseData.message || 'Error following investor');
      }

      // Update investor state in the list
      setData((prevData) => ({
        ...prevData,
        investors_with_signals: prevData.investors_with_signals.map(
          (investor) =>
            investor.id === id ? { ...investor, is_subscribed: true } : investor
        )
      }));

      toast.success('Инвестор успешно добавлен в избранное');
      return true;
    } catch (error) {
      console.error('Error following investor:', error);
      toast.error('Не удалось добавить инвестора в избранное. Попробуйте еще раз.');
      return false;
    }
  };

  // Unfollow private investor
  const unfollowPrivateInvestor = async (id: number): Promise<boolean> => {
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

      const responseData = await response.json();

      if (responseData.success === false) {
        throw new Error(responseData.message || 'Error unfollowing investor');
      }

      // Update investor state in the list
      setData((prevData) => ({
        ...prevData,
        investors_with_signals: prevData.investors_with_signals.map(
          (investor) =>
            investor.id === id
              ? { ...investor, is_subscribed: false }
              : investor
        )
      }));

      toast.success('Инвестор успешно удален из избранного');
      return true;
    } catch (error) {
      console.error('Error unfollowing investor:', error);
      toast.error('Не удалось удалить инвестора из избранного. Попробуйте еще раз.');
      return false;
    }
  };


  // Load data on first render
  useEffect(() => {
    fetchPrivateInvestors();
  }, []);

  return (
    <PrivateInvestorsContext.Provider
      value={{
        data,
        isLoading,
        error,
        fetchPrivateInvestors,
        createPrivateInvestorRequest,
        deletePrivateInvestorRequest,
        followPrivateInvestor,
        unfollowPrivateInvestor,
      }}
    >
      {children}
    </PrivateInvestorsContext.Provider>
  );
}

export function usePrivateInvestors() {
  const context = useContext(PrivateInvestorsContext);
  if (context === undefined) {
    throw new Error(
      'usePrivateInvestors must be used within a PrivateInvestorsProvider'
    );
  }
  return context;
}
