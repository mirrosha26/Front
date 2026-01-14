'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SettingsModalStepProps {
  isOpen: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function SettingsModalStep({ isOpen, onNext, onSkip }: SettingsModalStepProps) {
  const router = useRouter();
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  // Нулевой аккаунт: сразу выставляем дефолты, без запросов
  useEffect(() => {
    if (!isOpen) return;
    setDigestEnabled(false);
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Сохраняем digest settings
      await fetch('/api/user/digest-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: digestEnabled })
      });

      toast.success('Настройки сохранены');
      onNext();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push('/app/profile');
    onSkip();
  };

  return (
    <>
      {/* Затемнённый фон */}
      <div className="fixed inset-0 z-30 bg-black/60" />
      
      {/* Центральная модалка */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-popover border border-border rounded-lg shadow-xl p-6 max-w-[480px] w-full pointer-events-auto">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                  <Settings className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary/20 animate-pulse" />
              </div>
            </div>
            <h2 className="text-center text-2xl font-bold">
              Configure Your Profile
            </h2>
            <p className="text-center text-sm mt-3 text-muted-foreground">
              Configure your digest preferences. You can always change these settings in your profile
            </p>
          </div>

          <div className="mt-6 space-y-4 px-2">
            {/* Digest Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <Label className="text-sm font-semibold">Daily Digest</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Receive daily email updates with new content
                  </p>
                </div>
                <Switch
                  checked={digestEnabled}
                  onCheckedChange={setDigestEnabled}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={saving}
            >
              Configure Later
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

