// Предполагаемый компонент для управления папками карточки

const handleRemoveFromFolder = async (folderId: number) => {
  const success = await removeFromFolder(card.id, folderId);

  // Если карточка была удалена из текущей открытой папки
  if (success && currentFolderId === String(folderId) && onCardRemoved) {
    // Вызываем колбэк для скрытия карточки из списка
    onCardRemoved(card.id);
  }
};
