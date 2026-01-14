import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SmoothImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  containerClassName?: string;
}

export const SmoothImage: React.FC<SmoothImageProps> = ({
  src,
  alt,
  className,
  fallback,
  containerClassName
}) => {
  const [isLoading, setIsLoading] = useState(true);
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
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className={cn('smooth-image-skeleton absolute inset-0', className)}
        />
      )}

      {/* Image */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={cn(
            'transition-transform duration-200 ease-out',
            isLoading
              ? 'scale-95 opacity-0'
              : 'smooth-image-enter scale-100 opacity-100',
            className
          )}
        />
      )}

      {/* Fallback content when image fails to load */}
      {hasError && fallback && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            className
          )}
        >
          {fallback}
        </div>
      )}
    </div>
  );
};
