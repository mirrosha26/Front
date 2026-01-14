'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarSkeleton } from '@/features/shared/components/ui/avatar-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IconAlertCircle } from '@tabler/icons-react';
import { PrivateInvestorRequest, PrivateInvestor } from '../../types';
import { RequestCard } from './request-card';
import { InvestorCard } from './investor-card';
import { memo } from 'react';

interface PrivateInvestorsListProps {
  pendingRequests: PrivateInvestorRequest[];
  processingRequests: PrivateInvestorRequest[];
  investors: PrivateInvestor[];
  isLoading: boolean;
  onDeleteRequest: (id: number) => Promise<boolean>;
}

// Skeleton for request card
const RequestCardSkeleton = () => {
  return (
    <div className='bg-card border-border relative mb-2 overflow-hidden rounded-lg border p-4'>
      <div className='flex w-full items-center'>
        <AvatarSkeleton count={1} size='md' />
        <div className='flex-1'>
          <div className='flex items-center'>
            <Skeleton className='mb-2 h-5 w-32' />
            <Skeleton className='ml-2 h-5 w-16' />
          </div>
          <Skeleton className='h-4 w-48' />
        </div>
        <Skeleton className='h-9 w-24' />
      </div>
    </div>
  );
};

export const PrivateInvestorsList = ({
  pendingRequests,
  processingRequests,
  investors,
  isLoading,
  onDeleteRequest
}: PrivateInvestorsListProps) => {
  return (
    <>
      <TabsContent value='investors'>
        {isLoading ? (
          // Show skeletons while loading
          Array.from({ length: 3 }).map((_, index) => (
            <RequestCardSkeleton key={index} />
          ))
        ) : investors.length > 0 ? (
          investors.map((investor) => (
            <InvestorCard key={investor.id} investor={investor} />
          ))
        ) : (
          <Alert>
            <IconAlertCircle className='h-4 w-4' />
            <AlertTitle>No Favorite Investors</AlertTitle>
            <AlertDescription>
              Add your favorite investors at the <a href='/app/investors' className='underline text-primary hover:text-primary/80'>Investors tab</a>.
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>

      <TabsContent value='processing'>
        {isLoading ? (
          // Show skeletons while loading
          Array.from({ length: 2 }).map((_, index) => (
            <RequestCardSkeleton key={index} />
          ))
        ) : processingRequests.length > 0 ? (
          processingRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              isProcessing={true}
              onDelete={onDeleteRequest}
            />
          ))
        ) : (
          <Alert>
            <IconAlertCircle className='h-4 w-4' />
            <AlertTitle>No Requests in Processing</AlertTitle>
            <AlertDescription>
              You don&apos;t have any private investor requests that are being
              processed.
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>

      <TabsContent value='pending'>
        {isLoading ? (
          // Show skeletons while loading
          Array.from({ length: 3 }).map((_, index) => (
            <RequestCardSkeleton key={index} />
          ))
        ) : pendingRequests.length > 0 ? (
          pendingRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              isProcessing={false}
              onDelete={onDeleteRequest}
            />
          ))
        ) : (
          <Alert>
            <IconAlertCircle className='h-4 w-4' />
            <AlertTitle>No Pending Requests</AlertTitle>
            <AlertDescription>
              You don&apos;t have any pending private investor requests.
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>
    </>
  );
};
