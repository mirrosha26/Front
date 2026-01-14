/**
 * Интерфейс для папки
 */
export interface Folder {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  cards_count: number;
  has_card?: boolean; // Используется при получении списка папок для карточки
}

/**
 * Интерфейс для ответа API со списком папок
 */
export interface FoldersResponse {
  success: boolean;
  folders: Folder[];
}

/**
 * Интерфейс для ответа API с одной папкой
 */
export interface FolderResponse {
  success: boolean;
  folder: Folder;
}

/**
 * Интерфейс для запроса на обновление папок карточки
 */
export interface UpdateCardFoldersRequest {
  include_folders?: number[];
  exclude_folders?: number[];
}
