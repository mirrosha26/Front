import React, { useState, useEffect } from 'react';
import { ParticipantsList } from '../cards/participants-list';
import { FundInvestorAvatars } from '../cards/fund-investor-avatars';
import { AvatarSkeleton } from './avatar-skeleton';

interface Participant {
  id: string;
  name: string;
  slug: string;
  type: string;
  about?: string;
  imageUrl?: string;
  isSaved?: boolean;
  isPrivate?: boolean;
}

interface Signal {
  id: string;
  date: string;
  description?: string;
  signalType?: {
    id: string;
    name: string;
    slug: string;
  };
  participant?: Participant;
  associatedParticipant?: Participant;
  linkedinData?: {
    id: string;
    name: string;
    classification?: string;
    path?: string;
    reasoning?: string;
    tags?: string[];
    summary?: string;
    linkedinProfileUrl?: string;
    linkedinProfileImageUrl?: string | null;
    education?: string[];
    experience?: string[];
    notableAchievements?: string;
    curated?: boolean;
    createdAt?: string;
  };
}

interface ProgressiveParticipantsProps {
  card: {
    signals?: Signal[];
    participants_list?: Array<{
      name: string;
      image: string | null;
      is_saved: boolean;
      is_private: boolean;
    }>;
    participants_has_more?: boolean;
    participants_more_count?: number;
    remainingParticipantsCount?: number;
  };
  maxVisible: number;
  loadDelay?: number;
}

export const ProgressiveParticipants: React.FC<
  ProgressiveParticipantsProps
> = ({
  card,
  maxVisible,
  loadDelay = 30 // Very short delay for immediate feel
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    // Start loading immediately but show skeleton briefly for smooth transition
    const timer = setTimeout(() => {
      setIsLoaded(true);
      // Hide skeleton after content is loaded
      setTimeout(() => setShowSkeleton(false), 50);
    }, loadDelay);

    return () => clearTimeout(timer);
  }, [loadDelay]);

  // Show skeleton loading state
  if (showSkeleton && !isLoaded) {
    return <AvatarSkeleton count={2} size='lg' />;
  }

  // Show actual content once loaded
  if (card.signals && card.signals.length > 0) {
    return (
      <FundInvestorAvatars
        signals={card.signals}
        maxVisible={maxVisible}
        remainingParticipantsCount={card.remainingParticipantsCount || 0}
      />
    );
  }

  if (card.participants_list && card.participants_list.length > 0) {
    // Преобразуем данные для ParticipantsList
    const participants = card.participants_list.map((p) => ({
      name: p.name,
      image: p.image || undefined,
      is_private: p.is_private,
      is_saved: p.is_saved
    }));

    return (
      <ParticipantsList
        participants={participants.slice(0, maxVisible)}
        hasMore={
          card.participants_has_more ||
          false ||
          card.participants_list.length > maxVisible
        }
        moreCount={Math.max(
          0,
          card.participants_list.length -
            maxVisible +
            (card.participants_more_count || 0)
        )}
      />
    );
  }

  return <span className='text-xs text-zinc-500'>No participants</span>;
};
