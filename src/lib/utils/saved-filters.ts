import { SavedFilterInput } from '@/lib/graphql/types';

// Helper function to clean SavedFilterInput by removing undefined/null values
export function cleanSavedFilterInput(input: SavedFilterInput): SavedFilterInput {
  const cleaned: Partial<SavedFilterInput> = {};
  
  // Only include defined values
  if (input.name !== undefined) cleaned.name = input.name;
  if (input.description !== undefined && input.description !== null && input.description.trim() !== '') {
    cleaned.description = input.description;
  }
  if (input.isDefault !== undefined) cleaned.isDefault = input.isDefault;
  
  // Smart filter mode - participantFilter
  if (input.participantFilter) {
    const { mode, participantIds, participantTypes } = input.participantFilter;
    if (mode && (participantIds?.length || participantTypes?.length)) {
      cleaned.participantFilter = {
        mode,
        ...(participantIds?.length && { participantIds }),
        ...(participantTypes?.length && { participantTypes })
      };
    }
  }
  
  // Arrays - only include if they have items
  if (input.categories && input.categories.length > 0) cleaned.categories = input.categories;
  if (input.participants && input.participants.length > 0) cleaned.participants = input.participants;
  if (input.stages && input.stages.length > 0) cleaned.stages = input.stages;
  if (input.roundStatuses && input.roundStatuses.length > 0) cleaned.roundStatuses = input.roundStatuses;
  
  // Optional fields - only include if they have meaningful values
  if (input.search !== undefined && input.search !== null && input.search.trim() !== '') {
    cleaned.search = input.search;
  }
  if (input.featured !== undefined && input.featured !== null) cleaned.featured = input.featured;
  if (input.isOpen !== undefined && input.isOpen !== null) cleaned.isOpen = input.isOpen;
  if (input.new !== undefined && input.new !== null) cleaned.new = input.new;
  if (input.trending !== undefined && input.trending !== null) cleaned.trending = input.trending;
  if (input.hideLiked !== undefined && input.hideLiked !== null) cleaned.hideLiked = input.hideLiked;
  if (input.startDate !== undefined && input.startDate !== null && input.startDate.trim() !== '') {
    cleaned.startDate = input.startDate;
  }
  if (input.endDate !== undefined && input.endDate !== null && input.endDate.trim() !== '') {
    cleaned.endDate = input.endDate;
  }
  if (input.minSignals !== undefined && input.minSignals !== null) cleaned.minSignals = input.minSignals;
  if (input.maxSignals !== undefined && input.maxSignals !== null) cleaned.maxSignals = input.maxSignals;

  return cleaned as SavedFilterInput;
} 