import React from 'react';

interface AvatarSkeletonProps {
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose' | 'separate' | 'wide';
}

export const AvatarSkeleton: React.FC<AvatarSkeletonProps> = ({
  count = 2,
  size = 'md',
  className = '',
  spacing = 'normal'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  const spacingClasses = {
    tight: '-space-x-4',
    normal: '-space-x-3',
    loose: '-space-x-2',
    separate: 'space-x-1',
    wide: 'space-x-2'
  };

  const marginStyles = {
    tight: '-16px',
    normal: '-12px',
    loose: '-6px',
    separate: '0px',
    wide: '0px'
  };

  const sizeClass = sizeClasses[size];
  const spacingClass = spacingClasses[spacing];
  const marginStyle = marginStyles[spacing];

  return (
    <div className={`flex items-center justify-end pr-0.4 ${className}`}>
      <div className={`flex ${spacingClass}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${sizeClass} rounded-full bg-muted border border-muted`}
            style={{
              marginLeft: i > 0 ? marginStyle : '0'
            }}
          />
        ))}
      </div>
    </div>
  );
}; 