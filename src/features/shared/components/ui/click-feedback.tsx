import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ClickFeedbackProps {
  children: React.ReactNode;
  onActivate?: () => void;
  disabled?: boolean;
  className?: string;
  feedbackDuration?: number;
  scaleEffect?: boolean;
  shadowEffect?: boolean;
  colorEffect?: boolean;
}

export const ClickFeedback: React.FC<ClickFeedbackProps> = ({
  children,
  onActivate,
  disabled = false,
  className,
  feedbackDuration = 75,
  scaleEffect = true,
  shadowEffect = false,
  colorEffect = true
}) => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      // Immediate visual feedback
      setIsActive(true);

      // Execute the action after minimal visual feedback
      setTimeout(() => {
        onActivate?.();
        setIsActive(false);
      }, feedbackDuration);
    },
    [disabled, onActivate, feedbackDuration]
  );

  return (
    <div
      className={cn(
        'cursor-pointer transition-transform duration-100 ease-out',
        scaleEffect && [
          'hover:scale-[1.001] active:scale-[0.999]',
          isActive && 'scale-[0.998]'
        ],
        shadowEffect && ['hover:shadow-sm', isActive && 'shadow-inner'],
        colorEffect && [isActive && 'bg-primary/3 dark:bg-primary/5'],
        disabled && 'pointer-events-none opacity-70',
        className
      )}
      onClick={handleClick}
    >
      {children}

      {/* Simplified ripple effect - single element, no nested animations */}
      {isActive && (
        <div className='bg-primary/8 animate-in fade-out-0 pointer-events-none absolute inset-0 rounded-lg opacity-100 duration-75' />
      )}
    </div>
  );
};
