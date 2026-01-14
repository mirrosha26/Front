'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { Folder } from '@/features/shared/types/folders';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { InvestorsGraphQLProvider } from '@/features/investors/contexts/investors-graphql-context';

interface FoldersContextType {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  selectedFolderKey: string;
  setSelectedFolderKey: (key: string) => void;

  // Folder management methods
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, description?: string) => Promise<boolean>;
  updateFolder: (
    id: number,
    name: string,
    description?: string
  ) => Promise<boolean>;
  deleteFolder: (id: number) => Promise<boolean>;
  exportFolder: (folderKey: string) => Promise<boolean>;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export function FoldersProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderKey, setSelectedFolderKey] = useState<string>('default');

  // Using useRef to track if initial fetch was done
  const initialFetchDone = useRef(false);

  const { fetchWithAuth, logout } = useAuth();
  const router = useRouter();

  const handleAuthError = async (error: any) => {
    if (
      error.message?.includes('Session expired') ||
      error.message?.includes('please sign in again')
    ) {
      toast.error('Ваша сессия истекла. Пожалуйста, войдите снова.');
      await logout();
      router.push('/auth/sign-in');
      return true;
    }
    return false;
  };

  // Load folders list
  const fetchFolders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Send API request
      const response = await fetchWithAuth('/api/folders');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
        }
        throw new Error('Error loading folders');
      }

      const data = await response.json();

      if (data.success) {
        setFolders(data.folders);
      } else {
        throw new Error(data.message || 'Error loading folders');
      }
    } catch (error) {
      // Check if error is auth-related
      const isAuthError = await handleAuthError(error);
      if (!isAuthError) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        toast.error('Не удалось загрузить папки. Попробуйте еще раз.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, handleAuthError]);

  // Create new folder
  const createFolder = useCallback(
    async (name: string, description?: string): Promise<boolean> => {
      try {
        const response = await fetchWithAuth('/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            description: description || ''
          })
        });

        if (!response.ok) {
          throw new Error('Error creating folder');
        }

        const data = await response.json();

        if (data.success) {
          // Update folders list
          await fetchFolders();
          toast.success('Папка успешно создана');
          return true;
        } else {
          throw new Error(data.message || 'Error creating folder');
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
        }
        return false;
      }
    },
    [fetchWithAuth, fetchFolders, handleAuthError]
  );

  // Update folder
  const updateFolder = useCallback(
    async (
      id: number,
      name: string,
      description?: string
    ): Promise<boolean> => {
      try {
        const response = await fetchWithAuth(`/api/folders/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            description: description || ''
          })
        });

        if (!response.ok) {
          throw new Error('Error updating folder');
        }

        const data = await response.json();

        if (data.success) {
          // Update folders list
          await fetchFolders();
          toast.success('Папка успешно обновлена');
          return true;
        } else {
          throw new Error(data.message || 'Error updating folder');
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
        }
        return false;
      }
    },
    [fetchWithAuth, fetchFolders, handleAuthError]
  );

  // Delete folder
  const deleteFolder = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const response = await fetchWithAuth(`/api/folders/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Error deleting folder');
        }

        const data = await response.json();

        if (data.success) {
          // Update folders list
          await fetchFolders();

          // If deleted folder was selected, reset selection to default
          const deletedFolder = folders.find((f) => f.id === id);
          if (deletedFolder && selectedFolderKey === String(deletedFolder.id)) {
            setSelectedFolderKey('default');

            // Add event to notify about need to update cards list
            window.dispatchEvent(
              new CustomEvent('folder-deleted', {
                detail: { folderId: id }
              })
            );
          }

          toast.success('Папка успешно удалена');
          return true;
        } else {
          throw new Error(data.message || 'Error deleting folder');
        }
      } catch (error) {
        const isAuthError = await handleAuthError(error);
        if (!isAuthError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          toast.error(errorMessage);
        }
        return false;
      }
    },
    [fetchWithAuth, fetchFolders, handleAuthError, folders, selectedFolderKey]
  );

  // Export folder to CSV
  const exportFolder = useCallback(
    async (folderKey: string): Promise<boolean> => {
      try {
        // Create download link
        const link = document.createElement('a');
        
        // Get folder name for filename
        const folder = folders.find(f => String(f.id) === folderKey);
        const folderName = folder ? encodeURIComponent(folder.name) : folderKey;
        
        // Use universal export endpoint with folder parameter
        // Handle special case for favorites (default)
        const exportKey = folderKey === 'default' ? 'favorites' : folderKey;
        link.href = `/api/folders/export?folder=${exportKey}&name=${folderName}`;
        link.download = folderKey === 'default' 
          ? `favorites-export.csv` 
          : `folder-${folderName}-export.csv`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Экспорт папки начат');
        return true;
      } catch (error) {
        console.error('Error exporting folder:', error);
        toast.error('Не удалось экспортировать папку');
        return false;
      }
    },
    [folders]
  );

  // Load folders only on first render
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchFolders();
      initialFetchDone.current = true;
    }
  }, [fetchFolders]);

  return (
    <FoldersContext.Provider
      value={{
        folders,
        isLoading,
        error,
        selectedFolderKey,
        setSelectedFolderKey,
        fetchFolders,
        createFolder,
        updateFolder,
        deleteFolder,
        exportFolder
      }}
    >
      <InvestorsGraphQLProvider>{children}</InvestorsGraphQLProvider>
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FoldersContext);
  if (context === undefined) {
    throw new Error('useFolders must be used within FoldersProvider');
  }
  return context;
}
