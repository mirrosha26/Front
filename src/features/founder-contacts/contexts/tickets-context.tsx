'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { FounderContact } from '../types';
import { useRouter } from 'next/navigation';

interface TicketsContextType {
  tickets: FounderContact[];
  isLoading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  cancelTicket: (id: number) => Promise<boolean>;
  deleteTicket: (id: number) => Promise<boolean>;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<FounderContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchWithAuth, logout } = useAuth();
  const router = useRouter();

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

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth('/api/tickets');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
        }
        throw new Error('Error loading contacts');
      }

      const data = await response.json();

      const ticketsData = data.data || [];

      const formattedContacts = ticketsData.map((ticket: any) => ({
        id: ticket.id,
        name: ticket.signal_card_name,
        image: ticket.signal_card_image,
        is_processed: ticket.is_processed,
        created_at: ticket.created_at,
        response_text: ticket.response_text
      }));

      setTickets(formattedContacts);
      return formattedContacts;
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (!isAuthError) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error loading contacts:', error);
        toast.error('Не удалось загрузить контакты. Попробуйте еще раз.');
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const cancelTicket = async (id: number): Promise<boolean> => {
    try {
      const response = await fetchWithAuth(`/api/tickets/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
        }
        throw new Error('Error canceling request');
      }

      setTickets(tickets.filter((ticket) => ticket.id !== id));
      toast.success('Запрос на контакт успешно отменен.');
      return true;
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (!isAuthError) {
        console.error('Error canceling request:', error);
        toast.error('Не удалось отменить запрос. Попробуйте еще раз.');
      }
      return false;
    }
  };

  const deleteTicket = async (id: number): Promise<boolean> => {
    try {
      const response = await fetchWithAuth(`/api/tickets/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
        }
        throw new Error('Error deleting contact');
      }

      setTickets(tickets.filter((ticket) => ticket.id !== id));
      toast.success('Контакт успешно удален из списка.');
      return true;
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (!isAuthError) {
        console.error('Error deleting contact:', error);
        toast.error('Не удалось удалить контакт. Попробуйте еще раз.');
      }
      return false;
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        isLoading,
        error,
        fetchTickets,
        cancelTicket,
        deleteTicket
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within TicketsProvider');
  }
  return context;
}
