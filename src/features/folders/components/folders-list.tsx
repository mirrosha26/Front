'use client';

import React, { useState, useMemo } from 'react';
import { useFolders } from '../contexts/folders-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  IconFolder,
  IconFolderPlus,
  IconLoader2,
  IconHeart,
  IconSearch,
  IconEdit,
  IconTrash,
  IconDownload,
  IconStar
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCardOperations } from '@/features/shared/contexts/card-operations-context';

interface FoldersListProps {
  onFolderSelect?: (folderKey: string | null) => void;
  selectedFolderKey?: string | null;
}

export function FoldersList({
  onFolderSelect,
  selectedFolderKey = 'default'
}: FoldersListProps) {
  const {
    folders,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    exportFolder,
    toggleLike,
    setSelectedFolderKey
  } = useFolders();

  const { removeFromFolder } = useCardOperations();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [editFolderId, setEditFolderId] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderDescription, setEditFolderDescription] = useState('');
  const [deleteFolderId, setDeleteFolderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter folders by search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) {
      return folders.filter((folder) => !folder.is_default);
    }

    const query = searchQuery.toLowerCase();
    return folders
      .filter((folder) => !folder.is_default)
      .filter(
        (folder) =>
          folder.name.toLowerCase().includes(query) ||
          (folder.description &&
            folder.description.toLowerCase().includes(query))
      );
  }, [folders, searchQuery]);

  // Text truncation function
  const truncateText = (text: string, maxLength: number = 10) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  // Folder selection handler
  const handleFolderSelect = (folderKey: string) => {
    // Save selected folder in localStorage and global variable
    localStorage.setItem('currentFolderKey', folderKey);
    (window as any).currentFolderKey = folderKey;

    console.log(`[FoldersList] Selected folder: ${folderKey}`);

    // Update selected folder in context
    setSelectedFolderKey(folderKey);

    // Call callback for folder selection
    if (onFolderSelect) {
      onFolderSelect(folderKey);
    }
  };

  // New folder creation handler
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreating(true);
    try {
      await createFolder(newFolderName, newFolderDescription);
      setNewFolderName('');
      setNewFolderDescription('');
      setIsCreateDialogOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  // Enter key handler in create dialog
  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newFolderName.trim() && !isCreating) {
      e.preventDefault();
      handleCreateFolder();
    }
  };

  // Folder edit handler
  const handleEditFolder = async () => {
    if (!editFolderName.trim() || !editFolderId) return;

    setIsUpdating(true);
    try {
      await updateFolder(editFolderId, editFolderName, editFolderDescription);
      setEditFolderName('');
      setEditFolderId(null);
      setIsEditDialogOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  // Enter key handler in edit dialog
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editFolderName.trim() && !isUpdating) {
      e.preventDefault();
      handleEditFolder();
    }
  };

  // New function for removing card from folder with UI update
  const handleRemoveCardFromFolder = async (
    cardId: number,
    folderId: number
  ) => {
    const success = await removeFromFolder(cardId, folderId);
    if (success) {
      // Dispatch event to update card list
      window.dispatchEvent(
        new CustomEvent('card-removed-from-folder', {
          detail: { cardId, folderId }
        })
      );
    }
  };

  // Folder deletion handler with card list update
  const handleDeleteFolder = async () => {
    if (!deleteFolderId) return;

    setIsDeleting(true);
    try {
      // Get card IDs in folder before deletion
      const folderToDelete = folders.find((f) => f.id === deleteFolderId);

      await deleteFolder(deleteFolderId);
      setDeleteFolderId(null);
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Folder export handler
  const handleExportFolder = async (folderId: number | null) => {
    setIsExporting(true);
    try {
      if (folderId === null) {
        // Export favorite cards
        await exportFolder('default');
      } else {
        // Export specific folder
        await exportFolder(String(folderId));
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (folder: { id: number; name: string }) => {
    setEditFolderId(folder.id);
    setEditFolderName(folder.name);
    setEditFolderDescription(folder.description || '');
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (folderId: number) => {
    setDeleteFolderId(folderId);
    setIsDeleteDialogOpen(true);
  };

  // Favorites export to CSV handler
  const handleExportFavorites = async () => {
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = `/api/cards/favorites/export`;
      link.download = `favorites-export.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Экспорт избранного начат');
    } catch (error) {
      console.error('Error exporting favorites:', error);
      toast.error('Не удалось экспортировать избранное');
    }
  };

  // Search query change handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Card like toggle handler in folder
  const handleToggleCardLike = async (cardId: number, isLiked: boolean) => {
    // Get current folder
    const isDefaultFolder = selectedFolderKey === 'default';

    // If this is "Favorites" folder and card has like (remove like)
    if (isDefaultFolder && isLiked) {
      // Remove card from list (it will disappear from favorites)
      window.dispatchEvent(
        new CustomEvent('card-removed-from-favorites', {
          detail: { cardId }
        })
      );
    }

    // Call standard like toggle method
    const success = await toggleLike(cardId, isLiked);

    if (success) {
      // Dispatch event to update UI
      window.dispatchEvent(
        new CustomEvent('card-like-toggled', {
          detail: { cardId, isLiked: !isLiked }
        })
      );
    }

    return success;
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-medium'>Папки</h2>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <IconFolderPlus className='mr-1 h-4 w-4' />
          Создать
        </Button>
      </div>

      {/* Folder search field */}
      <div className='relative'>
        <IconSearch className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
        <Input
          placeholder="Поиск папок..."
          value={searchQuery}
          onChange={handleSearchChange}
          className='pl-8'
        />
      </div>

      <div className='space-y-1'>
        {/* Избранные карточки (default) */}
        <div className='relative flex items-center'>
          <Button
            variant={selectedFolderKey === 'default' ? 'secondary' : 'ghost'}
            size='sm'
            className='w-full justify-start pr-16'
            onClick={() => handleFolderSelect('default')}
          >
            <IconHeart className='mr-2 h-4 w-4' fill='currentColor' />
            Избранное
          </Button>

          {/* Кнопки действий для избранного, видимые только когда папка выбрана */}
          {selectedFolderKey === 'default' && (
            <div className='absolute right-1 flex space-x-1'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportFolder(null);
                      }}
                      disabled={isExporting}
                    >
                      <IconDownload className='h-3 w-3' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent variant='default'>
                    <p>Экспортировать в CSV</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Список папок */}
        {isLoading ? (
          <div className='flex justify-center py-4'>
            <IconLoader2 className='text-muted-foreground h-5 w-5 animate-spin' />
          </div>
        ) : (
          <div className='space-y-1'>
            {filteredFolders.length > 0 ? (
              filteredFolders.map((folder) => (
                <div key={folder.id} className='relative flex items-center'>
                  <Button
                    variant={
                      selectedFolderKey === String(folder.id)
                        ? 'secondary'
                        : 'ghost'
                    }
                    size='sm'
                    className='w-full justify-start pr-16'
                    onClick={() => handleFolderSelect(String(folder.id))}
                  >
                    <IconFolder className='mr-2 h-4 w-4 flex-shrink-0' />
                    <span className='truncate'>{folder.name}</span>
                    {folder.cards_count > 0 &&
                      selectedFolderKey !== String(folder.id) && (
                        <span className='text-muted-foreground ml-auto text-xs'>
                          {folder.cards_count}
                        </span>
                      )}
                  </Button>

                  {/* Кнопки действий, видимые только когда папка выбрана */}
                  {selectedFolderKey === String(folder.id) && (
                    <div className='absolute right-1 flex space-x-1'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-6 w-6'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportFolder(folder.id);
                              }}
                              disabled={isExporting}
                            >
                              <IconDownload className='h-3 w-3' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent variant='default'>
                            <p>Экспортировать в CSV</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-6 w-6'
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(folder);
                              }}
                            >
                              <IconEdit className='h-3 w-3' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent variant='default'>
                            <p>Редактировать</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-6 w-6'
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(folder.id);
                              }}
                            >
                              <IconTrash className='h-3 w-3' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent variant='default'>
                            <p>Удалить</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className='text-muted-foreground py-2 text-center text-sm'>
                {searchQuery ? "Папки не найдены" : ""}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Dialogs remain unchanged */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новую папку</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <label htmlFor='folder-name' className='text-sm font-medium'>
                Название папки
              </label>
              <Input
                id='folder-name'
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder='Введите название папки'
                onKeyDown={handleCreateKeyDown}
              />
            </div>
            <div className='space-y-2'>
              <label
                htmlFor='folder-description'
                className='text-sm font-medium'
              >
                Описание (необязательно)
              </label>
              <Input
                id='folder-description'
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder='Введите описание папки'
                onKeyDown={handleCreateKeyDown}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isCreating}
            >
              {isCreating && (
                <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать папку</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <label htmlFor='edit-folder-name' className='text-sm font-medium'>
                Название папки
              </label>
              <Input
                id='edit-folder-name'
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder='Введите название папки'
                onKeyDown={handleEditKeyDown}
              />
            </div>
            <div className='space-y-2'>
              <label
                htmlFor='edit-folder-description'
                className='text-sm font-medium'
              >
                Описание (необязательно)
              </label>
              <Input
                id='edit-folder-description'
                value={editFolderDescription}
                onChange={(e) => setEditFolderDescription(e.target.value)}
                placeholder='Введите описание папки'
                onKeyDown={handleEditKeyDown}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Отмена
            </Button>
            <Button
              onClick={handleEditFolder}
              disabled={!editFolderName.trim() || isUpdating}
            >
              {isUpdating && (
                <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить папку</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <p>
              Вы уверены, что хотите удалить эту папку? Это действие нельзя отменить.
            </p>
            <p className='text-muted-foreground mt-2 text-sm'>
              Карточки из этой папки не будут удалены, они останутся доступными в разделе &quot;Избранное&quot;.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteFolder}
              disabled={isDeleting}
            >
              {isDeleting && (
                <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
