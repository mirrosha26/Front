import { useGroupAssignments } from '../contexts/group-assignments-context';
import { SignalCard } from '@/lib/graphql/types';

export function useGroupAssignmentsActions() {
  const {
    assignments,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    fetchAssignments,
    applyFilters,
    loadMore,
    resetFilters,
    setCurrentFilters,
    handleToggleFavorite,
    refetchAssignments
  } = useGroupAssignments();

  // Extract cards from assignments
  const cards: SignalCard[] = assignments.map((assignment) => assignment.signalCard);

  return {
    cards,
    assignments,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    currentFilters,
    fetchAssignments,
    applyFilters,
    loadMore,
    resetFilters,
    setCurrentFilters,
    handleToggleFavorite,
    refetchAssignments
  };
}

