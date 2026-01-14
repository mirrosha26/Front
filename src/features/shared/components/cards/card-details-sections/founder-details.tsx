import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getRelativeDate } from '@/features/shared/utils/formatting';
import { cn } from '@/lib/utils';

interface FounderDetailsTabProps {
  detailedCard?: any;
  cardPreview?: any;
  isLoading?: boolean;
}

export const FounderDetailsTab: React.FC<FounderDetailsTabProps> = ({
  detailedCard,
  cardPreview,
  isLoading = false
}) => {
  // Get signals from detailedCard or cardPreview
  const signals = detailedCard?.signals || cardPreview?.signals || [];

  // Filter for founder signals
  const founderSignals = signals.filter(
    (signal: any) => signal.signalType?.slug === 'founder' && signal.founder
  );

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='animate-pulse'>
          <div className='bg-muted mb-2 h-4 w-1/4 rounded'></div>
          <div className='bg-muted h-3 w-1/2 rounded'></div>
        </div>
        <div className='animate-pulse'>
          <div className='bg-muted h-32 rounded'></div>
        </div>
      </div>
    );
  }

  if (founderSignals.length === 0) {
    return (
      <div className='py-8 text-center'>
        <div className='text-muted-foreground text-sm'>
          No founder information available
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='mb-4'>
        <h3 className='text-lg font-semibold'>Сигнал основателя</h3>
        <p className='text-muted-foreground text-sm'>
          Click on the founder to view their full profile
        </p>
      </div>

      {founderSignals.map((signal: any, index: number) => {
        const { founder, sourceSignalCard, date, description } = signal;

        // Get founder description from sourceSignalCard or nested signals
        const founderDescription =
          sourceSignalCard?.description ||
          signal.signals?.[0]?.sourceSignalCard?.description ||
          null;

        return (
          <Card
            key={`founder-${founder.id || founder.slug || index}-${index}`}
            className='cursor-pointer overflow-hidden transition-all hover:border-green-500 hover:shadow-md dark:hover:border-green-600'
            onClick={() => {
              if (founder.slug) {
                window.open(`/public/${founder.slug}`, '_blank');
              }
            }}
          >
            <CardHeader className='pb-3'>
              <div className='flex items-start gap-3'>
                <Avatar className='h-12 w-12 ring-2 ring-green-500/20'>
                  <AvatarImage src={founder.imageUrl} alt={founder.name} />
                  <AvatarFallback className='bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'>
                    {founder.name?.[0] || 'F'}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <CardTitle className='text-lg hover:text-green-600 dark:hover:text-green-400'>
                    {founder.name}
                  </CardTitle>
                  <div className='mt-1 flex items-center gap-2'>
                    <Badge
                      variant='secondary'
                      className='border-green-500/30 bg-green-50 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    >
                      Founder Signal
                    </Badge>
                    <span className='text-muted-foreground text-xs'>
                      {getRelativeDate(date)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className='pt-0'>
              {/* Show signal description (e.g., "Founded by Weber Wong") */}
              {description && (
                <div className='mb-4'>
                  <p className='text-muted-foreground text-sm'>{description}</p>
                </div>
              )}

              {/* Show founder's full description from their signal card */}
              {founderDescription && (
                <div>
                  <h4 className='mb-2 text-sm font-medium'>О себе</h4>
                  <p className='text-muted-foreground text-sm'>
                    {founderDescription}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
