import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  IconClock,
  IconMapPin,
  IconTrendingUp,
  IconLoader2
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { CardPreview, CardVariant } from '../../types/cards';
import { CardDetailsDrawer } from './card-details-drawer';
import { getRelativeDate } from '../../utils/formatting';
import { useCardOperations } from '../../contexts/card-operations-context';
import { cn } from '@/lib/utils';
import { getStatusColor, getStatusText, getAssignmentStatusColor, getAssignmentStatusText } from '../ui/status-utils';
import { SocialLinksIcons } from '../ui/actions/social-links-icons';
import { LikeButton } from '../ui/actions/like';
import { DeleteButton } from '../ui/actions/delete';
import { RestoreButton } from '../ui/actions/restore';
import { AddToPipelineButton } from '../ui/actions/add-to-pipeline';
import { useAuth, type User } from '@/contexts/auth-context';
import { getRoundStatusIcon } from '@/features/shared/components/ui/round-icons';
import { SmoothImage } from '../ui/smooth-image';
import { ProgressiveParticipants } from '../ui/progressive-participants';
import { AssignedMembersAvatars } from '../ui/assigned-members-avatars';

// Helper function to extract LinkedIn tags from signals
const extractLinkedInTags = (signals?: any[]): string[] => {
  if (!signals) return [];

  const linkedInTags: string[] = [];
  // LinkedIn tags removed - linkedinData field no longer available

  // Remove duplicates and return
  return Array.from(new Set(linkedInTags));
};

interface CardPreviewProps {
  card: CardPreview;
  variant?: CardVariant;
  onToggleSave?: (cardId: number) => void;
  onDelete?: (cardId: number) => void;
  onRestore?: (cardId: number) => void;
  onDeleteNote?: (cardId: number) => void;
  onStatusChange?: (cardId: number, isLiked: boolean) => void;
  onOpenInvestorModal?: (
    participantId: string,
    participantSlug: string
  ) => void;
  index?: number;
  hideDeleteButton?: boolean;
  currentFolderId?: string | null;
  isHiding?: boolean;
}

// Basic card info component - renders immediately
const CardBasicInfo: React.FC<{
  card: CardPreview;
  index?: number;
  hasNote: boolean;
  isLikedLocal: boolean;
  isCardProcessing: boolean;
  responsiveMaxVisible: number;
  onNoteClick: () => void;
  onToggleLike: () => void;
  handleDelete: () => void;
  handleRestore: () => void;
  handleDeleteNote: () => void;
  variant: CardVariant;
  hideDeleteButton: boolean;
  isProcessing: any;
  renderTextWithLinks: (text: string) => React.ReactNode;
  user?: User | null;
  isAssignedToGroup?: boolean;
  onAddToPipeline?: () => void;
  onAssignmentsClick?: () => void;
}> = ({
  card,
  index,
  hasNote,
  isLikedLocal,
  isCardProcessing,
  responsiveMaxVisible,
  onNoteClick,
  onToggleLike,
  handleDelete,
  handleRestore,
  handleDeleteNote,
  variant,
  hideDeleteButton,
  isProcessing,
  renderTextWithLinks,
  user,
  isAssignedToGroup = false,
  onAddToPipeline,
  onAssignmentsClick
}) => {
  
  return (
    <>
      {/* Project Section - immediately available */}
      <div className='flex items-start space-x-3 lg:col-span-6'>
        <div className='border-border bg-muted h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border-2'>
          {card.image || card.image_url ? (
            <SmoothImage
              src={card.image || card.image_url || ''}
              alt={card.title || card.name || 'Project image'}
              className='h-full w-full object-cover'
              containerClassName='h-full w-full'
              fallback={
                <div className='text-muted-foreground flex h-full w-full items-center justify-center font-medium'>
                  {(card.title || card.name)?.[0] || '?'}
                </div>
              }
            />
          ) : (
            <div className='text-muted-foreground flex h-full w-full items-center justify-center font-medium'>
              {(card.title || card.name)?.[0]}
            </div>
          )}
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='flex items-center gap-1'>
              <h3 className='truncate text-sm font-medium'>
                {card.title || card.name}
              </h3>
              
            </div>
            <div className='flex items-center gap-1'>
              {card.trending && (
                <div className='flex items-center gap-1 rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'>
                  <IconTrendingUp className='h-3 w-3' />
                  <span>Trending</span>
                </div>
              )}
            </div>
            {card.stage_info && card.stage_info.name !== 'Unknown' && (
              <Badge variant='secondary' className='text-xs whitespace-nowrap'>
                {card.stage_info.name}
              </Badge>
            )}
            {card.round_status_info &&
              card.round_status_info.name !== 'Unknown' && (
                <Badge
                  variant='secondary'
                  className='flex items-center gap-1 text-xs whitespace-nowrap'
                >
                  {getRoundStatusIcon(card.round_status_info.key || 'unknown')}
                  {card.round_status_info.name}
                </Badge>
              )}
            {card.status && (
              <Badge variant='secondary' className='text-xs whitespace-nowrap'>
                {getStatusText(card.status)}
              </Badge>
            )}
            {card.assignment_status && (
              <Badge variant='outline' className='text-xs whitespace-nowrap'>
                {getAssignmentStatusText(card.assignment_status)}
              </Badge>
            )}
            {card.open_to_intro && (
              <Badge variant='secondary' className='text-xs whitespace-nowrap'>
                Open to intro
              </Badge>
            )}
          </div>
          <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
            {card.description
              ? renderTextWithLinks(card.description)
              : 'No description'}
          </p>
          <div className='text-muted-foreground mt-2 flex flex-wrap gap-2 text-xs'>
            {card.last_round && (
              <div className='flex items-center gap-1'>
                <IconClock className='h-3.5 w-3.5' />
                <span className='truncate'>
                  Last round:{' '}
                  {getRelativeDate(new Date(card.last_round).toString())}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Section - continuous stream of all categories and LinkedIn tags */}
      <div className='lg:col-span-3'>
        {(() => {
          // Get all normal categories
          const normalCategories =
            card.categories || card.categories_list || [];

          // Get LinkedIn tags
          const linkedInTags = extractLinkedInTags(card.signals);

          // Combine all categories and tags into a single array
          const allCategories = [
            ...normalCategories.map((cat, index) => ({
              type: 'normal',
              name: cat.name,
              key: `normal-${cat.id || cat.slug || index}-${cat.name}`
            })),
            ...linkedInTags.map((tag, index) => ({
              type: 'linkedin',
              name: tag,
              key: `linkedin-${index}-${tag}`
            }))
          ];

          // Apply responsive limits
          const maxToShow = responsiveMaxVisible === 2 ? 3 : undefined;
          const categoriesToShow = maxToShow
            ? allCategories.slice(0, maxToShow)
            : allCategories;

          return (
            <>
              {categoriesToShow.map((item, idx) => (
                <Badge
                  key={item.key}
                  variant='outline'
                  className='mr-1 mb-0.5 inline-block text-xs whitespace-nowrap'
                >
                  {item.name}
                </Badge>
              ))}

              {responsiveMaxVisible === 2 && allCategories.length > 3 && (
                <Badge
                  variant='outline'
                  className='text-muted-foreground mb-0.5 text-xs'
                >
                  +{allCategories.length - 3}
                </Badge>
              )}
            </>
          );
        })()}
      </div>

      {/* Actions Section - immediately available */}
      <div className='flex items-center justify-between lg:col-span-3 lg:flex-col lg:items-end lg:justify-between lg:gap-3'>
        <div className='flex items-center lg:w-full lg:justify-end'>
          <div className='flex gap-1.5'>
            <SocialLinksIcons
              mainUrl={card.url}
              socialLinks={card.social_links}
              variant='grouped'
            />


            {/* Add to Pipeline button - only show if user has group and card is not assigned */}
            {variant !== 'deleted' && user?.group && !isAssignedToGroup && onAddToPipeline && (
              <AddToPipelineButton
                onClick={onAddToPipeline}
                isLoading={false}
                variant='preview'
              />
            )}

            {variant !== 'deleted' && (
              <LikeButton
                onClick={onToggleLike}
                isLiked={isLikedLocal}
                isLoading={false}
                variant='preview'
              />
            )}

            {variant === 'deleted' ? (
              <RestoreButton
                onClick={handleRestore}
                isLoading={
                  !!isProcessing[
                    card.id as unknown as keyof typeof isProcessing
                  ]
                }
                variant='preview'
              />
            ) : variant === 'notes' ? (
              <DeleteButton
                onClick={handleDeleteNote}
                isLoading={
                  !!isProcessing[
                    card.id as unknown as keyof typeof isProcessing
                  ]
                }
                variant='preview'
              />
            ) : (
              !hideDeleteButton && (
                <DeleteButton
                  onClick={handleDelete}
                  isLoading={
                    !!isProcessing[
                      card.id as unknown as keyof typeof isProcessing
                    ]
                  }
                  variant='preview'
                />
              )
            )}
          </div>
        </div>

        {/* Placeholder for participants - will be loaded progressively */}
        <div className='flex min-h-[24px] flex-col items-end gap-1 py-1'>
          <div className='flex items-center gap-2'>
          <ProgressiveParticipants
            card={card}
            maxVisible={responsiveMaxVisible}
            loadDelay={20}
          />
            {/* Assigned members avatars - rectangular icons (only for assigned cards) */}
            {isAssignedToGroup && card.assigned_members && card.assigned_members.length > 0 && (
              <>
                <div className='h-6 w-px bg-border' />
                <AssignedMembersAvatars
                  members={card.assigned_members}
                  maxVisible={3}
                  size='lg'
                  onMemberClick={onAssignmentsClick}
                />
              </>
            )}
          </div>
          {card.latest_date && (
            <span className='text-muted-foreground text-[10px]'>
              {getRelativeDate(new Date(card.latest_date).toString())}
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export const CardPreviewComponent = React.memo<CardPreviewProps>(
  ({
    card,
    variant = 'default',
    onToggleSave,
    onDelete,
    onRestore,
    onDeleteNote,
    onStatusChange,
    onOpenInvestorModal,
    index = 0,
    hideDeleteButton = false,
    currentFolderId = null,
    isHiding = false
  }) => {
    const { isProcessing, removeFromFolder, toggleFavorite } =
      useCardOperations();
    const { user } = useAuth();

    const [isLikedLocal, setIsLikedLocal] = useState(
      card.is_liked || card.is_heart_liked || false
    );
    const [activeTab, setActiveTab] = useState<'interactions' | 'note' | 'assignments'>(
      'interactions'
    );
    const [hasNote, setHasNote] = useState(!!card.has_note);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    // Local state for is_assigned_to_group to update immediately after assignment changes
    const [isAssignedToGroup, setIsAssignedToGroup] = useState(
      card.is_assigned_to_group || false
    );

    // Debug: Log if card is assigned to group
    useEffect(() => {
      if (card.is_assigned_to_group) {
        console.log('[CardPreview] Card assigned to group:', {
          cardId: card.id,
          cardName: card.name || card.title,
          is_assigned_to_group: card.is_assigned_to_group
        });
      }
    }, [card.id, card.is_assigned_to_group, card.name, card.title]);

    useEffect(() => {
      setIsLikedLocal(card.is_liked || card.is_heart_liked || false);
    }, [card.is_liked, card.is_heart_liked]);

    useEffect(() => {
      setIsAssignedToGroup(card.is_assigned_to_group || false);
    }, [card.is_assigned_to_group]);

    // Handle adding card to pipeline
    const handleAddToPipeline = async () => {
      if (!card.id || !user?.group || !user?.id) return;

      try {
        const response = await fetch(`/api/cards/${card.id}/group-members/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            status: 'REVIEW',
            member_ids: [user.id],
            action: 'add'
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to add to pipeline: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          toast.success('Добавлено в CRM');
          setIsAssignedToGroup(true);
        } else {
          throw new Error(result.message || 'Failed to add to pipeline');
        }
      } catch (error) {
        console.error('[CardPreview] Error adding to pipeline:', error);
        toast.error('Не удалось добавить карточку в pipeline');
      }
    };

    const handleToggleLike = async () => {
      const newLikedState = !isLikedLocal;

      // Update UI immediately for instant feedback
      setIsLikedLocal(newLikedState);

      try {
        // Pass the CURRENT state, not the new desired state
        const success = await toggleFavorite(card.id, isLikedLocal);
        if (success && onStatusChange) {
          onStatusChange(card.id, newLikedState);
        } else if (!success) {
          // Revert if the API call failed
          setIsLikedLocal(!newLikedState);
          toast.error('Не удалось обновить статус избранного');
        }
      } catch (error) {
        // Revert if there was an error
        setIsLikedLocal(!newLikedState);
        toast.error('Не удалось обновить статус избранного');
      }
    };

    const handleDelete = async () => {
      try {
        if (onDelete) onDelete(card.id);
      } catch (error) {
        toast.error('Не удалось удалить карточку');
      }
    };

    const handleRestore = () => {
      if (onRestore) onRestore(card.id);
    };

    const handleDeleteNote = () => {
      if (onDeleteNote) onDeleteNote(card.id);
    };

    const handleCardClick = () => {
      if (isCardProcessing) return;
      setIsDrawerOpen(true);
    };

    const handleNoteClick = () => {
      setActiveTab('note');
      setIsDrawerOpen(true);
    };

    const handleAssignmentsClick = () => {
      setActiveTab('assignments');
      setIsDrawerOpen(true);
    };

    const handleNoteStatusChange = (cardId: number, hasNoteStatus: boolean) => {
      setHasNote(hasNoteStatus);
      card.has_note = hasNoteStatus;
    };

    const handleStatusChange = (cardId: number, isLiked: boolean) => {
      if (cardId === card.id && isLikedLocal !== isLiked) {
        setIsLikedLocal(isLiked);
        if (onStatusChange) {
          onStatusChange(cardId, isLiked);
        }
      }
    };

    const renderTextWithLinks = (text: string) => {
      if (!text) return text;

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = text.split(urlRegex);

      return parts.map((part, index) => {
        if (urlRegex.test(part)) {
          const getDomainWithPath = (url: string) => {
            try {
              const urlObj = new URL(url);
              const hostname = urlObj.hostname.replace('www.', '');
              const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname;
              return hostname + pathname;
            } catch {
              return url;
            }
          };

          return (
            <a
              key={index}
              href={part}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:text-primary/80 underline'
              onClick={(e) => e.stopPropagation()}
            >
              {getDomainWithPath(part)}
            </a>
          );
        }
        return part;
      });
    };

    const getResponsiveParticipantCount = () => {
      if (typeof window === 'undefined') return 5;
      const width = window.innerWidth;
      if (width < 640) return 2;
      if (width < 768) return 3;
      if (width < 1024) return 4;
      if (width < 1280) return 5; // lg breakpoint
      return 8; // 2xl+ breakpoint - maximum for fullscreen view
    };

    const [responsiveMaxVisible, setResponsiveMaxVisible] = useState(
      getResponsiveParticipantCount
    );

    useEffect(() => {
      const handleResize = () => {
        setResponsiveMaxVisible(getResponsiveParticipantCount());
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Optimize processing check - prioritize isHiding for instant feedback
    const isCardProcessing = useMemo(() => {
      return isHiding || !!isProcessing[card.id as unknown as keyof typeof isProcessing];
    }, [isHiding, isProcessing, card.id]);

    return (
      <CardDetailsDrawer
        card={{ ...card, is_assigned_to_group: isAssignedToGroup }}
        isLiked={isLikedLocal}
        onToggleLike={handleToggleLike}
        {...(activeTab !== 'interactions' && {
          activeTab: activeTab,
          initialTab: activeTab,
          setActiveTab: (tab: string) =>
            setActiveTab(tab as 'interactions' | 'note' | 'assignments')
        })}
        onNoteStatusChange={handleNoteStatusChange}
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          // Reset to interactions tab when drawer closes
          if (!open) {
            setActiveTab('interactions');
            // Refresh assignment status when drawer closes (in case it was updated)
            // The card prop will be updated from parent context on next render
          }
        }}
        variant={variant === 'deleted' ? 'deleted' : 'default'}
        onDelete={() => onDelete?.(card.id)}
        onRestore={() => onRestore?.(card.id)}
        onDeleteNote={() => onDeleteNote?.(card.id)}
        onStatusChange={handleStatusChange}
        onOpenInvestorModal={onOpenInvestorModal}
        hideDeleteButton={hideDeleteButton}
        onAssignmentChange={(cardId, isAssigned) => {
          if (cardId === card.id) {
            setIsAssignedToGroup(isAssigned);
          }
        }}
      >
        <div
          onClick={handleCardClick}
          className={cn(
            'card-preview relative flex w-full cursor-pointer flex-col px-3 py-3',
            'bg-card hover:bg-accent/40 transition-all duration-200 ease-in-out',
            index !== 0 && 'border-border border-t',
            isCardProcessing && 'pointer-events-none opacity-70 select-none',
            isHiding && 'opacity-0 scale-95 transform-gpu',
            // Highlight if assigned to group
            isAssignedToGroup === true && '!border-l-4 !border-l-primary !bg-primary/3',
            // Highlight if open to intro - with shimmer gradient (works alongside assignment)
            card.open_to_intro && 'card-open-to-intro'
          )}
        >
          {/* Simple loading state */}
          {isCardProcessing && (
            <div className='bg-background/70 absolute inset-0 z-10 flex items-center justify-center'>
              <div className='border-muted border-t-primary h-4 w-4 animate-spin rounded-full border-2' />
            </div>
          )}

          {/* Progressive layout: basic info loads immediately, participants load progressively */}
          <div className='flex w-full flex-col gap-3 lg:grid lg:grid-cols-12 lg:gap-3'>
            <CardBasicInfo
              card={card}
              index={index}
              hasNote={hasNote}
              isLikedLocal={isLikedLocal}
              isCardProcessing={isCardProcessing}
              responsiveMaxVisible={responsiveMaxVisible}
              onNoteClick={handleNoteClick}
              onToggleLike={handleToggleLike}
              handleDelete={handleDelete}
              handleRestore={handleRestore}
              handleDeleteNote={handleDeleteNote}
              variant={variant}
              hideDeleteButton={hideDeleteButton}
              isProcessing={isProcessing}
              renderTextWithLinks={renderTextWithLinks}
              user={user}
              isAssignedToGroup={isAssignedToGroup}
              onAddToPipeline={handleAddToPipeline}
              onAssignmentsClick={handleAssignmentsClick}
            />
          </div>
        </div>
      </CardDetailsDrawer>
    );
  },
  (prevProps, nextProps) => {
    // Optimized memo comparison for better performance
    // Only re-render if essential props change
    if (prevProps.card.id !== nextProps.card.id) return false;
    if (prevProps.isHiding !== nextProps.isHiding) return false;
    if (prevProps.variant !== nextProps.variant) return false;
    
    // For other props, only check if they actually changed
    if (prevProps.card.is_liked !== nextProps.card.is_liked) return false;
    if (prevProps.hideDeleteButton !== nextProps.hideDeleteButton) return false;
    
    return true; // Props are the same, don't re-render
  }
);

CardPreviewComponent.displayName = 'CardPreviewComponent';
