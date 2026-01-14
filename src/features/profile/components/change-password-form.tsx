// src/features/profile/components/change-password-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';

interface ChangePasswordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordForm({
  open,
  onOpenChange
}: ChangePasswordFormProps) {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { changePassword } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.current_password) {
      newErrors.current_password = 'Введите текущий пароль';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'Введите новый пароль';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Пароль должен содержать не менее 8 символов';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Подтвердите новый пароль';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await changePassword(
        formData.current_password,
        formData.new_password
      );

      if (result.success) {
        toast.success('Пароль успешно изменен');
        // Reset form and close dialog
        setFormData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        onOpenChange(false);
      } else {
        toast.error(result.message || 'Не удалось изменить пароль');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Произошла ошибка при изменении пароля');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Изменить пароль</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-2 pt-4'>
          <div className='space-y-2'>
            <Label htmlFor='current_password'>Текущий пароль</Label>
            <Input
              id='current_password'
              name='current_password'
              type='password'
              value={formData.current_password}
              onChange={handleChange}
              className={errors.current_password ? 'border-red-500' : ''}
            />
            {errors.current_password && (
              <p className='text-xs text-red-500'>{errors.current_password}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='new_password'>Новый пароль</Label>
            <Input
              id='new_password'
              name='new_password'
              type='password'
              value={formData.new_password}
              onChange={handleChange}
              className={errors.new_password ? 'border-red-500' : ''}
            />
            {errors.new_password ? (
              <p className='text-xs text-red-500'>{errors.new_password}</p>
            ) : (
              <p className='text-muted-foreground text-xs'>
                Пароль должен содержать не менее 8 символов
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirm_password'>Подтвердите пароль</Label>
            <Input
              id='confirm_password'
              name='confirm_password'
              type='password'
              value={formData.confirm_password}
              onChange={handleChange}
              className={errors.confirm_password ? 'border-red-500' : ''}
            />
            {errors.confirm_password && (
              <p className='text-xs text-red-500'>{errors.confirm_password}</p>
            )}
          </div>

          <DialogFooter className='pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
