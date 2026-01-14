'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogPortal,
  DialogOverlay
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { IconMaximize, IconX } from '@tabler/icons-react';
import { ParticipantWithChildren } from '@/lib/graphql/types';
import { InvestorDetailCardModal, FundDetailCardModal } from './investor-detail-card';
import { Skeleton } from '@/components/ui/skeleton';
import { InvestorsGraphQLProvider, useInvestorsGraphQL } from '../../contexts/investors-graphql-context';

interface InvestorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  onFollowToggle?: (participantId: string, currentIsSaved?: boolean) => Promise<void>;
}

// GraphQL query для получения инвестора с дочерними участниками и их источниками
const GET_PARTICIPANT_WITH_CHILDREN_AND_SOURCES = `
  query GetParticipantWithChildrenAndSources($slug: String!) {
    participant(slug: $slug) {
      id
      name
      type
      slug
      about
      isSaved
      imageUrl
      sources {
        slug
        sourceType
        profileLink
      }
      parent {
        id
        name
        type
        slug
        about
        isSaved
        imageUrl
      }
      children {
        id
        name
        type
        slug
        about
        imageUrl
        isSaved
        monthlySignalsCount
        sources {
          slug
          sourceType
          profileLink
        }
      }
    }
  }
`;

export function InvestorDetailModal({ isOpen, onClose, slug, onFollowToggle }: InvestorDetailModalProps) {
  const [investor, setInvestor] = useState<ParticipantWithChildren | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState<string | null>(null); // Track which follow operation is loading
  const router = useRouter();

  // Fallback функция для toggleFollow, если контекст недоступен
  const fallbackToggleFollow = async (participantId: string, currentIsSaved?: boolean) => {
    console.log('🔄 Fallback toggleFollow called for:', { participantId, currentIsSaved });
    try {
      const response = await fetch('/api/investors/toggle-follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, currentIsSaved })
      });
      
      console.log('📡 Fallback API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle follow');
      }
      
      const result = await response.json();
      console.log('✅ Fallback API call successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Fallback toggle follow failed:', error);
      throw error;
    }
  };

  // Получаем контекст как хук
  let context: any = null;
  let toggleFollow: ((participantId: string, currentIsSaved?: boolean) => Promise<void>) | undefined;
  
  try {
    context = useInvestorsGraphQL();
    toggleFollow = context.toggleFollow;
    console.log('✅ Got toggleFollow from context:', !!toggleFollow, 'Context object:', !!context);
  } catch (error) {
    console.warn('⚠️ InvestorsGraphQL context not available, using fallback toggleFollow');
    toggleFollow = fallbackToggleFollow;
    console.log('🔄 Using fallback toggleFollow function');
  }

  // Логируем состояние контекста при каждом рендере
  console.log('🔄 Component render - Context state:', { 
    hasContext: !!context, 
    hasOptimisticUpdates: !!context?.optimisticUpdates,
    optimisticUpdates: context?.optimisticUpdates 
  });

  // Простая синхронизация - только для логирования изменений контекста
  useEffect(() => {
    if (context?.optimisticUpdates) {
      console.log('🔄 Context optimisticUpdates changed:', context.optimisticUpdates);
    }
  }, [context?.optimisticUpdates]);

  // Update local state when follow status changes
  const handleFollowToggle = async (participantId: string, currentIsSaved?: boolean) => {
    console.log('🔍 handleFollowToggle called with:', { participantId, currentIsSaved, toggleFollow: !!toggleFollow, investor: !!investor });
    
    if (!toggleFollow || !investor) {
      console.error('❌ toggleFollow function or investor data not available:', { toggleFollow: !!toggleFollow, investor: !!investor });
      return;
    }

    // Set loading state for this specific follow operation
    setFollowLoading(participantId);
    console.log('🔄 Set loading state for participant:', participantId);

    // Optimistically update local state IMMEDIATELY
    const newIsSaved = !(currentIsSaved || false);
    console.log('📝 Optimistic update:', { participantId, currentIsSaved, newIsSaved });
    
    setInvestor(prev => {
      if (!prev) return prev;
      
      // Update main participant
      if (prev.id === participantId) {
        console.log('✅ Updated main participant:', prev.id, 'isSaved:', newIsSaved);
        return {
          ...prev,
          isSaved: newIsSaved
        };
      }
      
      // Update children
      if (prev.children) {
        const updatedChildren = prev.children.map(child => 
          child.id === participantId 
            ? { ...child, isSaved: newIsSaved }
            : child
        );
        
        console.log('✅ Updated child participant:', participantId, 'isSaved:', newIsSaved);
        return {
          ...prev,
          children: updatedChildren
        };
      }
      
      return prev;
    });

    // Call the actual toggle function in background
    try {
      console.log('🚀 Calling toggleFollow function...');
      await toggleFollow(participantId, currentIsSaved);
      console.log('✅ toggleFollow completed successfully');
    } catch (error) {
      console.error('❌ Modal: Error toggling follow:', error);
      
      // Revert optimistic update on error
      setInvestor(prev => {
        if (!prev) return prev;
        
        if (prev.id === participantId) {
          return {
            ...prev,
            isSaved: currentIsSaved || false
          };
        }
        
        if (prev.children) {
          const updatedChildren = prev.children.map(child => 
            child.id === participantId 
              ? { ...child, isSaved: currentIsSaved || false }
              : child
          );
          
          return {
            ...prev,
            children: updatedChildren
          };
        }
        
        return prev;
      });

      // Show user-friendly error message
      setError(`Failed to ${newIsSaved ? 'follow' : 'unfollow'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      // Clear loading state
      setFollowLoading(null);
      console.log('🔄 Cleared loading state for participant:', participantId);
    }
  };

  useEffect(() => {
    const fetchInvestor = async () => {
      if (!slug || !isOpen) return;

      setIsLoading(true);
      setError(null);

      try {
        const requestBody = {
          query: GET_PARTICIPANT_WITH_CHILDREN_AND_SOURCES,
          variables: { slug },
        };
        
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.errors) {
          setError(data.errors[0]?.message || 'Failed to fetch investor data');
          return;
        }

        if (data.data?.participant) {
          setInvestor(data.data.participant);
        } else if (data.data?.participant === null) {
          setError('Investor not found');
        } else {
          setError('Unexpected response format');
        }
      } catch (err) {
        console.error('Error fetching investor:', err);
        setError('Failed to fetch investor data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestor();
  }, [slug, isOpen]);

  const handleExpand = () => {
    router.push(`/app/investors/${slug}`);
  };

  const handleClose = () => {
    setInvestor(null);
    setError(null);
    onClose();
  };

  return (
    <InvestorsGraphQLProvider>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-8 left-8 right-8 bottom-8 z-50 w-auto h-auto p-0 overflow-hidden duration-200 rounded-lg flex flex-col"
          >
            {/* Скрытый заголовок для доступности */}
            <DialogTitle className="sr-only">
              {investor ? `${investor.name} - Investor Details` : 'Investor Details'}
            </DialogTitle>
            
            {/* Header с кнопками */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <div className="flex items-center gap-2">
                {investor && (
                  <h2 className="text-lg font-semibold">{investor.name}</h2>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpand}
                  className="gap-2"
                >
                  <IconMaximize className="h-4 w-4" />
                  Expand
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="gap-2"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content с правильным скроллом */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="h-full p-4 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Скелетон основной карточки */}
                    <div className="gap-0 overflow-hidden border-0 shadow-none bg-card px-3">
                      <div className="px-0">
                        <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                          <div className="flex gap-3 sm:contents">
                            {/* Скелетон изображения */}
                            <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg flex-shrink-0" />
                            
                            <div className="flex flex-1 flex-col gap-2 sm:contents">
                              <div className="flex flex-1 flex-col gap-2">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="flex flex-col gap-2">
                                    {/* Скелетон заголовка */}
                                    <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
                                    {/* Скелетон бейджей */}
                                    <div className="flex flex-wrap gap-2">
                                      <Skeleton className="h-6 w-20" />
                                      <Skeleton className="h-6 w-16" />
                                    </div>
                                  </div>
                                  
                                  {/* Скелетон кнопок действий */}
                                  <div className="flex items-center gap-2">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Скелетон описания */}
                        <div className="mt-4 mb-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                      
                      {/* Скелетон табов */}
                      <div className="px-0 pb-6">
                        <Skeleton className="h-10 w-full mb-4" />
                        <Skeleton className="h-96 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="text-center space-y-2">
                    <p className="text-red-500 font-medium">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setError(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ) : investor ? (
                <div className="h-full p-4 overflow-hidden">
                  {(() => {
                    const finalOnFollowToggle = onFollowToggle || handleFollowToggle;
                    console.log('🔍 Passing onFollowToggle to child components:', { 
                      onFollowToggle: !!onFollowToggle, 
                      handleFollowToggle: !!handleFollowToggle,
                      finalOnFollowToggle: !!finalOnFollowToggle 
                    });
                    
                    return investor.type === 'fund' ? (
                      <FundDetailCardModal 
                        fund={investor} 
                        onFollowToggle={finalOnFollowToggle}
                        followLoading={followLoading}
                      />
                    ) : (
                      <InvestorDetailCardModal 
                        investor={investor} 
                        onFollowToggle={finalOnFollowToggle}
                        followLoading={followLoading}
                      />
                    );
                  })()}
                </div>
              ) : null}
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </InvestorsGraphQLProvider>
  );
} 