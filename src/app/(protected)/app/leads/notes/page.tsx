import React from 'react';
import { NotesCardsPage } from '@/features/notes-cards/components/notes-cards-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Signals with Notes',
  description: 'View and manage signals with notes'
};

export default function NotesCardsPageWrapper() {
  return <NotesCardsPage />;
}
