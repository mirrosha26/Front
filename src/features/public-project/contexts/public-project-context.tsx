'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode
} from 'react';
import { useAuth } from '@/contexts/auth-context';

interface CardData {
  id: number;
  slug: string;
  uuid: string;
  name: string;
  description?: string;
  image?: string;
  url?: string;
  created_date?: string;
  latest_signal_date?: string;
  discovered_at?: string;
  location?: string;
  is_public?: boolean;
  stage_info?: {
    name: string;
    slug: string;
  };
  round_status_info?: {
    key: string;
    name: string;
  };
  categories_list?: {
    id: number;
    name: string;
    slug: string;
  }[];
  social_links?: {
    name: string;
    url: string;
  }[];
  participants_list?: {
    id: number;
    name: string;
    image?: string;
    is_private?: boolean;
    is_saved?: boolean;
  }[];
  participants?: {
    sources?: {
      type: string;
      slug: string;
      link: string;
    }[];
    associated_id: number;
    associated_saved: boolean;
    associated_slug: string;
    associated_about?: string;
    associated_name: string;
    associated_image?: string;
    associated_is_private: boolean;
    associated_signal_created_at: string;
    more?: {
      sources?: {
        type: string;
        slug: string;
        link: string;
      }[];
      participant_id: number;
      participant_name: string;
      participant_about?: string;
      participant_image?: string;
      participant_slug: string;
      participant_is_private: boolean;
      participant_signal_created_at: string;
    }[];
  }[];
  participants_more_count?: number;
  participants_has_more?: boolean;
  people?: {
    name: string;
    type: string;
    bio?: string;
    image?: string;
    email?: string;
    twitter_url?: string;
    linkedin_url?: string;
    is_private?: boolean;
    is_saved?: boolean;
  }[];
  funding?: {
    total_raised?: string;
    latest_round?: string;
    rounds?: {
      type: string;
      amount?: string;
      date?: string;
      description?: string;
      investors?: {
        name: string;
      }[];
    }[];
  };
  signals?: Array<{
    id: string;
    signalType?: {
      id: number;
      name: string;
      slug: string;
    };
    linkedinData?: {
      name: string;
      linkedinProfileUrl: string;
      classification: string;
      tags: string[];
      summary: string;
      experience: string[];
      education: string[];
      notableAchievements: string;
      oneLiner?: string;
      location?: string;
      createdAt: string;
      updatedAt: string;
      signalType: string;
    };
  }>;
  is_liked: boolean;
  is_saved: boolean;
  has_note: boolean;
  has_ticket: boolean;
  open_to_intro?: boolean;
}

interface PublicProjectContextType {
  previewData: CardData | null;
  detailData: CardData | null;
  isLoadingPreview: boolean;
  isLoadingDetail: boolean;
  error: string | null;
  fetchCardPreview: (identifier: string) => Promise<void>;
  fetchCardDetail: (
    identifier: string,
    isAuthenticated: boolean
  ) => Promise<void>;
  clearCard: () => void;
  toggleLike: (cardId: number, currentLikeState: boolean) => Promise<boolean>;
  isTogglingLike: boolean;
}

const PublicProjectContext = createContext<
  PublicProjectContextType | undefined
>(undefined);

interface PublicProjectProviderProps {
  children: ReactNode;
  initialPreviewData?: {
    success: boolean;
    error?: string;
    card?: CardData;
  };
}

export function PublicProjectProvider({
  children,
  initialPreviewData
}: PublicProjectProviderProps) {
  const [previewData, setPreviewData] = useState<CardData | null>(
    initialPreviewData?.card || null
  );
  const [detailData, setDetailData] = useState<CardData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(
    initialPreviewData?.error || null
  );
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const { fetchWithAuth } = useAuth();

  const fetchCardPreview = useCallback(
    async (identifier: string) => {
      if (initialPreviewData) {
        return;
      }

      setIsLoadingPreview(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/public/${identifier}/preview`,
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.card) {
            setPreviewData(data.card);
          } else {
            setError('Card not found');
          }
        } else if (response.status === 404) {
          setError('Card not found');
        } else {
          console.error('Preview API error:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url
          });
          setError('Не удалось загрузить превью карточки');
        }
      } catch (error) {
        console.error(
          `[PublicProjectContext] Error fetching card preview:`,
          error
        );
        setError('Произошла сетевая ошибка');
      } finally {
        setIsLoadingPreview(false);
      }
    },
    [initialPreviewData]
  );

  const fetchCardDetail = useCallback(
    async (identifier: string, isAuthenticated: boolean) => {
      setIsLoadingDetail(true);
      setError(null);

      try {
        let response: Response;
        let requestUrl: string;
        let requestHeaders: Record<string, string>;

        if (isAuthenticated && fetchWithAuth) {
          // Используем fetchWithAuth для запроса к нашему прокси
          // Сначала получаем ID карточки из previewData
          if (!previewData?.id) {
            console.error(
              `[PublicProjectContext] No preview data available for identifier: ${identifier}`
            );
            setError('Card not found');
            return;
          }

          requestUrl = `/api/cards/${previewData.id}`;
          requestHeaders = {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          };

          response = await fetchWithAuth(requestUrl);
        } else {
          // Используем публичный API через Next.js proxy
          requestUrl = `/api/public/${identifier}/detail`;
          requestHeaders = {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          };

          response = await fetch(requestUrl, {
            headers: requestHeaders
          });
        }

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.card) {
            setDetailData(data.card);
          } else {
            console.error(`[PublicProjectContext] Invalid data format:`, data);
            setError('Card not found');
          }
        } else if (response.status === 404) {
          console.error(
            `[PublicProjectContext] Card not found: ${response.status}`
          );
          setError('Card not found');
        } else {
          console.error('Detail API error:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url
          });
          setError('Не удалось загрузить детали карточки');
        }
      } catch (error) {
        console.error(
          `[PublicProjectContext] Error fetching card detail:`,
          error
        );
        setError('Произошла сетевая ошибка');
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [fetchWithAuth, previewData]
  );

  const clearCard = useCallback(() => {
    setPreviewData(null);
    setDetailData(null);
    setError(null);
    setIsLoadingPreview(false);
    setIsLoadingDetail(false);
  }, []);

  const toggleLike = useCallback(
    async (cardId: number, currentLikeState: boolean): Promise<boolean> => {
      if (!fetchWithAuth) {
        console.error('[PublicProjectContext] fetchWithAuth is not available');
        return false;
      }

      setIsTogglingLike(true);
      try {
        const response = await fetchWithAuth(`/api/cards/${cardId}/favorite`, {
          method: currentLikeState ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Если карточка уже лайкнута/анлайкнута, считаем операцию успешной
        if (response.status === 400) {
          try {
            const errorData = await response.json();
            if (
              errorData.error === 'ALREADY_LIKED' ||
              errorData.error === 'NOT_LIKED'
            ) {
              // Обновляем состояние в detailData даже если карточка уже в нужном состоянии
              if (detailData) {
                setDetailData((prev) => ({
                  ...prev!,
                  is_liked: !currentLikeState
                }));
              }
              return true;
            }
          } catch (jsonError) {}
        }

        if (!response.ok) {
          console.error(
            `[PublicProjectContext] Error updating like status: ${response.status}`
          );
          return false;
        }

        // Обновляем состояние в detailData
        if (detailData) {
          setDetailData((prev) => ({
            ...prev!,
            is_liked: !currentLikeState
          }));
        }

        return true;
      } catch (error) {
        console.error('[PublicProjectContext] Error toggling like:', error);
        return false;
      } finally {
        setIsTogglingLike(false);
      }
    },
    [fetchWithAuth, detailData]
  );

  return (
    <PublicProjectContext.Provider
      value={{
        previewData,
        detailData,
        isLoadingPreview,
        isLoadingDetail,
        error,
        fetchCardPreview,
        fetchCardDetail,
        clearCard,
        toggleLike,
        isTogglingLike
      }}
    >
      {children}
    </PublicProjectContext.Provider>
  );
}

export const usePublicProject = () => {
  const context = useContext(PublicProjectContext);
  if (context === undefined) {
    throw new Error(
      'usePublicProject must be used within a PublicProjectProvider'
    );
  }
  return context;
};
