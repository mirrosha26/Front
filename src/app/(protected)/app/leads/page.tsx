import React from 'react';
import { SavedCardsPage } from '@/features/saved-cards/components/saved-cards-page';
import { FoldersProvider } from '@/features/folders/contexts/folders-context';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Signals',
  description: 'View and manage your signals'
};

export default function LeadsRootPage() {
  return (
    <FoldersProvider>
      <SavedCardsPage />
    </FoldersProvider>
  );
}
