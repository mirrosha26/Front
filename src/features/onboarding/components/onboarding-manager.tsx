'use client';

import { useOnboarding } from '../contexts/onboarding-context';
import Confetti from 'react-confetti';
import { WelcomeStep } from './welcome-step';
import { FiltersStep } from './filters-step';
import { SettingsStep } from './settings-step';
import { NewlyAddedStep } from './newly-added-step';
import { InvestorsStep } from './investors-step';
import { SettingsModalStep } from './settings-modal-step';
import { SavedFiltersStep } from './saved-filters-step';

export function OnboardingManager() {
  const {
    isOnboardingActive,
    currentStep,
    steps,
    nextStep,
    skipOnboarding,
    showCelebration
  } = useOnboarding();

  if (!isOnboardingActive && !showCelebration) {
    return null;
  }

  const currentStepData = steps[currentStep];

  // Рендерим шаг в зависимости от его ID
  const renderStep = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <WelcomeStep
            isOpen={isOnboardingActive}
            onNext={nextStep}
            onSkip={skipOnboarding}
          />
        );
      case 'filters':
        return (
          <FiltersStep
            isActive={isOnboardingActive}
            onNext={nextStep}
            onSkip={skipOnboarding}
          />
        );
      case 'settings':
        return (
          <SettingsStep
            isActive={isOnboardingActive}
            onNext={nextStep}
            onSkip={skipOnboarding}
          />
        );
      case 'newly-added':
        return (
          <NewlyAddedStep
            isActive={isOnboardingActive}
            onNext={nextStep}
            onSkip={skipOnboarding}
          />
        );
      case 'saved-filters':
        return (
          <SavedFiltersStep
            isActive={isOnboardingActive}
            onNext={nextStep}
            onSkip={skipOnboarding}
          />
        );
      case 'investors':
        return (
          <InvestorsStep
            isActive={isOnboardingActive}
            onNext={nextStep}
            onSkip={skipOnboarding}
          />
        );
      case 'settings-modal':
        return (
          <SettingsModalStep
            isOpen={isOnboardingActive}
            onNext={nextStep}
            onSkip={skipOnboarding}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderStep()}
      {showCelebration && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          <div className="absolute inset-0 transition-opacity duration-700 opacity-100 animate-[confetti-fade_5s_forwards]">
            <Confetti
              width={typeof window !== 'undefined' ? window.innerWidth : 0}
              height={typeof window !== 'undefined' ? window.innerHeight : 0}
              numberOfPieces={350}
              recycle={false}
              gravity={0.4}
              initialVelocityX={{ min: -2, max: 2 } as any}
              initialVelocityY={{ min: 2, max: 5 } as any}
              confettiSource={{
                x: 0,
                y: 0,
                w: typeof window !== 'undefined' ? window.innerWidth : 0,
                h: 0
              }}
            />
          </div>
          <style jsx global>{`
            @keyframes confetti-fade {
              0% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>
        </div>
      )}
      {/* Progress indicator */}
      {steps.length > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex gap-2 bg-background border rounded-full px-4 py-2 shadow-lg">
            {steps.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

