'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconCamera, IconAlertTriangle, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GroupEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupEditDialog({
  open,
  onOpenChange
}: GroupEditDialogProps) {
  const { user, updateGroup } = useAuth();
  const [editedGroup, setEditedGroup] = useState({
    name: user?.group?.name || ''
  });
  const [groupLogoFile, setGroupLogoFile] = useState<File | null>(null);
  const [groupLogoPreview, setGroupLogoPreview] = useState<string | null>(null);
  const [shouldDeleteLogo, setShouldDeleteLogo] = useState(false);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

  // Update edited data when user or dialog opens
  useEffect(() => {
    if (user?.group && open) {
      setEditedGroup({
        name: user.group.name || ''
      });
      setGroupLogoFile(null);
      setGroupLogoPreview(null);
      setShouldDeleteLogo(false);
    }
  }, [user, open]);

  // Handle group logo file selection
  const handleGroupLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setGroupLogoFile(file);
    // Reset delete flag when new file is selected
    setShouldDeleteLogo(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle logo deletion
  const handleDeleteLogo = () => {
    setShouldDeleteLogo(true);
    setGroupLogoFile(null);
    setGroupLogoPreview(null);
  };

  // Handle group update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.group) return;

    try {
      setIsUpdatingGroup(true);

      // Check if we need to delete logo (send JSON request)
      if (shouldDeleteLogo && !groupLogoFile) {
        // Prepare JSON data
        const jsonData: { name?: string; logo: null } = { logo: null };
        
        // Add name if changed
        if (editedGroup.name && editedGroup.name !== user.group.name) {
          jsonData.name = editedGroup.name;
        }

        // Use updateGroup with JSON object
        const success = await updateGroup(jsonData);

        if (success) {
          toast.success('Группа успешно обновлена');
          setGroupLogoFile(null);
          setGroupLogoPreview(null);
          setShouldDeleteLogo(false);
          onOpenChange(false);
        } else {
          toast.error('Не удалось обновить группу');
        }
        setIsUpdatingGroup(false);
        return;
      }

      // Use FormData for file upload or regular updates
      const formData = new FormData();
      
      // Add name if changed
      if (editedGroup.name && editedGroup.name !== user.group.name) {
        formData.append('name', editedGroup.name);
      }

      // Add logo if changed
      if (groupLogoFile) {
        formData.append('logo', groupLogoFile);
      }

      // Check if there are any changes
      if (!formData.has('name') && !formData.has('logo')) {
        toast.info('Нет изменений для сохранения');
        setIsUpdatingGroup(false);
        return;
      }

      const success = await updateGroup(formData);

      if (success) {
        toast.success('Группа успешно обновлена');
        // Reset and close
        setGroupLogoFile(null);
        setGroupLogoPreview(null);
        setShouldDeleteLogo(false);
        onOpenChange(false);
      } else {
        toast.error('Не удалось обновить группу');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Произошла ошибка при обновлении группы');
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  if (!user?.group) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Редактировать группу</DialogTitle>
          <DialogDescription>
            Обновите информацию о группе вашей организации
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Warning Alert */}
          <Alert className='mb-4 border-primary/30 bg-primary/5 dark:border-primary/20 dark:bg-primary/10 text-primary'>
            <IconAlertTriangle className='h-4 w-4 text-primary' />
            <AlertTitle className='text-primary dark:text-primary'>
              Important Notice
            </AlertTitle>
            <AlertDescription className='text-primary/80 dark:text-primary/70'>
              Updating the group name or logo will change it for all users in your organization group.
            </AlertDescription>
          </Alert>

          <div className='space-y-4'>
            {/* Group Logo */}
            <div>
              <Label htmlFor='group-logo-upload'>Group Logo</Label>
              <div className='mt-2'>
                <div className='relative w-fit'>
                  <Avatar className='h-24 w-24 rounded-lg'>
                    <AvatarImage
                      src={
                        groupLogoPreview
                          ? groupLogoPreview
                          : shouldDeleteLogo || !user.group.logo
                            ? undefined
                            : user.group.logo || undefined
                      }
                      alt={editedGroup.name || 'Group'}
                      className='object-cover rounded-lg'
                    />
                    <AvatarFallback className='bg-muted text-muted-foreground rounded-lg text-3xl'>
                      {editedGroup.name?.[0]?.toUpperCase() || 'G'}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor='group-logo-upload'
                    className='bg-secondary absolute bottom-0 left-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg shadow-md hover:bg-secondary/80'
                  >
                    <IconCamera className='h-4 w-4' />
                    <input
                      id='group-logo-upload'
                      type='file'
                      className='hidden'
                      accept='image/*'
                      onChange={handleGroupLogoChange}
                      disabled={isUpdatingGroup}
                    />
                  </label>
                  {(user.group.logo || groupLogoPreview) && !shouldDeleteLogo && (
                    <button
                      onClick={handleDeleteLogo}
                      disabled={isUpdatingGroup}
                      className='bg-secondary absolute top-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg shadow-md hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50'
                      title='Удалить логотип'
                    >
                      <IconX className='h-4 w-4' />
                    </button>
                  )}
                </div>
                <p className='text-muted-foreground mt-2 text-xs'>
                  Upload a logo for your organization group. Recommended size: 256x256px. Max size: 2MB.
                </p>
              </div>
            </div>

            {/* Group Name */}
            <div>
              <Label htmlFor='group-name'>Group Name</Label>
              <Input
                id='group-name'
                value={editedGroup.name}
                onChange={(e) =>
                  setEditedGroup({ ...editedGroup, name: e.target.value })
                }
                placeholder='Enter group name'
                className='mt-2'
                disabled={isUpdatingGroup}
                required
              />
              <p className='text-muted-foreground mt-1 text-xs'>
                The name of your organization group
              </p>
            </div>
          </div>

          <DialogFooter className='mt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isUpdatingGroup}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isUpdatingGroup}>
              {isUpdatingGroup ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

