'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ParticipantWithChildren, GetParticipantWithChildrenResponse, GetParticipantWithChildrenVariables } from '@/lib/graphql/types';
import { InvestorDetailCard } from '@/features/investors/components/public/investor-detail-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IconAlertCircle } from '@tabler/icons-react';

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



export default function InvestorPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [investor, setInvestor] = useState<ParticipantWithChildren | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestor = async () => {
      if (!slug) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_PARTICIPANT_WITH_CHILDREN_AND_SOURCES,
            variables: { slug },
          }),
        });

        const data = await response.json();

        if (data.errors) {
          setError(data.errors[0]?.message || 'Failed to fetch investor data');
          return;
        }

        if (data.data?.participant) {
          setInvestor(data.data.participant);
        } else {
          setError('Investor not found');
        }
      } catch (err) {
        setError('Failed to fetch investor data');
        console.error('Error fetching investor:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestor();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Investor not found</AlertTitle>
            <AlertDescription>
              The investor you're looking for doesn't exist.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <InvestorDetailCard investor={investor} />
      </div>
    </div>
  );
} 