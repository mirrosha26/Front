'use client';

import { SpotlightTour } from './spotlight-tour';

interface InvestorsStepProps {
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function InvestorsStep({ isActive, onNext, onSkip }: InvestorsStepProps) {
  return (
    <SpotlightTour
      isActive={isActive}
      targetSelector="a[href='/app/investors'], button:has-text('Investors')"
      title="Пользовательские списки инвесторов"
      description="Настройте свои пользовательские списки инвесторов. Добавляйте конкретных инвесторов в свой список для удобного использования в фильтрах или персонализации ваших email-уведомлений."
      position="right"
      onComplete={onNext}
      onSkip={onNext}
      onClose={onSkip}
      waitForClick={false}
    />
  );
}

