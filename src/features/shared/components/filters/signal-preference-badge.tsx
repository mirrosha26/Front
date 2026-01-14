'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SignalPreferenceBadgeProps {
  isWeb2Filter: boolean;
  isWeb3Filter: boolean;
  className?: string;
  size?: 'sm' | 'default';
}

export function SignalPreferenceBadge({
  isWeb2Filter,
  isWeb3Filter,
  className,
  size = 'default'
}: SignalPreferenceBadgeProps) {
  // Don't show badge if it's "all" or neither web2 nor web3
  if (!isWeb2Filter && !isWeb3Filter) {
    return null;
  }

  const getVariantAndLabel = () => {
    if (isWeb2Filter && isWeb3Filter) {
      // Should not happen, but handle gracefully
      return {
        variant: 'outline' as const,
        label: 'Все'
      };
    }

    if (isWeb2Filter) {
      return {
        variant: 'outline' as const,
        label: 'Web2'
      };
    }

    if (isWeb3Filter) {
      return {
        variant: 'outline' as const,
        label: 'Web3'
      };
    }

    return null;
  };

  const config = getVariantAndLabel();
  if (!config) return null;

  const sizeClasses =
    size === 'sm' ? 'text-xs px-1.5 py-0.5 h-5' : 'text-xs px-2 py-1 h-6';

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-medium',
        sizeClasses,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
