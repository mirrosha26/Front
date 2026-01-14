'use client';

import { InvestorsGraphQLProvider } from '@/features/investors/contexts/investors-graphql-context';
import { InvestorsPageGraphQL } from '@/features/investors/components/public/investors-page-graphql';

export default function InvestorsPageWrapper() {
  return (
    <InvestorsGraphQLProvider>
      <InvestorsPageGraphQL />
    </InvestorsGraphQLProvider>
  );
}
