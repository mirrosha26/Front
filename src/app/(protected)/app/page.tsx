import React from 'react';
import { AllSignalsGraphQLPage } from '@/features/all-signals/components/all-signals-graphql-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Signals | Feed',
  description: 'View and manage all signals'
};

export default function AllSignalsPageWrapper() {
  return <AllSignalsGraphQLPage />;
}
