import React, { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SmoothAvatarProps {
  src?: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  variant?: 'default' | 'private' | 'followed' | 'more' | 'favorites';
}

export const SmoothAvatar: React.FC<SmoothAvatarProps> = ({
  src,
  alt,
  className,
  fallback,
  variant = 'default'
}) => {
  const [isLoading, setIsLoading] = useState(!!src);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  return (
    <Avatar className={className} variant={variant}>
      {src && !hasError && (
        <>
          {/* Loading skeleton overlay */}
          {isLoading && (
            <div className='smooth-image-skeleton absolute inset-0 rounded-full' />
          )}

          {/* Avatar Image with smooth transition */}
          <AvatarImage
            src={src}
            alt={alt}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={cn(
              'transition-transform duration-200 ease-out',
              isLoading
                ? 'scale-95 opacity-0'
                : 'smooth-image-enter scale-100 opacity-100'
            )}
          />
        </>
      )}

      {/* Fallback content */}
      <AvatarFallback
        className={cn(
          !src || hasError
            ? 'opacity-100'
            : isLoading
              ? 'opacity-0'
              : 'opacity-100'
        )}
      >
        {fallback || alt.charAt(0).toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  );
};
