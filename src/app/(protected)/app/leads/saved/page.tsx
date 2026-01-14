import React from 'react';
import { SavedCardsPage } from '@/features/saved-cards/components/saved-cards-page';
import { FoldersProvider } from '@/features/folders/contexts/folders-context';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saved Signals',
  description: 'View and manage your saved signals'
};

export default function SavedCardsPageWrapper() {
  return (
    <FoldersProvider>
      <SavedCardsPage />
    </FoldersProvider>
  );
}
