'use client';

import { useState, useEffect } from 'react';
import { User } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { IconCamera, IconEdit, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { GroupEditDialog } from './group-edit-dialog';

interface ProfileInfoTabProps {
  user: User | null;
  userTypes: { value: string; label: string }[];
}

export function ProfileInfoTab({ user, userTypes }: ProfileInfoTabProps) {
  const { updateProfile } = useAuth();
  const [editedUser, setEditedUser] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    user_type: user?.user_type || ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [shouldDeleteAvatar, setShouldDeleteAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);

  // Update edited data when user changes
  useEffect(() => {
    if (user) {
      setEditedUser({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        user_type: user.user_type || ''
      });
      // Reset avatar-related state when user changes
      setAvatarFile(null);
      setAvatarPreview(null);
      setShouldDeleteAvatar(false);
    }
  }, [user]);

  // Get user type label by value
  const getUserTypeLabel = (value: string | undefined) => {
    if (!value) return '';
    const userType = userTypes.find((type) => type.value === value);
    return userType ? userType.label : value;
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите файл изображения');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Размер изображения не должен превышать 2MB');
      return;
    }

    // Save file
    setAvatarFile(file);
    // Reset delete flag when new file is selected
    setShouldDeleteAvatar(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle avatar deletion
  const handleDeleteAvatar = () => {
    setShouldDeleteAvatar(true);
    setAvatarFile(null);
    setAvatarPreview(null);
  };


  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);

      // Check if we need to delete avatar (send JSON request)
      if (shouldDeleteAvatar && !avatarFile) {
        // Use updateProfile with JSON object
        const success = await updateProfile({
          avatar: null,
          first_name: editedUser.first_name,
          last_name: editedUser.last_name,
          user_type: editedUser.user_type
        });

        if (success) {
          toast.success('Профиль успешно обновлен');
          setAvatarFile(null);
          setAvatarPreview(null);
          setShouldDeleteAvatar(false);
        } else {
          toast.error('Не удалось обновить профиль');
        }
        setIsSubmitting(false);
        return;
      }

      // Use FormData for file upload or regular updates
      const formData = new FormData();
      formData.append('first_name', editedUser.first_name);
      formData.append('last_name', editedUser.last_name);
      formData.append('user_type', editedUser.user_type);

      // Add avatar if changed
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // Send profile update request using auth context
      const success = await updateProfile(formData);

      if (success) {
        toast.success('Профиль успешно обновлен');
        // Reset avatar preview, file, and delete flag
        setAvatarFile(null);
        setAvatarPreview(null);
        setShouldDeleteAvatar(false);
      } else {
        toast.error('Не удалось обновить профиль');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Произошла ошибка при обновлении профиля');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className='mb-6 text-xl font-bold'>Профиль</h1>
      <Separator className='mb-6' />

      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {/* Main Information */}
        <div className='col-span-1 md:col-span-2'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* First Name */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Имя
              </label>
              <Input
                value={editedUser.first_name}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, first_name: e.target.value })
                }
                placeholder='Введите имя'
                className='w-full'
              />
            </div>

            {/* Last Name */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Фамилия
              </label>
              <Input
                value={editedUser.last_name}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, last_name: e.target.value })
                }
                placeholder='Введите фамилию'
                className='w-full'
              />
            </div>

            {/* Email */}
            <div>
              <label className='mb-1 block text-sm font-medium'>Email</label>
              <Input
                value={user?.email || ''}
                readOnly
                className='bg-muted w-full'
              />
              <p className='text-muted-foreground mt-1 text-xs'>
                Email используется для входа и не может быть изменен
              </p>
            </div>

            {/* User Type */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Тип пользователя
              </label>
              <Select
                value={editedUser.user_type}
                onValueChange={(value) =>
                  setEditedUser({ ...editedUser, user_type: value })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Выберите тип пользователя'>
                    {getUserTypeLabel(editedUser.user_type)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {userTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-muted-foreground mt-1 text-xs'>
                Тип вашего аккаунта в системе (не влияет на возможности системы).
              </p>
            </div>

            {/* Group - Read Only */}
            {user?.group && (
              <div className='md:col-span-2'>
                <label className='mb-1 block text-sm font-medium'>Группа</label>
                <div className='bg-muted flex items-center gap-3 rounded-md border p-3'>
                  {user.group.logo && (
                    <Avatar className='h-10 w-10 rounded-lg'>
                      <AvatarImage
                        src={user.group.logo}
                        alt={user.group.name}
                        className='rounded-lg'
                      />
                      <AvatarFallback className='rounded-lg bg-primary/10 text-primary/60'>
                        {user.group.name?.[0]?.toUpperCase() || 'G'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className='flex-1'>
                    <p className='font-medium'>{user.group.name}</p>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsGroupDialogOpen(true)}
                    className='flex items-center gap-2'
                  >
                    <IconEdit className='h-4 w-4' />
                    Редактировать
                  </Button>
                </div>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Группа вашей организации
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Photo */}
        <div className='col-span-1'>
          <div className='relative ml-auto w-fit'>
            <Avatar className='h-32 w-32 rounded-lg'>
              <AvatarImage
                src={
                  avatarPreview || avatarFile
                    ? avatarPreview || undefined
                    : shouldDeleteAvatar
                      ? undefined
                      : user?.avatar || undefined
                }
                alt={user?.username || 'User'}
                className='object-cover rounded-lg'
              />
              <AvatarFallback className='bg-muted text-muted-foreground rounded-lg text-3xl'>
                {user?.first_name?.[0]?.toUpperCase() || ''}
                {user?.last_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor='avatar-upload'
              className='bg-secondary absolute bottom-0 left-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg shadow-md hover:bg-secondary/80'
            >
              <IconCamera className='h-4 w-4' />
              <input
                id='avatar-upload'
                type='file'
                className='hidden'
                accept='image/*'
                onChange={handleAvatarChange}
                disabled={isSubmitting}
              />
            </label>
            {(user?.avatar || avatarPreview) && !shouldDeleteAvatar && (
              <button
                onClick={handleDeleteAvatar}
                disabled={isSubmitting}
                className='bg-secondary absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg shadow-md hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50'
                title='Удалить фото'
              >
                <IconX className='h-4 w-4' />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className='mt-8 flex justify-end'>
        <Button onClick={handleSaveChanges} disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>

      {/* Group Edit Dialog */}
      <GroupEditDialog
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
      />
    </div>
  );
}
