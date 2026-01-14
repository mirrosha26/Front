'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { InvestorSignalsPage } from '@/features/investors/components/public/investor-signals-page';
import { ParticipantWithChildren } from '@/lib/graphql/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollableContainer } from '@/features/shared/components/ui/scrollable-container';

// GraphQL query для получения инвестора по slug
const GET_PARTICIPANT_BY_SLUG = `
  query GetParticipantBySlug($slug: String!) {
    participant(slug: $slug) {
      id
      name
      type
      slug
      about
      isSaved
      imageUrl
    }
  }
`;

export default function InvestorSignalsPageRoute() {
  const params = useParams();
  const router = useRouter();
  const [participant, setParticipant] = useState<ParticipantWithChildren | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = params.slug as string;

  useEffect(() => {
    const fetchParticipant = async () => {
      if (!slug) return;

      setIsLoading(true);
      setError(null);

      try {
        const requestBody = {
          query: GET_PARTICIPANT_BY_SLUG,
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
          setParticipant(data.data.participant);
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

    fetchParticipant();
  }, [slug]);

  const handleBackClick = () => {
    router.push('/app/investors');
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 py-2 sm:px-6">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-2 sm:px-6">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к инвесторам
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="w-full px-4 py-2 sm:px-6">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к инвесторам
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Инвестор не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-2 sm:px-6">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleBackClick}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Назад к инвесторам
        </Button>
        <h1 className="text-2xl font-bold">
          {participant.name} - Signals
        </h1>
      </div>
      
      <ScrollableContainer height="h-[calc(100vh-120px)]">
        <InvestorSignalsPage participantId={participant.id} />
      </ScrollableContainer>
    </div>
  );
} 