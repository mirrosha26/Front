import React from 'react';
import { cn } from '@/lib/utils';

interface PulseAnimationProps {
  children: React.ReactNode;
  isActive: boolean;
  intensity?: 'subtle' | 'normal' | 'strong';
  duration?: 'fast' | 'normal' | 'slow';
  className?: string;
}

export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  children,
  isActive,
  intensity = 'normal',
  duration = 'normal',
  className
}) => {
  const intensityConfig = {
    subtle: 'opacity-95',
    normal: 'opacity-90',
    strong: 'opacity-80'
  };

  const durationConfig = {
    fast: 'duration-500',
    normal: 'duration-700',
    slow: 'duration-1000'
  };

  return (
    <div
      className={cn(
        'transition-all ease-in-out',
        isActive && [
          'animate-pulse',
          intensityConfig[intensity],
          durationConfig[duration]
        ],
        className
      )}
    >
      {children}
    </div>
  );
};
