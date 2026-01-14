import { useState, useEffect } from 'react';

interface UserType {
  value: string;
  label: string;
}

interface RegistrationMeta {
  user_types: UserType[];
  // другие поля метаданных
}

// Стандартные типы пользователей (используются, если API недоступен)
const DEFAULT_USER_TYPES: UserType[] = [
  { value: 'VC', label: 'Venture Capital' },
  { value: 'PE', label: 'Private Equity' },
  { value: 'OTHER', label: 'Other' }
];

export function useRegistrationMeta() {
  const [meta, setMeta] = useState<RegistrationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Устанавливаем флаг isClient после монтирования компонента
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Выполняем запрос только на клиенте
    if (!isClient) return;

    console.log('useRegistrationMeta: Hook initialized');

    const fetchMeta = async () => {
      console.log('useRegistrationMeta: Starting to fetch metadata');
      try {
        setLoading(true);
        setError(null);

        // Используем стабильный URL без случайных параметров
        const response = await fetch('/api/auth/meta');

        console.log('useRegistrationMeta: Received response', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });

        if (!response.ok) {
          throw new Error(`Не удалось получить метаданные: ${response.status}`);
        }

        const data = await response.json();
        console.log('useRegistrationMeta: Parsed data', data);

        // Проверяем структуру данных
        if (!data) {
          console.error('useRegistrationMeta: Data is null or undefined');
          throw new Error('Получены пустые данные');
        }

        if (!data.user_types) {
          console.error(
            'useRegistrationMeta: user_types not found in data',
            data
          );
          throw new Error('В данных отсутствует поле user_types');
        }

        if (!Array.isArray(data.user_types)) {
          console.error(
            'useRegistrationMeta: user_types is not an array',
            data.user_types
          );
          throw new Error('Поле user_types не является массивом');
        }

        // Устанавливаем метаданные
        setMeta(data);
        console.log('useRegistrationMeta: Meta state updated with', data);
      } catch (error) {
        console.error('useRegistrationMeta: Error during fetch', error);
        setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
        // В случае ошибки используем стандартные типы
        setMeta({ user_types: DEFAULT_USER_TYPES });
      } finally {
        setLoading(false);
        console.log('useRegistrationMeta: Fetch completed');
      }
    };

    fetchMeta();
  }, [isClient]); // Зависимость от isClient

  // Если метаданные не загружены, возвращаем значения по умолчанию
  return {
    meta: meta || { user_types: DEFAULT_USER_TYPES },
    loading,
    error
  };
}
