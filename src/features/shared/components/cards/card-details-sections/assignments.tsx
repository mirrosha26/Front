import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  IconLoader2,
  IconUser,
  IconUserCheck,
  IconUserX,
  IconCalendar,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { CardPreview } from '../../../types/cards';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarSkeleton } from '../../ui/avatar-skeleton';
import { cn } from '@/lib/utils';
import { getRelativeDate } from '../../../utils/formatting';
import { useApolloClient } from '@apollo/client';
import { GET_GROUP_ASSIGNMENTS_QUERY } from '@/lib/graphql/queries';
import { useGroupAssignments } from '@/features/in-progress-cards/contexts/group-assignments-context';

interface GroupMember {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
  is_assigned: boolean;
  assigned_by?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
  };
  assigned_at?: string;
}

interface GroupInfo {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  logoUrl?: string;
}

interface AssignmentsData {
  success: boolean;
  group?: GroupInfo;
  card_id: number;
  status?: 'REVIEW' | 'REACHING_OUT' | 'CONNECTED' | 'NOT_A_FIT';
  members: GroupMember[];
}

interface CardAssignmentsTabProps {
  card: CardPreview;
  isLoading?: boolean;
  onAssignmentChange?: (cardId: number, isAssigned: boolean, isNewAssignment?: boolean) => void;
  onRefetchAssignments?: () => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: 'REVIEW', label: 'Review', description: 'Initial screening before outreach', color: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' },
  { value: 'REACHING_OUT', label: 'Reaching out', description: 'Outreach in progress', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
  { value: 'CONNECTED', label: 'Connected', description: 'Connected', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' },
  { value: 'NOT_A_FIT', label: 'Not a Fit', description: 'No further action. Not relevant or no response after outreach.', color: 'bg-zinc-100/50 text-zinc-500 border-zinc-200/50 dark:bg-zinc-800/30 dark:text-zinc-500 dark:border-zinc-700/50 opacity-60' }
] as const;

const getStatusColor = (status?: string) => {
  if (!status) return STATUS_OPTIONS[0].color;
  const option = STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.color || STATUS_OPTIONS[0].color;
};

const getStatusLabel = (status?: string) => {
  if (!status) return STATUS_OPTIONS[0].label;
  const option = STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label || status;
};

export const CardAssignmentsTab: React.FC<CardAssignmentsTabProps> = ({
  card,
  isLoading: externalLoading = false,
  onAssignmentChange,
  onRefetchAssignments
}) => {
  const apolloClient = useApolloClient();
  // Try to get refetchAssignments from context if available (for assignments page)
  let contextRefetchAssignments: (() => Promise<void>) | undefined;
  try {
    const context = useGroupAssignments();
    contextRefetchAssignments = context.refetchAssignments;
  } catch (e) {
    // Context not available (not in assignments page), use prop instead
  }
  
  const refetchAssignments = onRefetchAssignments || contextRefetchAssignments;
  const [data, setData] = useState<AssignmentsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[] | null>(null); // null = not selected (for unassigned cards), [] = no one selected (for assigned cards), [1,2] = members selected

  // Fetch assignments data
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!card.id) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/cards/${card.id}/group-members/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch((fetchError) => {
          console.error('[Assignments] Fetch error:', fetchError);
          throw new Error(`Network error: ${fetchError.message}`);
        });

        if (!response) {
          throw new Error('No response from server');
        }

        if (!response.ok) {
          if (response.status === 404) {
            // Card not assigned to group - try to get group members info from response
            try {
              const errorData = await response.json();
              // If response contains group and members info, use it
              if (errorData.group && Array.isArray(errorData.members)) {
                setData({
                  success: false,
                  group: errorData.group,
                  card_id: Number(card.id),
                  status: undefined,
                  members: errorData.members.map((m: any) => ({
                    ...m,
                    is_assigned: false
                  }))
                });
                // If card is not assigned to group, nothing should be selected
                setSelectedMembers(null);
              } else {
                setData(null);
                setSelectedMembers(null);
              }
            } catch {
              setData(null);
              setSelectedMembers(null);
            }
            setIsLoading(false);
            return;
          }
          
          // Try to get error message from response
          let errorMessage = `Failed to fetch: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.detail || errorMessage;
          } catch {
            // If JSON parsing fails, use status text
            errorMessage = response.statusText || errorMessage;
          }
          
          console.error('[Assignments] Error response:', {
            status: response.status,
            message: errorMessage
          });
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        if (result.success) {
          setData(result);
          // Initialize selected members with currently assigned ones from API response
          // Only if card is assigned to group (card.is_assigned_to_group = true)
          // For assigned cards: if no one is assigned, set to [] (so "Assign to no one" is selected)
          // If members are assigned, set to their IDs
          // If card is not assigned to group, set to null (nothing selected)
          if (card.is_assigned_to_group) {
            const assignedIds = result.members
              .filter((m: GroupMember) => m.is_assigned)
              .map((m: GroupMember) => Number(m.id)); // Ensure IDs are numbers
            console.log('[Assignments] Initializing selectedMembers:', {
              assignedIds,
              members: result.members.map((m: GroupMember) => ({
                id: m.id,
                is_assigned: m.is_assigned,
                username: m.username
              }))
            });
            // For assigned cards, always set to array (empty if no one assigned, or with IDs if assigned)
            setSelectedMembers(assignedIds.length > 0 ? assignedIds : []);
          } else {
            // Card is not assigned to group - nothing should be selected
            setSelectedMembers(null);
          }
        } else {
          setData(null);
          setSelectedMembers(null); // Not selected yet for unassigned card
        }
      } catch (error) {
        console.error('[Assignments] Error fetching assignments:', error);
        toast.error('Не удалось загрузить назначения');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [card.id, card.is_assigned_to_group]);

  // Reset selectedMembers when card assignment status changes
  useEffect(() => {
    if (!card.is_assigned_to_group) {
      // If card is not assigned to group, clear all selections
      setSelectedMembers(null);
    }
  }, [card.is_assigned_to_group]);

  // Debug: Log selectedMembers changes
  useEffect(() => {
    const isNull = selectedMembers === null;
    const isArray = Array.isArray(selectedMembers);
    const isEmptyArray = isArray && selectedMembers.length === 0;
    const shouldShowButton = !isNull && isEmptyArray;
    
    console.log('[Assignments] selectedMembers changed:', {
      selectedMembers,
      type: typeof selectedMembers,
      isNull,
      isArray,
      isEmptyArray,
      length: selectedMembers?.length,
      shouldShowButton,
      'selectedMembers === null': selectedMembers === null,
      'selectedMembers === []': JSON.stringify(selectedMembers) === JSON.stringify([]),
      'Array.isArray(selectedMembers)': Array.isArray(selectedMembers),
      'selectedMembers?.length === 0': selectedMembers?.length === 0
    });
  }, [selectedMembers]);

  // Handle member toggle
  const handleMemberToggle = (memberId: number | string) => {
    const id = Number(memberId);
    setSelectedMembers((prev) => {
      if (prev === null) {
        return [id]; // First selection from unselected state
      }
      if (prev.includes(id)) {
        const newSelection = prev.filter((prevId) => prevId !== id);
        // If all members deselected, return [] for "no one" (not null, so button appears)
        return newSelection.length === 0 ? [] : newSelection;
      } else {
        // When selecting a member, remove "no one" selection (empty array)
        // and add the member to the list
        return [...(prev.length === 0 ? [] : prev), id];
      }
    });
  };

  // Save member assignments
  const handleSaveAssignments = async () => {
    // Check if we have all required data
    // selectedMembers === null means user hasn't made a selection yet
    // selectedMembers === [] means user selected "Assign to no one"
    // selectedMembers === [id1, id2] means user selected specific members
    if (!card.id || !data || selectedMembers === null) {
      console.log('[Assignments] handleSaveAssignments - Cannot save:', {
        hasCardId: !!card.id,
        hasData: !!data,
        selectedMembers,
        reason: !card.id ? 'no card id' : !data ? 'no data' : 'no selection made'
      });
      return;
    }

    setIsUpdating(true);
    
    // Store previous state for rollback in case of error
    const previousData = data ? { ...data } : null;
    const previousSelectedMembers = selectedMembers;
    
    try {
      // Determine if card is assigned to group
      // data.success === true means card is assigned (from successful GET response)
      // data.success === false means card is NOT assigned (from 404 response with group info)
      // data.success === undefined means no data (shouldn't happen here due to check above)
      
      // Force POST if data.success is not explicitly true
      // This ensures we always create a new assignment if card is not assigned
      const isCardAssigned = data.success === true;
      const usePost = data.success !== true; // Use POST if not explicitly true (false or undefined)
      const method = usePost ? 'POST' : 'PUT';
      
      // Additional safety check: if card.is_assigned_to_group is false, force POST
      const shouldForcePost = card.is_assigned_to_group === false;
      const finalMethod = shouldForcePost ? 'POST' : method;
      const finalUsePost = shouldForcePost || usePost;
      
      // Optimistic update: update selectedMembers immediately for better UX
      // This makes UI feel more responsive
      if (selectedMembers !== null) {
        // Keep current selection visible while API call is in progress
        // The actual data will be refreshed after successful save
      }
      
      console.log('[Assignments] handleSaveAssignments - Method selection:', {
        cardId: card.id,
        'data.success': data.success,
        'data.success type': typeof data.success,
        'card.is_assigned_to_group': card.is_assigned_to_group,
        isCardAssigned,
        usePost,
        shouldForcePost,
        method,
        finalMethod,
        finalUsePost,
        'data.status': data.status,
        selectedMembers
      });
      
      const requestBody: any = {
        member_ids: selectedMembers
      };
      
      // Include action only for PUT/PATCH
      if (!finalUsePost) {
        requestBody.action = 'replace';
      }
      
      // Include current status if it exists, or default to REVIEW for new assignments
      if (data.status) {
        requestBody.status = data.status;
      } else {
        requestBody.status = 'REVIEW'; // Default status for new assignments
      }
      
      console.log('[Assignments] Saving assignments:', {
        cardId: card.id,
        cardIsAssigned: card.is_assigned_to_group,
        dataSuccess: data.success,
        dataSuccessType: typeof data.success,
        isCardAssigned,
        usePost,
        method,
        selectedMembers,
        status: requestBody.status,
        hasData: !!data,
        hasStatus: !!data.status,
        requestBody
      });
      const url = `/api/cards/${card.id}/group-members/`;
      console.log('[Assignments] Making request:', {
        url,
        method: finalMethod,
        requestBody
      });
      
      const response = await fetch(url, {
        method: finalMethod,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      
      console.log('[Assignments] Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        // Revert optimistic state on error
        if (previousData) {
          setData(previousData);
        }
        setSelectedMembers(previousSelectedMembers);
        throw new Error(`Failed to ${finalUsePost ? 'create' : 'update'}: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        toast.success(`Назначения ${finalUsePost ? 'созданы' : 'обновлены'} успешно`);
        // Notify parent component - card is now assigned to group
        // Pass isNewAssignment=true for POST (creation), false for PUT (update)
        onAssignmentChange?.(card.id, true, finalUsePost);
        
        // Invalidate Apollo cache and refetch with current filters
        // This ensures the card appears/disappears in the correct tabs immediately
        try {
          // Evict cache to force fresh data
          apolloClient.cache.evict({ fieldName: 'groupAssignments' });
          apolloClient.cache.gc();
          
          // Refetch all active queries with their current variables
          // This will update the list with current filters (status, filterType)
          await apolloClient.refetchQueries({
            include: [GET_GROUP_ASSIGNMENTS_QUERY]
          });
          
          // Also trigger refetch in GroupAssignmentsContext to update preview immediately
          if (refetchAssignments) {
            await refetchAssignments();
          }
        } catch (cacheError) {
          console.warn('[Assignments] Failed to refresh cache:', cacheError);
          // Non-critical error, don't block the UI
        }
        
        // Refresh data to get latest state from server
        // This ensures we have accurate data after save
        const refreshResponse = await fetch(`/api/cards/${card.id}/group-members/`, {
          method: 'GET',
          credentials: 'include'
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success) {
            setData(refreshData);
            // Update selected members from refreshed data (after save)
            const assignedIds = refreshData.members
              .filter((m: GroupMember) => m.is_assigned)
              .map((m: GroupMember) => m.id);
            setSelectedMembers(assignedIds.length > 0 ? assignedIds : []);
          }
        }
      } else {
        // Revert optimistic state on error
        if (previousData) {
          setData(previousData);
        }
        setSelectedMembers(previousSelectedMembers);
        throw new Error(result.message || `Failed to ${finalUsePost ? 'create' : 'update'} assignments`);
      }
    } catch (error) {
      console.error('[Assignments] Error saving assignments:', error);
      // Revert optimistic state on error
      if (previousData) {
        setData(previousData);
      }
      setSelectedMembers(previousSelectedMembers);
      toast.error('Не удалось сохранить назначения');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string, isRetry = false) => {
    if (!card.id) return;

    setIsUpdating(true);
    try {
      // Check if card is assigned to group - need multiple confirmations:
      // 1. data.success === true (from API response)
      // 2. data.status exists (assignment has a status, meaning it's fully created)
      // 3. card.is_assigned_to_group === true (card prop indicates assignment)
      // If any of these is false, use POST to create assignment
      const isAssigned = data !== null && 
                        data !== undefined && 
                        data.success === true && 
                        data.status !== null && 
                        data.status !== undefined &&
                        card.is_assigned_to_group === true;
      
      console.log('[Assignments] handleStatusChange - Assignment check:', {
        cardId: card.id,
        'data': data,
        'data?.success': data?.success,
        'card.is_assigned_to_group': card.is_assigned_to_group,
        isAssigned,
        newStatus,
        selectedMembers
      });
      
      // If card is not assigned to group, assign it first
      if (!isAssigned) {
        // Assign card to group with the new status
        // Always include member_ids (even if empty) to ensure status and members are set together
        // If selectedMembers is null (no selection made), use empty array (Assign to no one)
        const requestBody: any = {
          status: newStatus,
          member_ids: selectedMembers !== null ? selectedMembers : [] // null means "no one selected", use []
        };
        
        const assignResponse = await fetch(`/api/cards/${card.id}/group-members/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        });

        const assignResult = await assignResponse.json();
        
        if (!assignResponse.ok || !assignResult.success) {
          const errorMessage = assignResult.message || assignResult.error || `Failed to assign card: ${assignResponse.status}`;
          console.error('[Assignments] Failed to create assignment:', {
            status: assignResponse.status,
            response: assignResult,
            requestBody
          });
          throw new Error(errorMessage);
        }

        if (assignResult.success) {
          toast.success('Статус успешно обновлен');
          // This is a new assignment (POST request)
          onAssignmentChange?.(card.id, true, true);
          
          // Refresh data to get updated assignment info
          const refreshResponse = await fetch(`/api/cards/${card.id}/group-members/`, {
            method: 'GET',
            credentials: 'include'
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              setData(refreshData);
              // Update selectedMembers based on refreshed data
              if (refreshData.members) {
                const assignedIds = refreshData.members
                  .filter((m: GroupMember) => m.is_assigned)
                  .map((m: GroupMember) => m.id);
                setSelectedMembers(assignedIds.length > 0 ? assignedIds : []);
              } else {
                setSelectedMembers([]);
              }
            }
          }
          
          // Invalidate Apollo cache and refetch
          try {
            apolloClient.cache.evict({ fieldName: 'groupAssignments' });
            apolloClient.cache.gc();
            await apolloClient.refetchQueries({
              include: [GET_GROUP_ASSIGNMENTS_QUERY]
            });
            if (refetchAssignments) {
              await refetchAssignments();
            }
          } catch (cacheError) {
            console.warn('[Assignments] Failed to refresh cache:', cacheError);
          }
        } else {
          throw new Error(assignResult.message || 'Failed to assign card');
        }
      } else {
        // Update status for already assigned card
        // Always include member_ids in the request along with status
        // If selectedMembers is null (no explicit selection), preserve current assignments
        // If selectedMembers is [] (explicitly selected "no one"), use empty array
        const requestBody: any = {
          status: newStatus
        };
        
        if (selectedMembers !== null) {
          // User has explicitly selected members (can be empty array for "no one")
          requestBody.member_ids = selectedMembers;
          requestBody.action = 'replace';
        } else if (data?.members) {
          // No explicit selection, preserve current assignments (default behavior)
          const currentAssignedIds = data.members
            .filter((m: GroupMember) => m.is_assigned)
            .map((m: GroupMember) => m.id);
          requestBody.member_ids = currentAssignedIds;
          requestBody.action = 'replace';
        } else {
          // Fallback: no members data, use empty array
          requestBody.member_ids = [];
          requestBody.action = 'replace';
        }
        
        // Optimistic update: update UI immediately before API call
        const previousStatus = data?.status;
        setData((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        
        const response = await fetch(`/api/cards/${card.id}/group-members/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          // Revert optimistic update on error
          setData((prev) => (prev ? { ...prev, status: previousStatus as any } : null));
          
          if (response.status === 404 && !isRetry) {
            // Card was unassigned, try to assign it (prevent infinite recursion)
            toast.info('Карточка была снята с назначения. Повторное назначение...');
            return handleStatusChange(newStatus, true); // Retry with assignment flag
          }
          throw new Error(`Failed to update status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          toast.success('Статус успешно обновлен');
          // State already updated optimistically, just confirm
          // Notify parent component (card remains assigned)
          // This is an update (PUT request), not a new assignment
          onAssignmentChange?.(card.id, true, false);
          
          // Invalidate Apollo cache and refetch with current filters
          // This ensures the card appears/disappears in the correct status tab immediately
          try {
            // Evict cache to force fresh data
            apolloClient.cache.evict({ fieldName: 'groupAssignments' });
            apolloClient.cache.gc();
            
            // Refetch all active queries with their current variables
            // This will update the list with current filters (status, filterType)
            await apolloClient.refetchQueries({
              include: [GET_GROUP_ASSIGNMENTS_QUERY]
            });
            
            // Also trigger refetch in GroupAssignmentsContext to update preview immediately
            if (refetchAssignments) {
              await refetchAssignments();
            }
          } catch (cacheError) {
            console.warn('[Assignments] Failed to refresh cache:', cacheError);
            // Non-critical error, don't block the UI
          }
        } else {
          // Revert optimistic update on error
          setData((prev) => (prev ? { ...prev, status: previousStatus as any } : null));
          throw new Error(result.message || 'Failed to update status');
        }
      }
    } catch (error) {
      console.error('[Assignments] Error updating status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges = () => {
    if (!data || selectedMembers === null) return false;
    
    // For unassigned cards (data.success === false), any selection is a change
    if (data.success === false) {
      return true; // Any selection (including []) is a change for unassigned cards
    }
    
    const currentAssigned = data.members
      .filter((m) => m.is_assigned)
      .map((m) => m.id)
      .sort();
    const newAssigned = [...selectedMembers].sort();
    // Return true if there are changes, including clearing all assignments
    return JSON.stringify(currentAssigned) !== JSON.stringify(newAssigned);
  };
  
  // Check if we can save (either has changes or can clear all assignments)
  const canSave = () => {
    if (!data) return false;
    
    // For unassigned cards (data.success === false), can save if user made a selection
    // selectedMembers !== null means user made an explicit choice (can be [] for "no one" or [id1, id2] for members)
    if (data.success === false) {
      return selectedMembers !== null; // User made a selection (can be [] for "no one" or [id1, id2] for members)
    }
    
    // For assigned cards, can save if:
    // 1. There are changes in member assignments
    // 2. User explicitly selected "Assign to no one" (selectedMembers === []) - even if it was already []
    //    This allows saving when user clicks on "Assign to no one" checkbox
    const hasExplicitSelection = selectedMembers !== null;
    const hasMemberChanges = hasChanges();
    const selectedNoOne = hasExplicitSelection && Array.isArray(selectedMembers) && selectedMembers.length === 0;
    
    // If user selected "no one", always allow save (even if it was already selected)
    // This ensures button appears when user clicks on "Assign to no one" checkbox
    if (selectedNoOne) {
      return true;
    }
    
    // Otherwise, check for changes
    return hasMemberChanges;
  };

  if (externalLoading || isLoading) {
    return (
      <div className='space-y-4 pb-4'>
        <div className='space-y-2'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-10 w-full' />
        </div>
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className='flex items-center gap-3'>
              <AvatarSkeleton count={1} size='md' />
              <div className='flex-1'>
                <Skeleton className='h-4 w-32 mb-2' />
                <Skeleton className='h-3 w-24' />
              </div>
              <Skeleton className='h-5 w-5' />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle assigning card to group without specific members
  const handleAssignToGroup = async () => {
    if (!card.id) return;

    setIsUpdating(true);
    try {
      // Use new API: just POST with status (or empty body for default REVIEW)
      const response = await fetch(`/api/cards/${card.id}/group-members/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'REVIEW'
        })
      }).catch((fetchError) => {
        console.error('[Assignments] Fetch error when assigning:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      });

      if (!response) {
        throw new Error('No response from server');
      }

      if (!response.ok) {
        let errorMessage = `Failed to assign: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        toast.success('Карточка успешно назначена группе');
        // Notify parent component to update card flag
        // This is a new assignment (POST request)
        onAssignmentChange?.(card.id, true, true);
        
        // Refresh data to show the assignment
        const refreshResponse = await fetch(`/api/cards/${card.id}/group-members/`, {
          method: 'GET',
          credentials: 'include'
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success) {
            setData(refreshData);
            setSelectedMembers([]);
          }
        }
      } else {
        throw new Error(result.message || 'Failed to assign card to group');
      }
    } catch (error) {
      console.error('[Assignments] Error assigning card to group:', error);
      toast.error('Не удалось назначить карточку группе');
    } finally {
      setIsUpdating(false);
    }
  };

  // If card is not assigned but we have group members data, show assignment UI
  const isNotAssigned = !data || (data && !data.success);
  const hasGroupMembers = data && data.members && data.members.length > 0;

  if (isNotAssigned && !hasGroupMembers) {
    return (
      <div className='flex h-full items-center justify-center py-8'>
        <div className='text-center space-y-4'>
          <div>
            <p className='text-muted-foreground text-sm mb-2'>
              This card is not assigned to your group
            </p>
            <p className='text-muted-foreground text-xs'>
              Assign it to your group to manage assignments and track status
            </p>
          </div>
          <Button
            onClick={handleAssignToGroup}
            disabled={isUpdating}
            size='sm'
          >
            {isUpdating ? (
              <>
                <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                Assigning...
              </>
            ) : (
              <>
                <IconUserCheck className='mr-2 h-4 w-4' />
                Assign to Group
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // If card is not assigned but we have group members, show assignment UI with members
  if (isNotAssigned && hasGroupMembers) {
    return (
      <div className='space-y-4 pb-4'>
        <div className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'>
          <div className='mb-2'>
            <p className='text-muted-foreground text-sm mb-1'>
              This card is not assigned to your group
            </p>
            <p className='text-muted-foreground text-xs'>
              Choose how to assign it to your group
            </p>
          </div>
        </div>

        {/* Members Section */}
        <div className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'>
          <div className='mb-3 flex items-center justify-between'>
            <h6 className='text-xs font-medium'>Участники группы</h6>
            <div className='flex gap-2'>
              {/* Show "Assign to pipeline" button when "Assign to no one" is selected (selectedMembers === []) */}
              {/* For unassigned cards, show button when user explicitly selected "no one" */}
              {/* This button appears ONLY when selectedMembers is an empty array [] (not null) */}
              {(() => {
                const shouldShow = selectedMembers !== null && Array.isArray(selectedMembers) && selectedMembers.length === 0;
                console.log('[Assignments] Button render check:', {
                  selectedMembers,
                  isNull: selectedMembers === null,
                  isArray: Array.isArray(selectedMembers),
                  length: selectedMembers?.length,
                  shouldShow
                });
                return shouldShow;
              })() && (
                <Button
                  size='sm'
                  onClick={handleSaveAssignments}
                  disabled={isUpdating}
                  className='h-7 text-xs'
                >
                  {isUpdating ? (
                    <>
                      <IconLoader2 className='mr-1 h-3 w-3 animate-spin' />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <IconUserCheck className='mr-1 h-3 w-3' />
                      Assign to pipeline
                    </>
                  )}
                </Button>
              )}
              {/* Show "Assign with selected (N)" button when members are selected */}
              {selectedMembers !== null && selectedMembers.length > 0 && (
                <Button
                  size='sm'
                  onClick={async () => {
                    if (!card.id) return;
                    setIsUpdating(true);
                    try {
                      const response = await fetch(`/api/cards/${card.id}/group-members/`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                          status: 'REVIEW',
                          member_ids: selectedMembers,
                          action: 'replace'
                        })
                      });

                      if (!response.ok) {
                        throw new Error(`Failed to assign: ${response.status}`);
                      }

                      const result = await response.json();
                      if (result.success) {
                        toast.success('Карточка назначена группе с выбранными участниками');
                        // This is a new assignment (POST request)
                        onAssignmentChange?.(card.id, true, true);
                        
                        // Refresh data
                        const refreshResponse = await fetch(`/api/cards/${card.id}/group-members/`, {
                          method: 'GET',
                          credentials: 'include'
                        });
                        if (refreshResponse.ok) {
                          const refreshData = await refreshResponse.json();
                          if (refreshData.success) {
                            setData(refreshData);
                            const assignedIds = refreshData.members
                              .filter((m: GroupMember) => m.is_assigned)
                              .map((m: GroupMember) => m.id);
                            setSelectedMembers(assignedIds);
                          }
                        }
                      } else {
                        throw new Error(result.message || 'Failed to assign card');
                      }
                    } catch (error) {
                      console.error('[Assignments] Error assigning with members:', error);
                      toast.error('Не удалось назначить карточку группе');
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  disabled={isUpdating}
                  className='h-7 text-xs'
                >
                  {isUpdating ? (
                    <>
                      <IconLoader2 className='mr-1 h-3 w-3 animate-spin' />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <IconUserCheck className='mr-1 h-3 w-3' />
                      Assign with selected ({selectedMembers.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            {data.members.map((member) => {
              const memberId = Number(member.id);
              const isSelected = selectedMembers !== null && selectedMembers.includes(memberId);
              const displayName =
                member.first_name && member.last_name
                  ? `${member.first_name} ${member.last_name}`
                  : member.username;

              return (
                <div
                  key={member.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors',
                    isSelected
                      ? 'bg-primary/5 border border-primary/20'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  )}
                  onClick={() => !isUpdating && handleMemberToggle(memberId)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleMemberToggle(memberId)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isUpdating}
                  />
                  <Avatar className='h-8 w-8 flex-shrink-0 rounded-lg'>
                    {member.avatar && (
                      <AvatarImage
                        src={member.avatar}
                        alt={displayName}
                        className='object-cover rounded-lg'
                      />
                    )}
                    <AvatarFallback className='rounded-lg'>
                      {displayName[0]?.toUpperCase() || <IconUser className='h-4 w-4' />}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-xs font-medium'>{displayName}</p>
                  </div>
                </div>
              );
            })}
            
            {/* Option: Assign without selecting anyone - at the end of the list */}
            <div
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors',
                selectedMembers !== null && Array.isArray(selectedMembers) && selectedMembers.length === 0
                  ? 'bg-primary/5 border border-primary/20'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              )}
              onClick={(e) => {
                // Don't handle click if clicking on checkbox (it has its own handler)
                if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
                  return;
                }
                if (!isUpdating) {
                  console.log('[Assignments] Clicked "Assign to no one" row, current selectedMembers:', selectedMembers);
                  // Always set to [] when clicking the row (select "Assign to no one")
                  setSelectedMembers([]);
                  console.log('[Assignments] Selecting "Assign to no one", setting to []');
                }
              }}
            >
              <Checkbox
                checked={selectedMembers !== null && Array.isArray(selectedMembers) && selectedMembers.length === 0}
                onCheckedChange={(checked) => {
                  console.log('[Assignments] Checkbox "Assign to no one" changed:', checked, 'current:', selectedMembers);
                  if (checked) {
                    // Always set to [] when checking "Assign to no one"
                    setSelectedMembers([]);
                    console.log('[Assignments] Set selectedMembers to [] from checkbox');
                  } else {
                    // If unchecking, set back to null (no selection)
                    setSelectedMembers(null);
                    console.log('[Assignments] Set selectedMembers to null (unchecked)');
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[Assignments] Checkbox clicked directly');
                }}
                disabled={isUpdating}
              />
              <div className='min-w-0 flex-1'>
                <p className='text-xs font-medium'>Assign to no one</p>
                <p className='text-muted-foreground mt-0.5 text-[10px]'>
                  Card will be moved to assignments without a specific person
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 pb-4'>
      {/* Status Section */}
      <div className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'>
        <div className='mb-2 flex items-center justify-between'>
          <h6 className='text-xs font-medium'>Статус CRM</h6>
          {data.status && (
            <Badge className={cn('text-xs', getStatusColor(data.status))}>
              {getStatusLabel(data.status)}
            </Badge>
          )}
        </div>
        <Select
          value={data.status || 'REVIEW'}
          onValueChange={handleStatusChange}
          disabled={isUpdating}
        >
          <SelectTrigger className='h-9 w-full'>
            <SelectValue>
              {data.status ? getStatusLabel(data.status) : 'Review'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className='flex flex-col'>
                  <span className='font-medium'>{option.label}</span>
                  {option.description && (
                    <span className='text-muted-foreground text-xs mt-0.5'>{option.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Members Section */}
      <div className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'>
        <div className='mb-3 flex items-center justify-between'>
          <h6 className='text-xs font-medium'>Участники группы</h6>
          {canSave() && (
            <Button
              size='sm'
              onClick={handleSaveAssignments}
              disabled={isUpdating}
              className='h-7 text-xs'
            >
              {isUpdating ? (
                <>
                  <IconLoader2 className='mr-1 h-3 w-3 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <IconCheck className='mr-1 h-3 w-3' />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>

        {data.members.length === 0 ? (
          <div className='rounded-md border border-dashed border-zinc-300 dark:border-zinc-600 p-3 text-center'>
            <p className='text-muted-foreground text-xs'>
              No members in group
            </p>
            <p className='text-muted-foreground mt-1 text-[10px]'>
              Card is assigned to pipeline without specific assignees
            </p>
          </div>
        ) : (
          <div className='space-y-2'>
            {data.members.map((member) => {
              // Use selectedMembers for display (initialized from is_assigned on load)
              // Ensure both are numbers for comparison
              const memberId = Number(member.id);
              const isSelected = selectedMembers !== null && selectedMembers.includes(memberId);
              const displayName =
                member.first_name && member.last_name
                  ? `${member.first_name} ${member.last_name}`
                  : member.username;

              return (
                <div
                  key={member.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors',
                    isSelected
                      ? 'bg-primary/5 border border-primary/20'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  )}
                  onClick={() => !isUpdating && handleMemberToggle(memberId)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleMemberToggle(memberId)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isUpdating}
                  />
                  <Avatar className='h-8 w-8 flex-shrink-0 rounded-lg'>
                    {member.avatar && (
                      <AvatarImage
                        src={member.avatar}
                        alt={displayName}
                        className='object-cover rounded-lg'
                      />
                    )}
                    <AvatarFallback className='rounded-lg'>
                      {displayName[0]?.toUpperCase() || <IconUser className='h-4 w-4' />}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='truncate text-xs font-medium'>{displayName}</p>
                      {isSelected && (
                        <IconUserCheck className='h-3 w-3 text-primary flex-shrink-0' />
                      )}
                    </div>
                    {member.is_assigned && member.assigned_by && (
                      <div className='mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground'>
                        <IconCalendar className='h-3 w-3 flex-shrink-0' />
                        <span className='flex items-center gap-1'>
                          Assigned by
                          <Avatar className='h-3.5 w-3.5 flex-shrink-0 rounded-full border border-zinc-200 dark:border-zinc-700'>
                            {member.assigned_by.avatar && (
                              <AvatarImage
                                src={member.assigned_by.avatar}
                                alt={member.assigned_by.first_name && member.assigned_by.last_name
                                  ? `${member.assigned_by.first_name} ${member.assigned_by.last_name}`
                                  : member.assigned_by.username}
                                className='object-cover rounded-full'
                              />
                            )}
                            <AvatarFallback className='rounded-full text-[8px] leading-none'>
                              {member.assigned_by.first_name && member.assigned_by.last_name
                                ? `${member.assigned_by.first_name[0]}${member.assigned_by.last_name[0]}`
                                : member.assigned_by.username[0]?.toUpperCase() || <IconUser className='h-2 w-2' />}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {member.assigned_by.first_name && member.assigned_by.last_name
                              ? `${member.assigned_by.first_name} ${member.assigned_by.last_name}`
                              : member.assigned_by.username}
                            {member.assigned_at &&
                              ` • ${getRelativeDate(member.assigned_at)}`}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Option: Assign without selecting anyone - at the end of the list */}
            <div
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors',
                selectedMembers !== null && Array.isArray(selectedMembers) && selectedMembers.length === 0
                  ? 'bg-primary/5 border border-primary/20'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              )}
              onClick={() => {
                if (!isUpdating) {
                  const isCurrentlySelected = selectedMembers !== null && Array.isArray(selectedMembers) && selectedMembers.length === 0;
                  if (isCurrentlySelected) {
                    // If already selected, deselect (set to null for assigned cards means no change)
                    // But for assigned cards, we should keep [] to show "no one assigned"
                    setSelectedMembers([]); // Keep [] for assigned cards
                  } else {
                    setSelectedMembers([]); // Select "no one"
                  }
                }
              }}
            >
              <Checkbox
                checked={selectedMembers !== null && Array.isArray(selectedMembers) && selectedMembers.length === 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedMembers([]);
                  } else {
                    // For assigned cards, unchecking means we want to assign someone
                    // But we can't set to null, so we keep [] or set to current assigned members
                    const currentAssigned = data.members
                      .filter((m) => m.is_assigned)
                      .map((m) => Number(m.id));
                    setSelectedMembers(currentAssigned.length > 0 ? currentAssigned : []);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                disabled={isUpdating}
              />
              <div className='min-w-0 flex-1'>
                <p className='text-xs font-medium'>Assign to no one</p>
                <p className='text-muted-foreground mt-0.5 text-[10px]'>
                  Card will be moved to assignments without a specific person
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

