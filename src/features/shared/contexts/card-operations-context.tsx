'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CardPreview } from '../types/cards';
import { Folder } from '../types/folders';
import { GraphQLFolder, DetailedSignalCard, Source } from '@/lib/graphql/types';
import {
  deduplicateSignalsByPerson,
  getPrimaryParticipant,
  getParticipantKey
} from '@/features/shared/utils/signal-deduplication';

interface CardOperationsContextType {
  // Favorites
  toggleFavorite: (cardId: number, currentStatus: boolean) => Promise<boolean>;
  addToFavorites: (cardId: number) => Promise<boolean>;
  removeFromFavorites: (cardId: number) => Promise<boolean>;

  // Likes (heart)
  toggleLike: (cardId: number, currentStatus: boolean) => Promise<boolean>;
  addLike: (cardId: number) => Promise<boolean>;
  removeLike: (cardId: number) => Promise<boolean>;

  // Notes
  addNote: (
    cardId: number,
    noteText: string
  ) => Promise<{ success: boolean; noteText: string }>;
  updateNote: (
    cardId: number,
    noteText: string
  ) => Promise<{ success: boolean; noteText: string }>;
  deleteNote: (cardId: number) => Promise<boolean>;

  // Folders
  addToFolder: (cardId: number, folderId: number) => Promise<boolean>;
  removeFromFolder: (cardId: number, folderId: number) => Promise<boolean>;

  // Loading state for different operations
  isProcessing: {
    favorites: Record<number, boolean>;
    likes: Record<number, boolean>;
    notes: Record<number, boolean>;
    folders: Record<number, boolean>;
  };

  // Helper methods
  getCardData: (cardId: number) => Promise<CardPreview | null>;

  // Card deletion
  deleteCard: (cardId: number) => Promise<boolean>;

  // Card restoration
  restoreCard: (cardId: number) => Promise<boolean>;

  // Get detailed card information
  getCardDetails: (cardId: number) => Promise<any | null>;

  // New methods for folder operations
  getFoldersForCard: (cardId: number) => Promise<Folder[]>;
  updateCardFolders: (
    cardId: number,
    includeFolders: number[],
    excludeFolders: number[]
  ) => Promise<boolean>;

  // New method for handling likes in folders
  handleToggleCardLike: (cardId: number, isLiked: boolean) => Promise<boolean>;

  // Ticket operations
  createTicket: (cardId: number) => Promise<boolean>;
  isCreatingTicket: Record<number, boolean>;
}

const CardOperationsContext = createContext<
  CardOperationsContextType | undefined
>(undefined);

export function CardOperationsProvider({ children }: { children: ReactNode }) {
  // Loading state for different operations
  const [isProcessing, setIsProcessing] = useState<{
    favorites: Record<number, boolean>;
    likes: Record<number, boolean>;
    notes: Record<number, boolean>;
    folders: Record<number, boolean>;
  }>({
    favorites: {},
    likes: {},
    notes: {},
    folders: {}
  });

  // State for ticket operations
  const [isCreatingTicket, setIsCreatingTicket] = useState<
    Record<number, boolean>
  >({});

  const { fetchWithAuth, logout } = useAuth();
  const router = useRouter();

  // Handle authentication errors
  const handleAuthError = async (error: any) => {
    if (
      error.message?.includes('Session expired') ||
      error.message?.includes('please sign in again')
    ) {
      toast.error('Ваша сессия истекла. Пожалуйста, войдите снова.');
      if (logout) {
        await logout();
      }
      router.push('/auth/sign-in');
      return true;
    }
    return false;
  };

  // ====== FAVORITES MANAGEMENT METHODS ======

  // Internal method to add card to favorites without loading state
  const addToFavoritesInternal = useCallback(
    async (cardId: number): Promise<boolean> => {
      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth!(`/api/cards/${cardId}/favorite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // If we get a 400 error, check if it's because the card is already in favorites
        if (response.status === 400) {
          try {
            const errorData = await response.json();

            // If error is because card is already in favorites, consider operation successful
            if (errorData.error === 'ALREADY_LIKED') {
              return true;
            }
          } catch (jsonError) {
            // If we couldn't parse JSON, just continue execution
            return false;
          }
        }

        if (!response.ok) {
          return false;
        }

        try {
          const data = await response.json();
          return data.success === true;
        } catch (jsonError) {
          return false;
        }
      } catch (error) {
        return false;
      }
    },
    [fetchWithAuth]
  );

  // Add card to favorites (with loading state)
  const addToFavorites = useCallback(
    async (cardId: number): Promise<boolean> => {
      setIsProcessing((prev) => ({
        ...prev,
        favorites: { ...prev.favorites, [cardId]: true }
      }));

      try {
        return await addToFavoritesInternal(cardId);
      } finally {
        setIsProcessing((prev) => ({
          ...prev,
          favorites: { ...prev.favorites, [cardId]: false }
        }));
      }
    },
    [addToFavoritesInternal]
  );

  // Internal method to remove card from favorites without loading state
  const removeFromFavoritesInternal = useCallback(
    async (cardId: number): Promise<boolean> => {
      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth!(`/api/cards/${cardId}/favorite`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // If we get a 404 error, the card might not be in favorites anymore
        if (response.status === 404) {
          // Consider operation successful as the end result is the same - card is not in favorites
          return true;
        }

        if (!response.ok) {
          // Try to get error text
          try {
            const errorText = await response.text();
          } catch (textError) {}

          return false;
        }

        try {
          const data = await response.json();
          return data.success === true;
        } catch (jsonError) {
          // If we couldn't parse JSON but response was successful,
          // consider operation successful
          return response.ok;
        }
      } catch (error) {
        return false;
      }
    },
    [fetchWithAuth]
  );

  // Remove card from favorites (with loading state)
  const removeFromFavorites = useCallback(
    async (cardId: number): Promise<boolean> => {
      setIsProcessing((prev) => ({
        ...prev,
        favorites: { ...prev.favorites, [cardId]: true }
      }));

      try {
        return await removeFromFavoritesInternal(cardId);
      } finally {
        setIsProcessing((prev) => ({
          ...prev,
          favorites: { ...prev.favorites, [cardId]: false }
        }));
      }
    },
    [removeFromFavoritesInternal]
  );

  // Toggle favorite status (no loading state for instant feedback)
  const toggleFavorite = useCallback(
    async (cardId: number, currentStatus: boolean): Promise<boolean> => {
      // Don't set loading state to provide instant feedback
      try {
        if (currentStatus) {
          return await removeFromFavoritesInternal(cardId);
        } else {
          return await addToFavoritesInternal(cardId);
        }
      } catch (error) {
        console.error(
          `[Context] Error while ${currentStatus ? 'removing from' : 'adding to'} favorites:`,
          error
        );
        return false;
      }
    },
    [addToFavoritesInternal, removeFromFavoritesInternal]
  );

  // For likes we use the same methods as for favorites
  const addLike = addToFavorites;
  const removeLike = removeFromFavorites;

  // Toggle like (using the same method as for favorites)
  const toggleLike = useCallback(
    async (cardId: number, currentStatus: boolean): Promise<boolean> => {
      setIsProcessing((prev) => ({
        ...prev,
        likes: { ...prev.likes, [cardId]: true }
      }));

      try {
        let result;
        // If currentStatus=true, card already has a like and we want to remove it
        if (currentStatus) {
          result = await removeFromFavorites(cardId);
        } else {
          // If currentStatus=false, card doesn't have a like and we want to add it
          result = await addToFavorites(cardId);
        }

        return result;
      } catch (error) {
        console.error(
          `[Context] Error while ${currentStatus ? 'removing' : 'adding'} like:`,
          error
        );
        return false;
      } finally {
        setIsProcessing((prev) => ({
          ...prev,
          likes: { ...prev.likes, [cardId]: false }
        }));
      }
    },
    [addToFavorites, removeFromFavorites]
  );

  // ====== NOTE MANAGEMENT METHODS ======

  // Add note to card
  const addNote = useCallback(
    async (
      cardId: number,
      noteText: string
    ): Promise<{ success: boolean; noteText: string }> => {
      setIsProcessing((prev) => ({
        ...prev,
        notes: { ...prev.notes, [cardId]: true }
      }));

      try {
        const response = await fetchWithAuth!(`/api/cards/${cardId}/note`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ note_text: noteText })
        });

        if (!response.ok) {
          console.error(`[Context] Error adding note: ${response.status}`);
          return { success: false, noteText: '' };
        }

        try {
          const data = await response.json();
          return {
            success: data.success === true,
            noteText: data.note_text || noteText
          };
        } catch (jsonError) {
          console.error(`[Context] Error parsing JSON:`, jsonError);
          return { success: false, noteText: '' };
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
        }
        return { success: false, noteText: '' };
      } finally {
        setIsProcessing((prev) => ({
          ...prev,
          notes: { ...prev.notes, [cardId]: false }
        }));
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // Update card note
  const updateNote = useCallback(
    async (
      cardId: number,
      noteText: string
    ): Promise<{ success: boolean; noteText: string }> => {
      setIsProcessing((prev) => ({
        ...prev,
        notes: { ...prev.notes, [cardId]: true }
      }));

      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth(`/api/cards/${cardId}/note`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ note_text: noteText })
        });

        if (!response.ok) {
          console.error(`[Context] Error updating note: ${response.status}`);
          return { success: false, noteText: '' };
        }

        try {
          const data = await response.json();
          return {
            success: data.success === true,
            noteText: data.note_text || noteText
          };
        } catch (jsonError) {
          console.error(`[Context] Error parsing JSON:`, jsonError);
          return { success: false, noteText: '' };
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
        }
        return { success: false, noteText: '' };
      } finally {
        setIsProcessing((prev) => ({
          ...prev,
          notes: { ...prev.notes, [cardId]: false }
        }));
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // Delete card note
  const deleteNote = useCallback(
    async (cardId: number): Promise<boolean> => {
      setIsProcessing((prev) => ({
        ...prev,
        notes: { ...prev.notes, [cardId]: true }
      }));

      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth(`/api/cards/${cardId}/note`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`[Context] Error deleting note: ${response.status}`);
          return false;
        }

        try {
          const data = await response.json();
          return data.success === true;
        } catch (jsonError) {
          console.error(`[Context] Error parsing JSON:`, jsonError);
          return false;
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
        }
        return false;
      } finally {
        setIsProcessing((prev) => ({
          ...prev,
          notes: { ...prev.notes, [cardId]: false }
        }));
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // ====== FOLDER MANAGEMENT METHODS ======

  // Add card to folder
  const addToFolder = useCallback(
    async (cardId: number, folderId: number): Promise<boolean> => {
      setIsProcessing((prev) => ({
        ...prev,
        folders: { ...prev.folders, [cardId]: true }
      }));

      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth(`/api/cards/${cardId}/folders`, {
          method: 'POST',
          body: JSON.stringify({
            include_folders: [folderId],
            exclude_folders: []
          })
        });

        const data = await response.json();

        if (data.success) {
          return true;
        } else {
          console.error(
            `[Context] Error adding card ${cardId} to folder ${folderId}:`,
            data.message
          );
          return false;
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `[Context] Exception while adding card ${cardId} to folder ${folderId}:`,
            error
          );
        }
        return false;
      } finally {
        setIsProcessing((prev) => ({
          ...prev,
          folders: { ...prev.folders, [cardId]: false }
        }));
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // Remove card from folder
  const removeFromFolder = useCallback(
    async (cardId: number, folderId: number): Promise<boolean> => {
      setIsProcessing((prev) => ({
        ...prev,
        folders: { ...prev.folders, [cardId]: true }
      }));

      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth(`/api/cards/${cardId}/folders`, {
          method: 'POST',
          body: JSON.stringify({
            include_folders: [],
            exclude_folders: [folderId]
          })
        });

        const data = await response.json();

        if (data.success) {
          return true;
        } else {
          console.error(
            `[Context] Error removing card ${cardId} from folder ${folderId}:`,
            data.message
          );
          return false;
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `[Context] Exception while removing card ${cardId} from folder ${folderId}:`,
            error
          );
        }
        return false;
      } finally {
        setIsProcessing((prev) => ({
          ...prev,
          folders: { ...prev.folders, [cardId]: false }
        }));
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // Get folders for card
  const getFoldersForCard = useCallback(
    async (cardId: number): Promise<Folder[]> => {
      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth(`/api/cards/${cardId}/folders`);
        const data = await response.json();

        if (data.success && data.folders) {
          return data.folders;
        }
        return [];
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
        }
        console.error(
          `[Context] Error getting folders for card ${cardId}:`,
          error
        );
        return [];
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // Update card folders
  const updateCardFolders = useCallback(
    async (
      cardId: number,
      includeFolders: number[],
      excludeFolders: number[]
    ): Promise<boolean> => {
      setIsProcessing((prev) => ({
        ...prev,
        folders: { ...prev.folders, [cardId]: true }
      }));

      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth(`/api/cards/${cardId}/folders`, {
          method: 'POST',
          body: JSON.stringify({
            include_folders: includeFolders,
            exclude_folders: excludeFolders
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data?.success) {
          return true;
        } else {
          const errorMessage = data?.message || 'Не удалось обновить папки';
          console.error(
            `[Context] Error updating folders for card ${cardId}:`,
            errorMessage
          );
          toast.error(errorMessage);
          return false;
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
          console.error(
            `[Context] Error updating folders for card ${cardId}:`,
            error
          );
        }
        return false;
      } finally {
        setIsProcessing((prev) => ({
          ...prev,
          folders: { ...prev.folders, [cardId]: false }
        }));
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // ====== HELPER METHODS ======

  // Get card data
  const getCardData = useCallback(
    async (cardId: number): Promise<CardPreview | null> => {
      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth(`/api/cards/${cardId}`);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          }
          throw new Error('Error getting card data');
        }

        const data = await response.json();
        if (data.success && data.card) {
          return data.card;
        } else {
          throw new Error(data.message || 'Не удалось получить данные карточки');
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
        }
        return null;
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // Delete card (add to hidden list)
  const deleteCard = useCallback(
    async (cardId: number): Promise<boolean> => {
      if (
        isProcessing.favorites[cardId] ||
        isProcessing.likes[cardId] ||
        isProcessing.notes[cardId] ||
        isProcessing.folders[cardId]
      )
        return false;

      setIsProcessing((prev) => ({
        ...prev,
        favorites: { ...prev.favorites, [cardId]: true }
      }));

      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth(`/api/cards/${cardId}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        // Try to get response data
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error(`[Context] JSON parsing error:`, jsonError);
          data = { success: false };
        }

        // Handle "Card already deleted" error
        if (data.error === 'ALREADY_DELETED') {
          toast.info('Эта карточка уже скрыта');
          return true; // Return true since card is already deleted
        }

        if (!response.ok) {
          console.error(`[Context] Error deleting card: ${response.status}`);
          const errorText = JSON.stringify(data);
          console.error(`[Context] Error text:`, errorText);

          toast.info(data.message || 'Не удалось удалить карточку');
          return false;
        }

        return data.success === true;
      } catch (error) {
        console.error(`[Context] Exception while deleting card:`, error);
        toast.info('Произошла ошибка при удалении карточки');
        return false;
      } finally {
        setIsProcessing((prev) => ({
          ...prev,
          favorites: { ...prev.favorites, [cardId]: false }
        }));
      }
    },
    [fetchWithAuth, isProcessing]
  );

  // Restore card from hidden list
  const restoreCard = useCallback(
    async (cardId: number): Promise<boolean> => {
      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth(`/api/cards/${cardId}/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`[Context] Error restoring card: ${response.status}`);
          const errorText = await response.text();
          console.error(`[Context] Error text:`, errorText);
          return false;
        }

        try {
          const data = await response.json();
          return data.success === true;
        } catch (jsonError) {
          console.error(`[Context] JSON parsing error:`, jsonError);
          return false;
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
        }
        return false;
      }
    },
    [fetchWithAuth, handleAuthError]
  );

  // Helper function to transform GraphQL DetailedSignalCard to CardDetails format
  const transformGraphQLToCardDetails = useCallback(
    (graphqlCard: DetailedSignalCard): any => {
      return {
        ticket_status: graphqlCard.hasTicket,
        latest_signal_date: graphqlCard.latestSignalDate,
        discovered_at: graphqlCard.discoveredAt,
        // people field removed
        people: [],
        participants: graphqlCard.signals.reduce((acc, signal) => {
          if (
            signal.participant &&
            !acc.some((p) => p.id === signal.participant!.id)
          ) {
            acc.push({
              id: signal.participant.id,
              name: signal.participant.name,
              slug: signal.participant.slug,
              type: signal.participant.type,
              additional_name: signal.participant.additionalName,
              about: signal.participant.about,
              // isPrivate field removed
              image_url: signal.participant.imageUrl,
              is_saved: signal.participant.isSaved,
              sources:
                signal.participant.sources?.map((source) => ({
                  id: source.id,
                  slug: source.slug,
                  source_type: source.sourceType,
                  profile_link: source.profileLink
                })) || []
            });
          }
          if (
            signal.associatedParticipant &&
            !acc.some((p) => p.id === signal.associatedParticipant!.id)
          ) {
            acc.push({
              id: signal.associatedParticipant.id,
              name: signal.associatedParticipant.name,
              slug: signal.associatedParticipant.slug,
              type: signal.associatedParticipant.type,
              additional_name: signal.associatedParticipant.additionalName,
              about: signal.associatedParticipant.about,
              // isPrivate field removed
              image_url: signal.associatedParticipant.imageUrl,
              is_saved: signal.associatedParticipant.isSaved,
              sources:
                signal.associatedParticipant.sources?.map((source) => ({
                  id: source.id,
                  slug: source.slug,
                  source_type: source.sourceType,
                  profile_link: source.profileLink
                })) || []
            });
          }
          return acc;
        }, [] as any[]),
        signals: (() => {
          // First, deduplicate signals to keep only the oldest signal per person
          const deduplicatedSignals = deduplicateSignalsByPerson(
            graphqlCard.signals
          );

          // Reverse the order to show latest signals first in the detail view
          const reversedSignals = [...deduplicatedSignals].reverse();

          // Group deduplicated signals by participant to match the old REST API format
          const participantGroups = new Map();

          reversedSignals.forEach((signal) => {
            const primaryParticipant = getPrimaryParticipant(signal);
            if (!primaryParticipant) return;

            const participantId = primaryParticipant.id;

            if (!participantGroups.has(participantId)) {
              participantGroups.set(participantId, {
                // Fields expected by the interactions component
                sources:
                  primaryParticipant.sources?.map((source) => ({
                    id: source.id,
                    slug: source.slug,
                    source_type: source.sourceType,
                    profile_link: source.profileLink
                  })) || [],
                associated_id: parseInt(primaryParticipant.id),
                associated_saved: primaryParticipant.isSaved || false,
                associated_slug: primaryParticipant.slug || '',
                associated_about: primaryParticipant.about || null,
                associated_name: primaryParticipant.name || '',
                associated_image: primaryParticipant.imageUrl || null,
                // isPrivate field removed
                associated_signal_created_at: signal.date || signal.createdAt,
                more: [], // Will be populated with other participants from same signal

                // Original fields for backward compatibility
                id: signal.id,
                date: signal.date,
                created_at: signal.createdAt,
                description: signal.description,

                // Founder-specific fields removed
                signalType: signal.signalType,

                signals: [signal] // Keep track of all signals for this participant
              });
            }

            // Add other participants to the 'more' array
            const group = participantGroups.get(participantId);
            const otherParticipant =
              signal.participant &&
              signal.participant.id !== primaryParticipant.id
                ? signal.participant
                : signal.associatedParticipant &&
                    signal.associatedParticipant.id !== primaryParticipant.id
                  ? signal.associatedParticipant
                  : null;

            if (
              otherParticipant &&
              !group.more.some(
                (p: any) => p.participant_id === otherParticipant.id
              )
            ) {
              group.more.push({
                participant_id: parseInt(otherParticipant.id),
                participant_name: otherParticipant.name,
                participant_slug: otherParticipant.slug,
                participant_about: otherParticipant.about,
                participant_image: otherParticipant.imageUrl,
                // isPrivate field removed
                participant_saved: otherParticipant.isSaved,
                participant_created_at: signal.date || signal.createdAt,
                sources:
                  otherParticipant.sources?.map((source) => ({
                    id: source.id,
                    slug: source.slug,
                    source_type: source.sourceType,
                    profile_link: source.profileLink
                  })) || []
              });
            }
          });

          return Array.from(participantGroups.values()).map((group) => {
            // Keep the signals array
            return group;
          });
        })(),
        user_data: {
          is_favorited: graphqlCard.userData?.isFavorited || false,
          is_deleted: graphqlCard.userData?.isDeleted || false,
          is_assigned_to_group: graphqlCard.userData?.isAssignedToGroup || false,
          folders:
            graphqlCard.userData?.folders?.map((folder) => ({
              id: parseInt(folder.id),
              name: folder.name,
              description: '', // GraphQL doesn't provide this field
              is_default: folder.isDefault,
              has_card: folder.hasCard,
              key: folder.id,
              created_at: '', // GraphQL doesn't provide this field
              updated_at: '', // GraphQL doesn't provide this field
              cards_count: 0 // GraphQL doesn't provide this field
            })) || [],
          note_text: graphqlCard.userData?.userNote?.noteText || null,
          has_note: !!graphqlCard.userData?.userNote?.noteText,
          userNote: graphqlCard.userData?.userNote
            ? {
                id: graphqlCard.userData.userNote.id,
                noteText: graphqlCard.userData.userNote.noteText,
                createdAt: graphqlCard.userData.userNote.createdAt,
                updatedAt: graphqlCard.userData.userNote.updatedAt
              }
            : undefined
        },
        funding: null, // This might need to be mapped from new fields if available
        // Add the new GraphQL fields for enhanced functionality
        socialLinks: graphqlCard.socialLinks,
        teamMembers: graphqlCard.teamMembers,
        categories: graphqlCard.categories,
        remainingParticipantsCount: graphqlCard.remainingParticipantsCount,
        // Basic info from the main card
        name: graphqlCard.name,
        description: graphqlCard.description,
        url: graphqlCard.url,
        imageUrl: graphqlCard.imageUrl,
        stage: graphqlCard.stage,
        roundStatus: graphqlCard.roundStatus,
        isOpen: graphqlCard.isOpen,
        featured: graphqlCard.featured,
        slug: graphqlCard.slug,
        uuid: graphqlCard.uuid,
        referenceUrl: graphqlCard.referenceUrl,
        lastRound: graphqlCard.lastRound,
        createdAt: graphqlCard.createdAt,
        updatedAt: graphqlCard.updatedAt,
        // LinkedIn signals removed - linkedinData field no longer available
        linkedInSignals: []
      };
    },
    []
  );

  // Get detailed card information using GraphQL
  const getCardDetails = useCallback(
    async (cardId: number): Promise<any | null> => {
      try {
        // Check if we have fetchWithAuth available
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        // Use fetchWithAuth to make GraphQL request directly for proper auth handling
        const graphqlQuery = {
          query: `
            query GetSignalCardDetail($id: ID!) {
              signalCard(id: $id, includeSignals: true, absoluteImageUrl: true) {
                id
                slug
                uuid
                name
                description
                url
                imageUrl
                createdAt
                updatedAt
                lastRound
                stage
                roundStatus
                isOpen
                referenceUrl
                featured
                latestSignalDate
                discoveredAt
                categories {
                  id
                  name
                  slug
                }
                teamMembers {
                  id
                  name
                  headline
                  imageUrl
                  site
                  crunchbase
                  twitter
                  linkedin
                  instagram
                  github
                  producthunt
                  email
                }
                signals {
                  id
                  date
                  createdAt
                  description
                  
                  # Signal type for LinkedIn detection
                  signalType {
                    id
                    name
                    slug
                    __typename
                  }
                  
                  participant {
                    id
                    name
                    slug
                    type
                    additionalName
                    about
                    imageUrl
                    isSaved
                    sources {
                      id
                      slug
                      sourceType
                      profileLink
                    }
                  }
                  associatedParticipant {
                    id
                    name
                    slug
                    type
                    additionalName
                    about
                    imageUrl
                    isSaved
                    sources {
                      id
                      slug
                      sourceType
                      profileLink
                    }
                  }
                }
                remainingParticipantsCount
                socialLinks {
                  name
                  url
                }
                userData {
                  isFavorited
                  isDeleted
                  folders {
                    id
                    name
                    isDefault
                    hasCard
                  }
                  userNote {
                    id
                    noteText
                    createdAt
                    updatedAt
                  }
                }
                hasTicket
              }
            }
          `,
          variables: { id: cardId.toString() }
        };

        const response = await fetchWithAuth('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(graphqlQuery)
        });

        if (!response.ok) {
          throw new Error(
            `GraphQL request failed with status ${response.status}`
          );
        }

        const result = await response.json();

        if (result.errors) {
          console.error(`[Context] GraphQL errors:`, result.errors);

          // Check if it's an authentication error
          const authErrors = result.errors.some(
            (error: any) =>
              error.extensions?.code === 'UNAUTHENTICATED' ||
              error.message?.includes('Authentication required')
          );

          if (authErrors) {
            throw new Error('Session expired. Please login again.');
          }

          throw new Error('Error getting card data from GraphQL');
        }

        if (result.data?.signalCard) {
          // Transform GraphQL response to match existing CardDetails format
          const transformedData = transformGraphQLToCardDetails(
            result.data.signalCard
          );
          return transformedData;
        } else {
          throw new Error('Card not found');
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
        }
        return null;
      }
    },
    [handleAuthError, transformGraphQLToCardDetails, fetchWithAuth]
  );

  // New method for handling likes in folder
  const handleToggleCardLike = useCallback(
    async (cardId: number, isLiked: boolean): Promise<boolean> => {
      // Get current folder from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const selectedFolderKey = urlParams.get('folder_key') || 'default';
      const isDefaultFolder = selectedFolderKey === 'default';

      // If this is "Favorites" folder and card has a like (removing like)
      if (isDefaultFolder && isLiked) {
        // Remove card from list (it will disappear from favorites)
        window.dispatchEvent(
          new CustomEvent('card-removed-from-favorites', {
            detail: { cardId }
          })
        );
      }

      // Call standard like toggle method
      const success = await toggleLike(cardId, isLiked);

      if (success) {
        // Send event for UI update
        window.dispatchEvent(
          new CustomEvent('card-like-toggled', {
            detail: { cardId, isLiked: !isLiked }
          })
        );
      }

      return success;
    },
    [toggleLike]
  );

  // Create ticket for contact request
  const createTicket = useCallback(
    async (cardId: number): Promise<boolean> => {
      // If ticket creation is already in progress for this card, do nothing
      if (isCreatingTicket[cardId]) return false;

      // Set flag that ticket creation is in progress
      setIsCreatingTicket((prev) => ({ ...prev, [cardId]: true }));

      try {
        if (!fetchWithAuth) {
          throw new Error('Authentication not available');
        }

        const response = await fetchWithAuth('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            card_id: cardId.toString()
          })
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Запрос отправлен', {
            description:
              'Ваш запрос получен и будет обработан.',
            duration: 5000
          });
          return true;
        } else if (data.message?.includes('already been submitted')) {
          toast.info('Запрос уже отправлен', {
            description:
              'Запрос на контакт для этого проекта уже был отправлен.',
            duration: 5000
          });
          return true;
        } else {
          throw new Error(data.message || 'Не удалось отправить запрос');
        }
      } catch (error) {
        console.error('Error sending contact request:', error);
        toast.error('Ошибка', {
          description: 'Не удалось отправить запрос на контакт. Пожалуйста, попробуйте снова.',
          duration: 5000
        });
        return false;
      } finally {
        // Remove ticket creation flag
        setIsCreatingTicket((prev) => {
          const newState = { ...prev };
          delete newState[cardId];
          return newState;
        });
      }
    },
    [fetchWithAuth]
  );

  return (
    <CardOperationsContext.Provider
      value={{
        // Favorites
        toggleFavorite,
        addToFavorites,
        removeFromFavorites,

        // Likes
        toggleLike,
        addLike,
        removeLike,

        // Notes
        addNote,
        updateNote,
        deleteNote,

        // Folders
        addToFolder,
        removeFromFolder,

        // Loading state
        isProcessing,

        // Helper methods
        getCardData,

        // Card deletion
        deleteCard,

        // Card restoration
        restoreCard,

        // Get detailed card information
        getCardDetails,

        // New methods for folder operations
        getFoldersForCard,
        updateCardFolders,

        // New method for handling likes in folder
        handleToggleCardLike,

        // Ticket operations
        createTicket,
        isCreatingTicket
      }}
    >
      {children}
    </CardOperationsContext.Provider>
  );
}

// Hook for using card operations context
export function useCardOperations() {
  const context = useContext(CardOperationsContext);
  if (context === undefined) {
    throw new Error(
      'useCardOperations must be used within CardOperationsProvider'
    );
  }
  return context;
}
