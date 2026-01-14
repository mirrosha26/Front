'use client';

import { SpotlightTour } from './spotlight-tour';

interface NewlyAddedStepProps {
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function NewlyAddedStep({ isActive, onNext, onSkip }: NewlyAddedStepProps) {
  return (
    <SpotlightTour
      isActive={isActive}
      targetSelector="button:has-text('Недавно добавленные')"
      title="Недавно добавленные"
      description="Используйте этот переключатель, чтобы просматривать только новые сигналы, добавленные за последнюю неделю."
      position="left"
      onComplete={onNext}
      onSkip={onNext}
      onClose={onSkip}
      waitForClick={false}
    />
  );
}

