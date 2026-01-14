'use client';

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface WelcomeStepProps {
  isOpen: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function WelcomeStep({ isOpen, onNext, onSkip }: WelcomeStepProps) {
  return (
    <>
      {/* Затемнённый фон */}
      <div className="fixed inset-0 z-30 bg-black/60" />
      
      {/* Центральная модалка */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-popover border border-border rounded-lg shadow-xl p-6 max-w-[420px] w-full pointer-events-auto">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary/20 animate-pulse" />
              </div>
            </div>
            <p className="text-center text-sm mt-1 text-muted-foreground">
              Let’s take a quick onboarding tour to help you get started.
            </p>
          </div>

          <div className="mt-6 space-y-2 px-2">
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-sm shrink-0">
                1
              </div>
              <p className="text-xs text-muted-foreground">Learn how to manage your feed</p>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-sm shrink-0">
                2
              </div>
              <p className="text-xs text-muted-foreground">Learn how to create custom investor lists</p>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-sm shrink-0">
                3
              </div>
              <p className="text-xs text-muted-foreground">Configure notifications</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1"
            >
              Skip Tour
            </Button>
            <Button
              onClick={onNext}
              className="flex-1"
            >
              Start Tour
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

