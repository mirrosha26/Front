import React from 'react';
import { DeletedCardsGraphQLProvider } from '@/features/deleted-cards/contexts/deleted-cards-graphql-context';
import { DeletedCardsPage } from '@/features/deleted-cards/components/deleted-cards-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hidden Cards | Leads',
  description: 'View and manage hidden cards'
};

export default function DeletedCardsPageWrapper() {
  return (
    <DeletedCardsGraphQLProvider>
      <DeletedCardsPage />
    </DeletedCardsGraphQLProvider>
  );
}
