import React from 'react';
import { AssignmentsPage } from '@/features/in-progress-cards/components/in-progress-cards-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CRM',
  description: 'View and manage group assignments'
};

export default function CRMPageWrapper() {
  return <AssignmentsPage />;
}


