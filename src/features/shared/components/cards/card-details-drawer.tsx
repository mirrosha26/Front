import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  IconCalendar,
  IconHeart,
  IconHeartFilled,
  IconMapPin,
  IconClock,
  IconWorld,
  IconUsers,
  IconNotes,
  IconActivity,
  IconFolder,
  IconLink,
  IconLoader2,
  IconTrash,
  IconArrowBackUp,
  IconDownload,
  IconX
} from '@tabler/icons-react';
import { CardPreview, CardDetails, Folder } from '../../types/cards';
import { getRelativeDate } from '../../utils/formatting';
import { SocialIcon } from '../ui/social-icon';
import { useCardOperations } from '../../contexts/card-operations-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarSkeleton } from '../ui/avatar-skeleton';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { DeleteButton } from '@/features/shared/components/ui/actions/delete';
import { RestoreButton } from '@/features/shared/components/ui/actions/restore';
import { CardNoteEditor } from './card-details-sections/note-editor';
import { CardFolderSelector } from './card-details-sections/folders';
import { CardInteractionsTab } from './card-details-sections/interactions';
import { CardTeamTab } from './card-details-sections/team';
import { CardDetailsHeader } from './card-details-sections/header';
import { CardFundingTab } from './card-details-sections/funding';
import { LinkedInDetailsTab } from './card-details-sections/linkedin-details';
import { FounderDetailsTab } from './card-details-sections/founder-details';
import { CardAssignmentsTab } from './card-details-sections/assignments';
import { hasBothSignalTypesDetailed } from '../../utils/linkedin-detection';

// Helper function to check if there are founder signals
const hasFounderSignals = (
  detailedCard?: CardDetails,
  cardPreview?: CardPreview
): boolean => {
  const signals = detailedCard?.signals || cardPreview?.signals || [];
  return signals.some(
    (signal: any) => signal.signalType?.slug === 'founder' && signal.founder
  );
};

// Helper function to check if there are non-founder interaction signals
const hasNonFounderSignals = (
  detailedCard?: CardDetails,
  cardPreview?: CardPreview
): boolean => {
  const signals = detailedCard?.signals || cardPreview?.signals || [];
  return signals.some(
    (signal: any) =>
      signal.signalType?.slug !== 'founder' && signal.type !== 'founder'
  );
};
import { getRoundStatusIcon } from '@/features/shared/components/ui/round-icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { InvestorDetailModal } from '@/features/investors/components/public/investor-detail-modal';
import { useInvestorsGraphQL } from '@/features/investors/contexts/investors-graphql-context';
import { useAuth } from '@/contexts/auth-context';

interface CardDetailsDrawerProps {
  card: CardPreview;
  isLiked: boolean;
  onToggleLike: () => void;
  children: React.ReactNode;
  initialTab?: string;
  onNoteStatusChange?: (cardId: number, hasNote: boolean) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'deleted';
  onDelete?: (cardId: number) => void;
  onRestore?: (cardId: number) => void;
  onDeleteNote?: (cardId: number) => void;
  onStatusChange?: (cardId: number, isLiked: boolean) => void;
  onOpenInvestorModal?: (
    participantId: string,
    participantSlug: string
  ) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  hideDeleteButton?: boolean;
  onAssignmentChange?: (cardId: number, isAssigned: boolean) => void;
}

export const CardDetailsDrawer: React.FC<CardDetailsDrawerProps> = ({
  card,
  isLiked,
  onToggleLike,
  children,
  initialTab = 'interactions',
  onNoteStatusChange,
  open,
  onOpenChange,
  variant = 'default',
  onDelete,
  onRestore,
  onDeleteNote,
  onStatusChange,
  onOpenInvestorModal,
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
  hideDeleteButton = false,
  onAssignmentChange: externalOnAssignmentChange
}) => {
  const {
    getCardDetails,
    addToFolder,
    removeFromFolder,
    deleteNote,
    addNote,
    updateNote,
    deleteCard,
    restoreCard,
    isProcessing,
    createTicket,
    isCreatingTicket
  } = useCardOperations();
  const { user } = useAuth();
  const [detailedCard, setDetailedCard] = useState<CardDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Local state for card to update is_assigned_to_group flag
  const [localCard, setLocalCard] = useState<CardPreview>(card);
  
  // Ref to track if data has been loaded
  const dataLoadedRef = useRef(false);
  // Ref to track the active tab to prevent switching when card prop updates
  const activeTabRef = useRef<string>('interactions');
  // Ref to track if user has manually selected a tab (to prevent auto-switching)
  const userSelectedTabRef = useRef<boolean>(false);
  
  const [activeTab, setActiveTab] = useState(() => {
    // If initialTab is provided, use it; otherwise default to 'interactions'
    // The actual tab will be set correctly in useEffect when drawer opens
    const tab = initialTab || 'interactions';
    activeTabRef.current = tab;
    return tab;
  });
  
  // Update ref when activeTab changes
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  
  const [folderUpdating, setFolderUpdating] = useState<number | null>(null);
  const [isUpdatingNoteOnly, setIsUpdatingNoteOnly] = useState(false);
  const [isNoteOperation, setIsNoteOperation] = useState(false);
  const [isContactRequestModalOpen, setIsContactRequestModalOpen] =
    useState(false);
  const [isInvestorDetailModalOpen, setIsInvestorDetailModalOpen] =
    useState(false);
  const [investorModalSlug, setInvestorModalSlug] = useState<string>('');

  // Helper function to check if card has LinkedIn data
  const hasLinkedInData = (
    detailedCard: CardDetails | null,
    cardPreview: CardPreview
  ): boolean => {
    // First check CardPreview signals (available immediately)
    if (cardPreview.signals && cardPreview.signals.length > 0) {
      const hasLinkedInFromPreview = cardPreview.signals.some((signal) => {
        // Check if it's a LinkedIn signal type AND has actual LinkedIn data
        const isLinkedInSignalType =
          signal.signalType?.slug === 'linkedin' ||
          signal.signalType?.name === 'LinkedIn';
        const hasLinkedInData = false; // linkedinData field no longer available
        const isLinkedIn = isLinkedInSignalType && hasLinkedInData;
        return isLinkedIn;
      });
      if (hasLinkedInFromPreview) {
        return true;
      }
    }

    // Fall back to detailed card signals (loaded later)
    if (!detailedCard?.signals || detailedCard.signals.length === 0) {
      return false;
    }

    const hasLinkedInFromDetailed = detailedCard.signals.some((signal) => {
      // Check if it's a LinkedIn signal type AND has actual LinkedIn data
      const isLinkedInSignalType =
        signal.signalType?.slug === 'linkedin' ||
        signal.signalType?.name === 'LinkedIn';
      const hasLinkedInData =
        signal.linkedinData && signal.linkedinData !== null;
      const isLinkedIn = isLinkedInSignalType && hasLinkedInData;
      return isLinkedIn;
    });

    return hasLinkedInFromDetailed;
  };

  // Helper function to check if card has both LinkedIn and normal signals
  const hasBothSignalTypes = (
    detailedCard: CardDetails | null,
    cardPreview: CardPreview
  ): boolean => {
    // Use the imported function for detailed card
    if (detailedCard) {
      // Only check for actual LinkedIn signals, not LinkedIn data in people
      const hasLinkedInSignals =
        detailedCard.signals?.some((signal: any) => {
          const isLinkedInSignalType =
            signal.signalType?.slug === 'linkedin' ||
            signal.signalType?.name === 'LinkedIn';
          const hasLinkedInData =
            signal.linkedinData && signal.linkedinData !== null;
          return isLinkedInSignalType && hasLinkedInData;
        }) || false;

      const hasNormalSignals =
        detailedCard.signals?.some((signal: any) => {
          const isLinkedInSignalType =
            signal.signalType?.slug === 'linkedin' ||
            signal.signalType?.name === 'LinkedIn';
          const hasLinkedInData =
            signal.linkedinData && signal.linkedinData !== null;
          const isLinkedInSignal = isLinkedInSignalType && hasLinkedInData;
          return !isLinkedInSignal;
        }) || false;

      const detailedResult = hasLinkedInSignals && hasNormalSignals;

      // If detailed data doesn't have LinkedIn signals but preview does, use preview data
      if (
        !detailedResult &&
        cardPreview.signals &&
        cardPreview.signals.length > 0
      ) {
        const hasLinkedInFromPreview = cardPreview.signals.some((signal) => {
          const isLinkedInSignalType =
            signal.signalType?.slug === 'linkedin' ||
            signal.signalType?.name === 'LinkedIn';
          const hasLinkedInData =
            signal.linkedinData && signal.linkedinData !== null;
          return isLinkedInSignalType && hasLinkedInData;
        });
        const hasNormalFromPreview = cardPreview.signals.some((signal) => {
          const isLinkedInSignalType =
            signal.signalType?.slug === 'linkedin' ||
            signal.signalType?.name === 'LinkedIn';
          const hasLinkedInData =
            signal.linkedinData && signal.linkedinData !== null;
          const isLinkedInSignal = isLinkedInSignalType && hasLinkedInData;
          return !isLinkedInSignal;
        });

        return hasLinkedInFromPreview && hasNormalFromPreview;
      }

      return detailedResult;
    }

    // Fallback to preview data
    if (!cardPreview.signals || cardPreview.signals.length === 0) {
      return false;
    }

    const hasLinkedIn = cardPreview.signals.some((signal) => {
      const isLinkedInSignalType =
        signal.signalType?.slug === 'linkedin' ||
        signal.signalType?.name === 'LinkedIn';
      const hasLinkedInData =
        signal.linkedinData && signal.linkedinData !== null;
      return isLinkedInSignalType && hasLinkedInData;
    });

    const hasNormal = cardPreview.signals.some((signal) => {
      const isLinkedInSignalType =
        signal.signalType?.slug === 'linkedin' ||
        signal.signalType?.name === 'LinkedIn';
      const hasLinkedInData =
        signal.linkedinData && signal.linkedinData !== null;
      const isLinkedInSignal = isLinkedInSignalType && hasLinkedInData;
      return !isLinkedInSignal;
    });

    return hasLinkedIn && hasNormal;
  };

  // Get toggleFollow function from context
  let toggleFollow:
    | ((participantId: string, currentIsSaved?: boolean) => Promise<void>)
    | undefined;
  try {
    const context = useInvestorsGraphQL();
    toggleFollow = context.toggleFollow;
  } catch (error) {
    // InvestorsGraphQL context not available, toggleFollow will be disabled
  }

  // Handle follow toggle for investor modal
  const handleFollowToggle = async (
    participantId: string,
    currentIsSaved?: boolean
  ) => {
    if (!toggleFollow) {
      return;
    }

    // Optimistically update card state
    const newIsSaved = !(currentIsSaved || false);
    // Preserve current tab when updating detailedCard
    const currentTab = activeTabRef.current;
    setDetailedCard((prev) => {
      if (!prev) return prev;

      // Update participants in interactions
      if (prev.participants) {
        const updatedParticipants = prev.participants.map((participant) => {
          // Skip participants without associated_id
          if (!participant.associated_id) return participant;

          return participant.associated_id.toString() === participantId
            ? { ...participant, associated_saved: newIsSaved }
            : participant;
        });

        return {
          ...prev,
          participants: updatedParticipants
        };
      }

      return prev;
    });
    // Restore tab after update
    if (currentTab) {
      setActiveTab(currentTab);
      activeTabRef.current = currentTab;
    }

    try {
      await toggleFollow(participantId, currentIsSaved);
    } catch (error) {
      console.error('CardDetailsDrawer: Error toggling follow:', error);
      toast.error('Не удалось изменить статус подписки');

      // Revert optimistic update on error
      // Preserve current tab when reverting detailedCard
      const currentTab = activeTabRef.current;
      setDetailedCard((prev) => {
        if (!prev) return prev;

        if (prev.participants) {
          const updatedParticipants = prev.participants.map((participant) => {
            // Skip participants without associated_id
            if (!participant.associated_id) return participant;

            return participant.associated_id.toString() === participantId
              ? { ...participant, associated_saved: currentIsSaved || false }
              : participant;
          });

          return {
            ...prev,
            participants: updatedParticipants
          };
        }

        return prev;
      });
      // Restore tab after revert
      if (currentTab) {
        setActiveTab(currentTab);
        activeTabRef.current = currentTab;
      }
    }
  };

  // Function to open investor modal
  const handleOpenInvestorModal = useCallback(
    (participantId: string, participantSlug: string) => {
      if (onOpenInvestorModal) {
        // Use external handler if provided
        onOpenInvestorModal(participantId, participantSlug);
      } else {
        // Fallback to local modal
        setInvestorModalSlug(participantSlug);
        setIsInvestorDetailModalOpen(true);
      }
    },
    [onOpenInvestorModal]
  );

  // Function to close investor modal
  const handleCloseInvestorModal = useCallback(() => {
    setIsInvestorDetailModalOpen(false);
    setInvestorModalSlug('');
  }, []);

  // Use external open state if provided
  const isOpenControlled = open !== undefined;
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpenValue = isOpenControlled ? open : isOpenInternal;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isOpenControlled) {
      setIsOpenInternal(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  // Load detailed card information when drawer opens
  useEffect(() => {
    // Load data only if drawer is open, data is not loaded and hasn't been loaded before
    if (isOpenValue && !detailedCard && !isLoading && !dataLoadedRef.current) {
      const fetchCardDetails = async () => {
        setIsLoading(true);
        try {
          const details = await getCardDetails(card.id);
          if (details) {
            // Preserve current tab when updating detailedCard
            const currentTab = activeTabRef.current;
            setDetailedCard(details);
            // Mark that data has been loaded
            dataLoadedRef.current = true;
            // Restore tab after data load to prevent reset
            if (currentTab && currentTab !== 'interactions') {
              setActiveTab(currentTab);
              activeTabRef.current = currentTab;
            }
          }
        } catch (error) {
          console.error(
            `[CardDetailsDrawer] Error loading data for card ${card.id}:`,
            error
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchCardDetails();
    }
  }, [isOpenValue, card.id, getCardDetails]);

  // Update local card when prop changes
  // Use a ref to track if we've manually updated is_assigned_to_group
  // to avoid resetting it when card prop updates
  const assignmentChangeRef = useRef<{ cardId: number; isAssigned: boolean } | null>(null);
  
  useEffect(() => {
    // Preserve current tab when card prop updates (from preview changes)
    // This prevents tab reset when card preview updates after detailedCard changes
    const currentTab = activeTabRef.current;
    const userHasSelectedTab = userSelectedTabRef.current;
    
    // If user is on assignments tab, don't update localCard to prevent tab switching
    // This is especially important when creating a new assignment (POST request)
    // which causes card prop to update from parent component
    if (activeTabRef.current === 'assignments') {
      // Only update is_assigned_to_group if it changed, but preserve other local state
      setLocalCard((prev) => {
        if (prev.id !== card.id) {
          assignmentChangeRef.current = null;
          return card;
        }
        
        // If we recently updated is_assigned_to_group via handleAssignmentChange,
        // preserve that value instead of using the prop value
        if (
          assignmentChangeRef.current &&
          assignmentChangeRef.current.cardId === card.id &&
          assignmentChangeRef.current.isAssigned === prev.is_assigned_to_group &&
          card.is_assigned_to_group !== prev.is_assigned_to_group
        ) {
          assignmentChangeRef.current = null;
          return prev;
        }
        
        // Update is_assigned_to_group from prop if it changed, but keep other local state
        if (card.is_assigned_to_group !== prev.is_assigned_to_group) {
          return {
            ...prev,
            is_assigned_to_group: card.is_assigned_to_group
          };
        }
        
        return prev;
      });
      // Restore tab after update to prevent reset
      if (currentTab && userHasSelectedTab) {
        setActiveTab(currentTab);
        activeTabRef.current = currentTab;
      }
      return;
    }
    
    // For other tabs, update normally but preserve tab if user has selected it
    setLocalCard((prev) => {
      // If card ID changed, always update
      if (prev.id !== card.id) {
        assignmentChangeRef.current = null;
        return card;
      }
      
      // If we recently updated is_assigned_to_group via handleAssignmentChange,
      // preserve that value instead of using the prop value
      // This prevents tab switching when assignment is created/updated
      if (
        assignmentChangeRef.current &&
        assignmentChangeRef.current.cardId === card.id &&
        assignmentChangeRef.current.isAssigned === prev.is_assigned_to_group &&
        card.is_assigned_to_group !== prev.is_assigned_to_group
      ) {
        // Clear the ref after using it (only once)
        const shouldPreserve = assignmentChangeRef.current !== null;
        if (shouldPreserve) {
          assignmentChangeRef.current = null;
        }
        // Return previous state to preserve is_assigned_to_group
        return prev;
      }
      
      // Otherwise, update with new card data
      return card;
    });
    
    // Restore tab after update if user has manually selected it
    // This prevents tab reset when card prop updates from preview changes
    if (currentTab && userHasSelectedTab && currentTab !== 'interactions') {
      setActiveTab(currentTab);
      activeTabRef.current = currentTab;
    }
  }, [card]);

  // Handle assignment change to update is_assigned_to_group flag
  const handleAssignmentChange = useCallback((cardId: number, isAssigned: boolean, isNewAssignment?: boolean) => {
    if (cardId === card.id) {
      // Store the assignment change in ref to prevent prop update from resetting it
      assignmentChangeRef.current = { cardId, isAssigned };
      setLocalCard((prev) => ({
        ...prev,
        is_assigned_to_group: isAssigned
      }));
      
      // If this is a new assignment (POST), switch to assignments tab
      if (isNewAssignment && user?.group) {
        setActiveTab('assignments');
        activeTabRef.current = 'assignments';
        // Sync with external state if provided
        if (externalSetActiveTab) {
          externalSetActiveTab('assignments');
        }
      }
      
      // Also notify parent component if callback provided
      externalOnAssignmentChange?.(cardId, isAssigned);
    }
  }, [card.id, externalOnAssignmentChange, externalSetActiveTab, user?.group]);

  // Reset state when drawer closes and initialize when opens
  useEffect(() => {
    if (!isOpenValue) {
      dataLoadedRef.current = false;
      userSelectedTabRef.current = false; // Reset user selection flag
      // Reset detailedCard and tab when drawer closes
      setDetailedCard(null);
      setActiveTab('interactions'); // Reset to default tab
      activeTabRef.current = 'interactions';
    } else {
      // When drawer opens, set the appropriate initial tab
      // Use provided external tab, initial tab, or default based on signal types
      // Only set tab when drawer first opens (dataLoadedRef.current is false)
      // This prevents tab from resetting when card updates while drawer is open
      if (!dataLoadedRef.current) {
        let defaultTab = externalActiveTab || initialTab;

        // If no explicit tab is provided, determine default based on signal types
        if (!defaultTab) {
          const hasBoth = hasBothSignalTypes(detailedCard, card);
          const hasInteractions = hasNonFounderSignals(
            detailedCard || undefined,
            card
          );
          const hasLinkedIn = hasLinkedInData(detailedCard, card);
          const hasFounder = hasFounderSignals(detailedCard || undefined, card);

          if (hasBoth) {
            defaultTab = 'details';
          } else if (hasInteractions || hasLinkedIn) {
            defaultTab = 'interactions';
          } else if (hasFounder) {
            // If only founder signals exist, default to founder tab
            defaultTab = 'founder';
          } else {
            // Fallback to interactions if no signals at all
            defaultTab = 'interactions';
          }
        }

        setActiveTab(defaultTab);
        dataLoadedRef.current = true;
      }
    }
  }, [isOpenValue, externalActiveTab, initialTab]);

  // Sync external tab state with internal state
  useEffect(() => {
    if (externalActiveTab && isOpenValue) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab, isOpenValue]);

  // Re-evaluate default tab once detailedCard data is loaded
  // Only run on initial load, not when detailedCard updates after user actions
  useEffect(() => {
    // Only run if drawer is open, data is loaded, and no explicit tab was provided
    // Don't switch tabs if user is on assignments, folders, note, team, funding, or founder tabs
    // Only auto-switch from 'interactions' tab to avoid disrupting user's current view
    // IMPORTANT: Only run on initial data load, not when detailedCard updates after user actions
    const userManagedTabs = ['assignments', 'folders', 'note', 'team', 'funding', 'founder'];
    const currentTab = activeTabRef.current;
    
    // Only auto-switch tabs if:
    // 1. User is on 'interactions' tab (default)
    // 2. No external tab is set
    // 3. User hasn't manually switched to another tab
    // 4. This is the initial load (dataLoadedRef was just set to true)
    // This prevents tab switching when detailedCard or card prop updates after user actions
    const isInitialLoad = dataLoadedRef.current && !userSelectedTabRef.current;
    
    if (
      isOpenValue &&
      detailedCard &&
      !externalActiveTab &&
      !isLoading &&
      isInitialLoad &&
      currentTab === 'interactions' &&
      !userManagedTabs.includes(currentTab)
    ) {
      const hasBoth = hasBothSignalTypes(detailedCard, localCard);
      const hasInteractions = hasNonFounderSignals(
        detailedCard || undefined,
        localCard
      );
      const hasLinkedIn = hasLinkedInData(detailedCard, localCard);
      const hasFounder = hasFounderSignals(detailedCard || undefined, localCard);

      // Determine the appropriate tab based on available signals
      let appropriateTab = currentTab;

      // If current tab is 'interactions' but there are no interactions and no LinkedIn data (only founder signals)
      if (
        currentTab === 'interactions' &&
        !hasInteractions &&
        !hasLinkedIn &&
        hasFounder
      ) {
        appropriateTab = 'founder';
      }
      // If both signal types exist and current tab is 'interactions', switch to 'details'
      else if (currentTab === 'interactions' && hasBoth) {
        appropriateTab = 'details';
      }

      // Only switch if we're still on interactions tab (user hasn't manually switched)
      // This prevents switching when card prop updates after assignment creation
      if (appropriateTab !== currentTab && activeTabRef.current === 'interactions') {
        setActiveTab(appropriateTab);
        // Sync with external state if provided
        if (externalSetActiveTab) {
          externalSetActiveTab(appropriateTab);
        }
      }
    }
  }, [detailedCard, isOpenValue, isLoading, externalActiveTab, localCard, initialTab]);

  // Note: Removed automatic tab switching to allow users to manually select tabs
  // The tab switching logic was preventing users from accessing the interactions tab
  // when both signal types exist. Users should be able to manually switch between tabs.

  // Note update handler
  const handleNoteUpdated = (newNoteText: string) => {
    if (detailedCard) {
      // Preserve current tab when updating detailedCard
      const currentTab = activeTabRef.current;
      setDetailedCard({
        ...detailedCard,
        user_data: {
          ...detailedCard.user_data,
          note_text: newNoteText,
          has_note: newNoteText.trim() !== ''
        }
      });
      // Restore tab after update
      if (currentTab) {
        setActiveTab(currentTab);
        activeTabRef.current = currentTab;
      }
    }
    setIsUpdatingNoteOnly(false);
  };

  // Note deletion handler
  const handleDeleteNote = async () => {
    if (!detailedCard) return;

    setIsNoteOperation(true);

    if (onDeleteNote) {
      onDeleteNote(card.id);
    } else {
      const success = await deleteNote(card.id);
      if (success) {
        // Preserve current tab when updating detailedCard
        const currentTab = activeTabRef.current;
        // Update card state after note deletion
        setDetailedCard({
          ...detailedCard,
          user_data: {
            ...detailedCard.user_data,
            note_text: '',
            has_note: false
          }
        });
        // Restore tab after update
        if (currentTab) {
          setActiveTab(currentTab);
          activeTabRef.current = currentTab;
        }

        // Call note status change handler
        handleNoteStatusChange(card.id, false);
      }
    }

    setIsNoteOperation(false);
  };

  // Note save handler
  const handleSaveNote = async (noteText: string) => {
    if (!detailedCard) return false;

    setIsNoteOperation(true);

    const hasExistingNote = detailedCard.user_data?.has_note || false;
    const method = hasExistingNote ? updateNote : addNote;
    const isNewNote = !hasExistingNote;

    const result = await method(card.id, noteText);

    if (result.success) {
      // Preserve current tab before updating detailedCard
      const currentTab = activeTabRef.current;
      
      // Update card state with received note text
      setDetailedCard({
        ...detailedCard,
        user_data: {
          ...detailedCard.user_data,
          note_text: result.noteText,
          has_note: result.noteText.trim() !== ''
        }
      });

      // Call note status change handler
      handleNoteStatusChange(card.id, result.noteText.trim() !== '');
      
      // Switch to note tab after creating a new note
      if (isNewNote) {
        setActiveTab('note');
        activeTabRef.current = 'note';
        // Sync with external state if provided
        if (externalSetActiveTab) {
          externalSetActiveTab('note');
        }
      } else {
        // Preserve current tab if updating existing note
        if (currentTab) {
          setActiveTab(currentTab);
          activeTabRef.current = currentTab;
        }
      }
    }

    setIsNoteOperation(false);
    return result.success;
  };

  // Like toggle handler
  const handleToggleLike = async () => {
    // Call provided handler to update like status
    onToggleLike();
    // If we have detailed card information
    if (detailedCard && detailedCard.user_data?.folders) {
      // Find default folder
      const defaultFolder = detailedCard.user_data.folders.find(
        (folder) => folder.is_default
      );

      if (defaultFolder) {
        // Preserve current tab when updating detailedCard
        const currentTab = activeTabRef.current;
        // Update local folder state
        const updatedFolders = detailedCard.user_data.folders.map((folder) =>
          folder.id === defaultFolder.id
            ? { ...folder, has_card: !isLiked }
            : folder
        );

        // Update detailed card state
        setDetailedCard({
          ...detailedCard,
          user_data: {
            ...detailedCard.user_data,
            folders: updatedFolders
          }
        });
        // Restore tab after update
        if (currentTab) {
          setActiveTab(currentTab);
          activeTabRef.current = currentTab;
        }

        // No need to send additional requests as backend
        // automatically handles adding/removing from default folder
      }
    }
  };

  // Folder update handler
  const handleFoldersUpdated = (updatedFolders: Folder[]) => {
    if (detailedCard) {
      // Preserve current tab before updating detailedCard
      const currentTab = activeTabRef.current;
      
      // Find default folder among updated folders
      const defaultFolder = updatedFolders.find((folder) => folder.is_default);

      // If default folder is found and its status differs from current like status,
      // update like status in parent component
      if (
        defaultFolder &&
        onStatusChange &&
        defaultFolder.has_card !== isLiked
      ) {
        onStatusChange(card.id, defaultFolder.has_card);
      }

      setDetailedCard({
        ...detailedCard,
        user_data: {
          ...detailedCard.user_data,
          folders: updatedFolders
        }
      });
      
      // Switch to folders tab after successful update
      setActiveTab('folders');
      activeTabRef.current = 'folders';
      // Sync with external state if provided
      if (externalSetActiveTab) {
        externalSetActiveTab('folders');
      }
    }
  };

  // Get data from CardPreview
  const cardTitle = card.title || card.name || 'No title';
  const cardDescription = card.description || 'No description';
  const cardImage = card.image || card.image_url;
  const cardLocation = card.location || card.city;
  const cardStage = card.stage_info?.name;
  const cardRoundStatus = card.round_status_info?.name;
  const cardRoundStatusKey = card.round_status_info?.key || 'unknown';
  const cardCategories = card.categories || [];
  const cardDate = card.created_at || card.discovered_at || card.latest_date;

  // Get participants list from CardPreview
  const participants =
    card.participants_list?.map((p) => ({
      name: p.name,
      image: p.image || undefined,
      is_private: p.is_private,
      is_saved: p.is_saved
    })) || [];

  // Add participants from detailed info if available
  const allParticipants = detailedCard?.participants
    ? detailedCard.participants.map((p) => ({
        name: p.associated_name,
        image: p.associated_image || undefined,
        is_private: p.associated_is_private,
        is_saved: p.associated_saved
      }))
    : participants;

  const hasMoreParticipants = card.participants_has_more || false;
  const moreParticipantsCount = card.participants_more_count || 0;

  // Safe link handling
  const socialLinks = card.social_links || [];
  const mainUrl = card.url || '';
  const hasLinks = mainUrl || socialLinks.length > 0;

  // Safe status and color handling
  const getStatusColorSafe = (status: string | undefined) => {
    if (!status) return 'default';

    const statusLower = status.toLowerCase();
    if (statusLower.includes('active')) return 'green';
    if (statusLower.includes('closed')) return 'red';
    if (statusLower.includes('pending')) return 'yellow';
    return 'default';
  };

  const getStatusTextSafe = (status: string | undefined) => {
    if (!status) return 'No status';
    return status;
  };

  const statusColor = getStatusColorSafe(card.status);
  const statusText = getStatusTextSafe(card.status);

  // Card deletion handler
  const handleDelete = async () => {
    if (!card.id) return;

    if (onDelete) {
      onDelete(card.id);
      handleOpenChange(false); // Close drawer after deletion
    } else {
      const cardName = card.title || card.name || 'No title';

      toast.info(`Карточка "${cardName}" скрыта`, {
        action: {
          label: 'Отменить',
          onClick: async () => {
            const success = await restoreCard(card.id);
            if (success) {
              toast.success(`Карточка "${cardName}" восстановлена`);
            } else {
              toast.info('Не удалось восстановить карточку');
            }
          }
        }
      });

      const success = await deleteCard(card.id);
      if (!success) {
        toast.info('Не удалось удалить карточку');
      } else {
        handleOpenChange(false); // Close drawer after successful deletion
      }
    }
  };

  // Card restoration handler
  const handleRestore = async () => {
    if (!card.id) return;

    if (onRestore) {
      onRestore(card.id);
      handleOpenChange(false); // Close drawer after restoration
    } else {
      const cardName = card.title || card.name || 'No title';

      toast.success(`Карточка "${cardName}" восстановлена`, {
        action: {
          label: 'Отменить',
          onClick: async () => {
            const success = await deleteCard(card.id);
            if (success) {
              toast.info(`Карточка "${cardName}" скрыта`);
            } else {
              toast.error('Не удалось удалить карточку');
            }
          }
        }
      });

      const success = await restoreCard(card.id);
      if (!success) {
        toast.error('Не удалось восстановить карточку');
      } else {
        handleOpenChange(false); // Close drawer after successful restoration
      }
    }
  };

  // Note status update handler
  const handleNoteStatusChange = useCallback(
    (cardId: number, hasNoteStatus: boolean) => {
      // Pass note status change to parent component
      if (onNoteStatusChange) {
        onNoteStatusChange(cardId, hasNoteStatus);
      }

      // Update note status in detailedCard without re-rendering tabs
      if (detailedCard) {
        // Preserve current tab when updating detailedCard
        const currentTab = activeTabRef.current;
        setDetailedCard((prevCard) => {
          if (!prevCard) return null;
          return {
            ...prevCard,
            user_data: {
              ...prevCard.user_data,
              has_note: hasNoteStatus
            }
          };
        });
        // Restore tab after update
        if (currentTab) {
          setActiveTab(currentTab);
          activeTabRef.current = currentTab;
        }
      }
    },
    [onNoteStatusChange, detailedCard]
  );

  // Use React.memo in TabsContent for note to prevent re-rendering
  const MemoizedNoteEditor = React.memo(
    ({ cardId, noteText, onSaveNote, onDeleteNote, isProcessing }) => (
      <CardNoteEditor
        cardId={cardId}
        initialNoteText={noteText}
        onSaveNote={onSaveNote}
        onDeleteNote={onDeleteNote}
        isProcessing={isProcessing}
      />
    )
  );

  MemoizedNoteEditor.displayName = 'MemoizedNoteEditor';

  // Contact request handler
  const handleContactRequest = () => {
    // Always open modal window, content will depend on ticket presence
    setIsContactRequestModalOpen(true);
  };

  // Contact request confirmation handler
  const handleContactRequestConfirm = async () => {
    if (card.id) {
      const success = await createTicket(card.id);
      if (success) {
        // Update local state to reflect ticket creation
        if (detailedCard) {
          // Preserve current tab when updating detailedCard
          const currentTab = activeTabRef.current;
          setDetailedCard({
            ...detailedCard,
            has_ticket: true
          });
          // Restore tab after update
          if (currentTab) {
            setActiveTab(currentTab);
            activeTabRef.current = currentTab;
          }
        }
      }
      setIsContactRequestModalOpen(false);
    }
  };

  // Check ticket presence
  const hasTicket = detailedCard?.has_ticket || false;
  const isCreatingTicketForCard = card.id ? isCreatingTicket[card.id] : false;

  const handleShare = () => {
    // Share handler: copy public card URL to clipboard
    const slug = (detailedCard as any)?.slug || card.slug;
    if (slug) {
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/public/${slug}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Ссылка скопирована');
    }
  };
  return (
    <>
      <Drawer open={isOpenValue} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className='max-h-[85vh] border border-zinc-200 !shadow-none hover:shadow-none dark:border-zinc-800 dark:bg-zinc-900'>
          <DrawerTitle className='sr-only'>
            {cardTitle || 'Card details'}
          </DrawerTitle>
          <div className='mx-auto flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden'>
            <DrawerHeader className='flex-shrink-0 px-4 pb-2'>
              <CardDetailsHeader
                cardImage={
                  (detailedCard as any)?.image || card.image_url || card.image
                }
                cardTitle={
                  (detailedCard as any)?.name ||
                  card.name ||
                  card.title ||
                  'No title'
                }
                cardDescription={
                  (detailedCard as any)?.description ||
                  card.description ||
                  'No description'
                }
                cardStage={card.stage_info?.name}
                cardRoundStatus={card.round_status_info?.name}
                cardRoundStatusKey={card.round_status_info?.key || 'unknown'}
                cardLastRound={
                  (detailedCard as any)?.lastRound || card.last_round
                }
                cardLocation={card.location}
                cardCategories={card.categories || card.categories_list}
                mainUrl={(detailedCard as any)?.url || card.url}
                socialLinks={
                  (detailedCard as any)?.social_links || card.social_links
                }
                variant={variant}
                isLiked={isLiked}
                isLoading={false}
                onToggleLike={handleToggleLike}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onShare={handleShare}
                hideDeleteButton={hideDeleteButton}
                hasTicket={hasTicket}
                onContactRequest={
                  detailedCard ? handleContactRequest : undefined
                }
              />
            </DrawerHeader>

            <div className='flex-1 overflow-hidden px-4 py-2'>
              {isLoading && !isUpdatingNoteOnly ? (
                <div className='flex h-full flex-col'>
                  <div className='mb-2 grid h-9 flex-shrink-0 grid-cols-4 rounded-md bg-zinc-100 dark:bg-zinc-800'>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className='h-9 rounded-md' />
                    ))}
                  </div>
                  <div className='flex-1 overflow-auto'>
                    <div className='space-y-4 p-2'>
                      <Skeleton className='mb-2 h-5 w-32' />
                      <div className='space-y-2'>
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className='flex items-start gap-2 rounded-md bg-zinc-100 p-2 dark:bg-zinc-800'
                          >
                            <AvatarSkeleton count={1} size='sm' />
                            <div className='flex-1'>
                              <Skeleton className='mb-1 h-3 w-24' />
                              <Skeleton className='mb-1 h-2 w-full' />
                              <Skeleton className='h-2 w-16' />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='flex h-full flex-col pb-4'>
                  {/* Tabs */}
                  <Tabs
                    className='flex h-full w-full flex-col'
                    value={activeTab}
                    onValueChange={(value) => {
                      setActiveTab(value);
                      activeTabRef.current = value;
                      // Mark that user manually selected this tab
                      userSelectedTabRef.current = true;
                      // Sync with external state if provided
                      if (externalSetActiveTab) {
                        externalSetActiveTab(value);
                      }
                    }}
                  >
                    <TabsList
                      className={`-mr-1 grid h-9 w-full flex-shrink-0 rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 ${(() => {
                        const hasTeam =
                          detailedCard?.people &&
                          detailedCard.people.length > 0;
                        const hasFunding =
                          detailedCard?.funding &&
                          (detailedCard.funding.rounds?.length > 0 ||
                            detailedCard.funding.total_raised);
                        const hasBothSignals =
                          !isLoading && hasBothSignalTypes(detailedCard, card);
                        const hasInteractions =
                          !isLoading &&
                          hasNonFounderSignals(detailedCard || undefined, card);

                        // Calculate number of tabs
                        let tabCount = 2; // Base: folders, note
                        const hasLinkedIn =
                          !isLoading && hasLinkedInData(detailedCard, card);
                        if (hasInteractions || hasLinkedIn) tabCount += 1; // Add interactions/details tab
                        if (hasBothSignals) tabCount += 1; // Add separate Details tab
                        if (hasTeam) tabCount += 1; // Add team tab
                        if (hasFunding) tabCount += 1; // Add funding tab
                        if (
                          !isLoading &&
                          hasFounderSignals(detailedCard || undefined, card)
                        )
                          tabCount += 1; // Add founder tab
                        if (user?.group) tabCount += 1; // Add assignments tab

                        return `grid-cols-${tabCount}`;
                      })()}`}
                    >
                      {/* Show both Details and Interactions tabs when both signal types exist */}
                      {(() => {
                        const hasBoth =
                          !isLoading && hasBothSignalTypes(detailedCard, card);
                        const hasInteractions =
                          !isLoading &&
                          hasNonFounderSignals(detailedCard || undefined, card);
                        const hasLinkedIn =
                          !isLoading && hasLinkedInData(detailedCard, card);

                        if (hasBoth) {
                          return (
                            <>
                              <TabsTrigger
                                value='details'
                                className='cursor-pointer text-xs'
                              >
                                Детали
                              </TabsTrigger>
                              <TabsTrigger
                                value='interactions'
                                className='cursor-pointer text-xs'
                              >
                                Взаимодействия
                              </TabsTrigger>
                            </>
                          );
                        } else if (hasInteractions || hasLinkedIn) {
                          return (
                            <TabsTrigger
                              value='interactions'
                              className='cursor-pointer text-xs'
                            >
                              {hasLinkedIn ? 'Детали' : 'Взаимодействия'}
                            </TabsTrigger>
                          );
                        }
                        return null;
                      })()}
                      {detailedCard?.people &&
                        detailedCard.people.length > 0 && (
                          <TabsTrigger
                            value='team'
                            className='cursor-pointer text-xs'
                          >
                            Команда
                          </TabsTrigger>
                        )}
                      {!isLoading &&
                        hasFounderSignals(detailedCard || undefined, card) && (
                          <TabsTrigger
                            value='founder'
                            className='cursor-pointer text-xs'
                          >
                            Основатель
                          </TabsTrigger>
                        )}
                      {detailedCard?.funding &&
                        (detailedCard.funding.rounds?.length > 0 ||
                          detailedCard.funding.total_raised) && (
                          <TabsTrigger
                            value='funding'
                            className='cursor-pointer text-xs'
                          >
                            Финансирование
                          </TabsTrigger>
                        )}
                      {user?.group && (
                        <TabsTrigger
                          value='assignments'
                          className='cursor-pointer text-xs'
                        >
                          CRM
                          </TabsTrigger>
                        )}
                      <TabsTrigger
                        value='folders'
                        className='cursor-pointer text-xs'
                      >
                        Папки
                      </TabsTrigger>
                      <TabsTrigger
                        value='note'
                        className='cursor-pointer px-2 text-xs'
                      >
                        Заметка
                      </TabsTrigger>
                    </TabsList>

                    <div className='mt-3 flex-1 overflow-hidden'>
                      {/* Details Tab (LinkedIn signals only) */}
                      {!isLoading && hasBothSignalTypes(detailedCard, card) && (
                        <TabsContent value='details' className='h-full'>
                          <ScrollArea
                            className='h-full px-1'
                            scrollbar={{
                              size: 2.5,
                              className: 'bg-transparent',
                              thumbClassName:
                                'bg-black/25 dark:bg-zinc-500/60 rounded-full hover:bg-black/35 dark:hover:bg-zinc-400/80'
                            }}
                          >
                            <LinkedInDetailsTab
                              detailedCard={detailedCard}
                              cardPreview={card}
                              isLoading={isLoading}
                            />
                          </ScrollArea>
                        </TabsContent>
                      )}

                      {/* Interactions Tab - only show if there are non-founder signals or LinkedIn data */}
                      {!isLoading &&
                        (hasNonFounderSignals(
                          detailedCard || undefined,
                          card
                        ) ||
                          hasLinkedInData(detailedCard, card)) && (
                          <TabsContent value='interactions' className='h-full'>
                            <ScrollArea
                              className='h-full px-1'
                              scrollbar={{
                                size: 2.5,
                                className: 'bg-transparent',
                                thumbClassName:
                                  'bg-black/25 dark:bg-zinc-500/60 rounded-full hover:bg-black/35 dark:hover:bg-zinc-400/80'
                              }}
                            >
                              {!isLoading &&
                              hasBothSignalTypes(detailedCard, card) ? (
                                // Show normal interactions when both signal types exist
                                <CardInteractionsTab
                                  detailedCard={detailedCard}
                                  card={card}
                                  isLoading={isLoading}
                                  onOpenInvestorModal={handleOpenInvestorModal}
                                />
                              ) : !isLoading &&
                                hasLinkedInData(detailedCard, card) ? (
                                // Show LinkedIn details when only LinkedIn signals exist
                                <LinkedInDetailsTab
                                  detailedCard={detailedCard}
                                  cardPreview={card}
                                  isLoading={isLoading}
                                />
                              ) : (
                                // Show normal interactions when only normal signals exist
                                <CardInteractionsTab
                                  detailedCard={detailedCard}
                                  card={card}
                                  isLoading={isLoading}
                                  onOpenInvestorModal={handleOpenInvestorModal}
                                />
                              )}
                            </ScrollArea>
                          </TabsContent>
                        )}

                      {/* Team Tab */}
                      <TabsContent value='team' className='h-full'>
                        <ScrollArea
                          className='h-full px-1'
                          scrollbar={{
                            size: 2.5,
                            className: 'bg-transparent',
                            thumbClassName:
                              'bg-black/25 dark:bg-zinc-500/60 rounded-full hover:bg-black/35 dark:hover:bg-zinc-400/80'
                          }}
                        >
                          <CardTeamTab detailedCard={detailedCard} />
                        </ScrollArea>
                      </TabsContent>

                      {/* Funding Tab */}
                      <TabsContent value='funding' className='h-full'>
                        <ScrollArea
                          className='h-full px-1'
                          scrollbar={{
                            size: 2.5,
                            className: 'bg-transparent',
                            thumbClassName:
                              'bg-black/25 dark:bg-zinc-500/60 rounded-full hover:bg-black/35 dark:hover:bg-zinc-400/80'
                          }}
                        >
                          <CardFundingTab detailedCard={detailedCard} />
                        </ScrollArea>
                      </TabsContent>

                      {/* Founder Tab */}
                      {!isLoading &&
                        hasFounderSignals(detailedCard || undefined, card) && (
                          <TabsContent value='founder' className='h-full'>
                            <ScrollArea
                              className='h-full px-1'
                              scrollbar={{
                                size: 2.5,
                                className: 'bg-transparent',
                                thumbClassName:
                                  'bg-black/25 dark:bg-zinc-500/60 rounded-full hover:bg-black/35 dark:hover:bg-zinc-400/80'
                              }}
                            >
                              <FounderDetailsTab
                                detailedCard={detailedCard}
                                cardPreview={card}
                                isLoading={isLoading}
                              />
                            </ScrollArea>
                          </TabsContent>
                        )}

                      {/* CRM Tab */}
                      {user?.group && (
                        <TabsContent value='assignments' className='h-full'>
                          <ScrollArea
                            className='h-full px-1'
                            scrollbar={{
                              size: 2.5,
                              className: 'bg-transparent',
                              thumbClassName:
                                'bg-black/25 dark:bg-zinc-500/60 rounded-full hover:bg-black/35 dark:hover:bg-zinc-400/80'
                            }}
                          >
                            <CardAssignmentsTab 
                              card={localCard} 
                              isLoading={isLoading}
                              onAssignmentChange={handleAssignmentChange}
                              />
                            </ScrollArea>
                          </TabsContent>
                        )}

                      {/* Folders Tab */}
                      <TabsContent value='folders' className='h-full'>
                        <ScrollArea
                          className='h-full px-1'
                          scrollbar={{
                            size: 2.5,
                            className: 'bg-transparent',
                            thumbClassName:
                              'bg-black/25 dark:bg-zinc-500/60 rounded-full hover:bg-black/35 dark:hover:bg-zinc-400/80'
                          }}
                        >
                          <CardFolderSelector
                            cardId={card.id}
                            folders={detailedCard?.user_data?.folders || []}
                            onFoldersUpdated={handleFoldersUpdated}
                          />
                        </ScrollArea>
                      </TabsContent>

                      {/* Note Tab */}
                      <TabsContent value='note' className='h-full'>
                        <ScrollArea
                          className='h-full px-1'
                          scrollbar={{
                            size: 2.5,
                            className: 'bg-transparent',
                            thumbClassName:
                              'bg-black/25 dark:bg-zinc-500/60 rounded-full hover:bg-black/35 dark:hover:bg-zinc-400/80'
                          }}
                        >
                          <MemoizedNoteEditor
                            cardId={card.id}
                            noteText={detailedCard?.user_data?.note_text || ''}
                            onSaveNote={handleSaveNote}
                            onDeleteNote={handleDeleteNote}
                            isProcessing={
                              isProcessing.notes[card.id] || isNoteOperation
                            }
                          />
                        </ScrollArea>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Contact request confirmation dialog */}
      <Dialog
        open={isContactRequestModalOpen}
        onOpenChange={setIsContactRequestModalOpen}
      >
        <DialogContent className='max-w-md gap-2 p-5'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>
              {hasTicket ? 'Contact request status' : 'Request contact details'}
            </DialogTitle>
          </DialogHeader>

          {hasTicket ? (
            <DialogDescription className='text-zinc-700 dark:text-zinc-300'>
              A contact request for this project has already been submitted. You
              can check its status in the Founder Contacts section.
            </DialogDescription>
          ) : (
            <DialogDescription className='text-zinc-700 dark:text-zinc-300'>
              Are you sure you want to request contact details for this project?
            </DialogDescription>
          )}

          <DialogFooter className='mt-3'>
            <Button
              variant='outline'
              className='dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              onClick={() => setIsContactRequestModalOpen(false)}
            >
              {hasTicket ? 'Close' : 'Cancel'}
            </Button>

            {!hasTicket && (
              <Button
                variant='default'
                className='bg-zinc-900 text-white text-sm dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                onClick={handleContactRequestConfirm}
                disabled={isCreatingTicketForCard}
              >
                {isCreatingTicketForCard ? 'Sending...' : 'Confirm'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Investor Detail Modal - only show when no external handler is provided */}
      {!onOpenInvestorModal && investorModalSlug && (
        <InvestorDetailModal
          isOpen={isInvestorDetailModalOpen}
          onClose={handleCloseInvestorModal}
          slug={investorModalSlug}
          onFollowToggle={handleFollowToggle}
        />
      )}
    </>
  );
};
