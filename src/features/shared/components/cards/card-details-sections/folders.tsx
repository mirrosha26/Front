import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  IconLoader2,
  IconFolder,
  IconDeviceFloppy,
  IconHeart,
  IconThumbUp
} from '@tabler/icons-react';
import { useCardOperations } from '../../../contexts/card-operations-context';
import { Folder } from '../../../types/folders';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFolders } from '@/features/folders/contexts/folders-context';

interface CardFolderSelectorProps {
  cardId: number;
  folders: Folder[];
  onFoldersUpdated?: (updatedFolders: Folder[]) => void;
  currentFolderId?: string | null;
}

export const CardFolderSelector: React.FC<CardFolderSelectorProps> = ({
  cardId,
  folders,
  onFoldersUpdated,
  currentFolderId = null
}) => {
  const { addToFolder, removeFromFolder, updateCardFolders, isProcessing } =
    useCardOperations();

  // Safe use of useFolders hook
  let folderContext;
  try {
    folderContext = useFolders();
  } catch (error) {
    // If context is not available, use default value
    folderContext = { selectedFolderKey: null };
  }

  const { selectedFolderKey } = folderContext;

  const [localFolders, setLocalFolders] = useState<Folder[]>(folders);
  const [folderUpdating, setFolderUpdating] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{
    include: number[];
    exclude: number[];
  }>({ include: [], exclude: [] });
  const [isSaving, setIsSaving] = useState(false);

  // Find default folder
  const defaultFolder = localFolders.find((folder) => folder.is_default);
  // Find favorites folder
  const favoriteFolder = localFolders.find(
    (folder) => folder.name.toLowerCase() === 'favorites'
  );

  // Update local folders when input data changes
  // But preserve pending changes and local state if user is actively editing
  useEffect(() => {
    // Only update if there are no pending changes (user hasn't made edits)
    // This prevents resetting user's edits when folders prop updates from parent
    const hasPendingChanges = pendingChanges.include.length > 0 || pendingChanges.exclude.length > 0;
    
    if (!hasPendingChanges) {
      // Check if folders actually changed (not just a reference update)
      // Compare by id and has_card to detect real changes
      const currentState = localFolders.map(f => ({ id: f.id, has_card: f.has_card })).sort((a, b) => a.id - b.id);
      const newState = folders.map(f => ({ id: f.id, has_card: f.has_card })).sort((a, b) => a.id - b.id);
      const foldersChanged = JSON.stringify(currentState) !== JSON.stringify(newState);
      
      if (foldersChanged) {
        setLocalFolders(folders);
      }
    } else {
      // If there are pending changes, merge new folder data with local changes
      // This preserves user's edits while updating folder list structure if needed
      setLocalFolders((prevLocalFolders) => {
        // Create a map of current local folders by id
        const localFoldersMap = new Map(prevLocalFolders.map(f => [f.id, f]));
        
        // Update with new folders, preserving local has_card state if folder exists locally
        const mergedFolders = folders.map((folder) => {
          const localFolder = localFoldersMap.get(folder.id);
          if (localFolder) {
            // Preserve local has_card state (user's edits)
            return { ...folder, has_card: localFolder.has_card };
          }
          // New folder, use prop value
          return folder;
        });
        
        // Add any local folders that aren't in new folders (shouldn't happen, but safety check)
        const newFolderIds = new Set(folders.map(f => f.id));
        const missingFolders = prevLocalFolders.filter(f => !newFolderIds.has(f.id));
        
        return [...mergedFolders, ...missingFolders];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders]);

  // Folder status change handler
  const handleFolderToggle = (folder: Folder) => {
    if (!cardId) return;

    console.log(
      `[FolderSelector] Toggling folder ${folder.name} (id: ${folder.id}, key: ${folder.key || folder.id})`
    );

    // Update local folder state
    const updatedFolders = localFolders.map((f) =>
      f.id === folder.id ? { ...f, has_card: !folder.has_card } : f
    );
    setLocalFolders(updatedFolders);

    // Update pending changes list
    setPendingChanges((prev) => {
      const newChanges = { ...prev };

      if (!folder.has_card) {
        // If folder didn't contain card, add to include list
        newChanges.include = [
          ...prev.include.filter((id) => id !== folder.id),
          folder.id
        ];
        // And remove from exclude list if it was there
        newChanges.exclude = prev.exclude.filter((id) => id !== folder.id);
      } else {
        // If folder contained card, add to exclude list
        newChanges.exclude = [
          ...prev.exclude.filter((id) => id !== folder.id),
          folder.id
        ];
        // And remove from include list if it was there
        newChanges.include = prev.include.filter((id) => id !== folder.id);
      }

      return newChanges;
    });
  };

  // Save changes
  const saveChanges = async () => {
    if (!cardId) return;

    setIsSaving(true);
    try {
      // Get current folder from context
      const currentFolderKey = selectedFolderKey;
      const isDefaultFolder = currentFolderKey === 'default';

      // Log detailed information before saving
      console.log('=== SAVE INFORMATION ===');
      console.log(`[FolderSelector] Card ID: ${cardId}`);
      console.log(
        `[FolderSelector] Current folder from context: ${currentFolderKey}`
      );
      console.log(`[FolderSelector] Is default folder: ${isDefaultFolder}`);
      console.log(
        `[FolderSelector] Folders to include:`,
        pendingChanges.include
      );
      console.log(
        `[FolderSelector] Folders to exclude:`,
        pendingChanges.exclude
      );
      console.log('=== END OF SAVE INFORMATION ===');

      const success = await updateCardFolders(
        cardId,
        pendingChanges.include,
        pendingChanges.exclude
      );

      if (success) {
        toast.success('Папки успешно обновлены');

        // If current folder is default, check if the default folder itself is being removed
        if (isDefaultFolder) {
          const isDefaultRemoved = defaultFolder && pendingChanges.exclude.includes(defaultFolder.id);
          
          if (isDefaultRemoved) {
            console.log(
              `[FolderSelector] Default folder removed from card, generating event`
            );

            window.dispatchEvent(
              new CustomEvent('card-removed-from-folder', {
                detail: {
                  cardId,
                  folderId: 'default',
                  folderKey: 'default'
                }
              })
            );
          }
        } else {
          // For other folders check if current folder is being excluded
          const isCurrentFolderExcluded = pendingChanges.exclude.some(
            (folderId) => {
              const folder = localFolders.find((f) => f.id === folderId);
              return (
                folder &&
                (folder.key === currentFolderKey ||
                  folder.id.toString() === currentFolderKey)
              );
            }
          );

          console.log(
            `[FolderSelector] Current folder is being excluded: ${isCurrentFolderExcluded}`
          );

          // If current folder is being excluded, generate event
          if (isCurrentFolderExcluded) {
            // Find excluded folder that matches current
            const excludedFolder = localFolders.find(
              (folder) =>
                pendingChanges.exclude.includes(folder.id) &&
                (folder.key === currentFolderKey ||
                  folder.id.toString() === currentFolderKey)
            );

            if (excludedFolder) {
              console.log(
                `[FolderSelector] Generating card-removed-from-folder event for card ${cardId} from folder ${excludedFolder.key || excludedFolder.id}`
              );

              window.dispatchEvent(
                new CustomEvent('card-removed-from-folder', {
                  detail: {
                    cardId,
                    folderId: excludedFolder.id,
                    folderKey:
                      excludedFolder.key || excludedFolder.id.toString()
                  }
                })
              );
            }
          }
        }

        // Calculate final folder state after applying pending changes
        // Do this BEFORE resetting pendingChanges to use the correct state
        const finalFolders = localFolders.map((folder) => {
          if (pendingChanges.include.includes(folder.id)) {
            return { ...folder, has_card: true };
          }
          if (pendingChanges.exclude.includes(folder.id)) {
            return { ...folder, has_card: false };
          }
          return folder;
        });

        // Update local folder state with final state
        setLocalFolders(finalFolders);

        // Reset pending changes AFTER calculating final state
        // This prevents useEffect from interfering with the update
        setPendingChanges({ include: [], exclude: [] });

        // Call callback to update folders in parent component
        // Use the finalFolders we just calculated (not localFolders which may be stale)
        if (onFoldersUpdated) {
          onFoldersUpdated(finalFolders);
        }
      } else {
        toast.error('Не удалось обновить папки');
      }
    } catch (error) {
      console.error('Error updating folders:', error);
      toast.error('Произошла ошибка при обновлении папок');
    } finally {
      setIsSaving(false);
    }
  };
  const hasChanges =
    pendingChanges.include.length > 0 || pendingChanges.exclude.length > 0;

  return (
    <div className='w-full'>
      <div className='space-y-1.5 pb-2'>
        {localFolders.length > 0 ? (
          localFolders.map((folder) => (
            <div
              key={folder.id}
              className={`flex items-center gap-2 rounded-md p-2 transition-all ${
                folder.has_card
                  ? 'bg-zinc-200/70 dark:bg-zinc-700/70'
                  : 'bg-zinc-100 dark:bg-zinc-800'
              } hover:bg-zinc-200 dark:hover:bg-zinc-700`}
            >
              <Checkbox
                id={`folder-${folder.id}`}
                checked={folder.has_card}
                onCheckedChange={() => handleFolderToggle(folder)}
                disabled={folderUpdating === folder.id || isSaving}
                className='h-3.5 w-3.5 flex-shrink-0 rounded-sm'
              />
              <label
                htmlFor={`folder-${folder.id}`}
                className={`flex flex-1 cursor-pointer items-center gap-1.5 truncate text-xs ${
                  folder.is_default
                    ? 'font-medium'
                    : folder.name.toLowerCase() === 'favorites'
                      ? 'font-medium text-rose-600 dark:text-rose-400'
                      : ''
                }`}
              >
                {folder.name.toLowerCase() === 'favorites' ? (
                  <IconHeart
                    className={`h-3.5 w-3.5 flex-shrink-0 ${
                      folder.has_card
                        ? 'fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  />
                ) : folder.is_default ? (
                  <IconHeart
                    className={`h-3.5 w-3.5 flex-shrink-0 ${
                      folder.has_card
                        ? 'fill-zinc-700 text-zinc-700 dark:fill-zinc-300 dark:text-zinc-300'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  />
                ) : (
                  <IconFolder
                    className={`h-3.5 w-3.5 flex-shrink-0 ${
                      folder.has_card
                        ? 'text-zinc-700 dark:text-zinc-300'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  />
                )}
                <span className='truncate'>{folder.name}</span>
                {folderUpdating === folder.id && (
                  <IconLoader2 className='ml-auto h-3 w-3 animate-spin' />
                )}
              </label>
            </div>
          ))
        ) : (
          <div className='rounded-md bg-zinc-100 p-2.5 text-center dark:bg-zinc-800'>
            <span className='text-xs text-zinc-500 dark:text-zinc-400'>
              No folders available
            </span>
          </div>
        )}
      </div>

      {hasChanges && (
        <div className='mt-3 flex justify-end'>
          <Button
            size='sm'
            variant='outline'
            onClick={saveChanges}
            disabled={isSaving}
            className='flex items-center gap-1.5 text-xs'
          >
            {isSaving ? (
              <IconLoader2 className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <IconDeviceFloppy className='h-3.5 w-3.5' />
            )}
            Save changes
          </Button>
        </div>
      )}
    </div>
  );
};
