'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useTickets } from '../contexts/tickets-context';
import { useRouter } from 'next/navigation';

export function useCreateTicket() {
  const [isCreating, setIsCreating] = useState(false);
  const { fetchWithAuth, logout } = useAuth();
  const { fetchTickets } = useTickets();
  const router = useRouter();

  const createTicket = async (cardId: number): Promise<boolean> => {
    setIsCreating(true);

    try {
      const response = await fetchWithAuth('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ card_id: cardId })
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check if error is auth-related
        if (response.status === 401) {
          toast.error('Ваша сессия истекла. Пожалуйста, войдите снова.');
          await logout();
          router.push('/auth/sign-in');
          return false;
        }

        throw new Error(errorData.message || 'Error creating contact request');
      }

      // Update tickets list after successful creation
      await fetchTickets();

      toast.success('Запрос на контакт успешно создан');
      return true;
    } catch (error) {
      // Check if error message contains session information
      if (
        error instanceof Error &&
        (error.message.includes('Session expired') ||
          error.message.includes('sign in again'))
      ) {
        // Already handled in fetchWithAuth
        return false;
      }

      console.error('Error creating contact request:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Не удалось создать запрос на контакт'
      );
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createTicket,
    isCreating
  };
}
