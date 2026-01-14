# Investors Page - URL State Management

## Обзор

Страница инвесторов теперь поддерживает сохранение состояния фильтров и позиции скролла в URL, что позволяет пользователям:

- Возвращаться назад и восстанавливать состояние фильтров
- Делиться ссылками с примененными фильтрами
- Восстанавливать позицию скролла при возврате на страницу

## URL Параметры

### Фильтры
- `filters` - выбранные типы инвесторов (например: `filters=angels,founders`)
- `search` - поисковый запрос
- `categories` - выбранные категории (например: `categories=defi,web3`)
- `saved` - фильтр по сохраненным (`saved`, `not_saved`, или отсутствует для "all")

### Скролл
- `scroll` - позиция скролла основного контента

## Примеры URL

```
# Все инвесторы
/investors

# Только ангелы
/investors?filters=angels

# Ангелы с поиском "blockchain"
/investors?filters=angels&search=blockchain

# Фонды в категории DeFi
/investors?filters=funds&categories=defi

# Приватные участники с позицией скролла
/investors?filters=private&scroll=1500

# Комбинация фильтров
/investors?filters=angels,founders&categories=web3,ai&search=tech&saved=saved
```

## Восстановление состояния

При загрузке страницы с параметрами в URL:

1. **Фильтры** - автоматически применяются выбранные типы инвесторов
2. **Поиск** - восстанавливается поисковый запрос
3. **Категории** - применяются выбранные категории
4. **Сохраненные** - восстанавливается фильтр по сохраненным
5. **Скролл** - восстанавливается позиция скролла

## Использование в коде

```typescript
import { useInvestorsGraphQL } from '../contexts/investors-graphql-context';

function MyComponent() {
  const {
    selectedFilters,
    selectedCategories,
    searchTerm,
    savedFilter,
    toggleFilter,
    toggleCategory,
    setSearchTerm,
    setSavedFilter,
    saveMainScroll,
    restoreScrollPosition
  } = useInvestorsGraphQL();

  // Сохранение позиции скролла
  const handleScroll = (scrollTop: number) => {
    saveMainScroll(scrollTop);
  };

  // Восстановление позиции скролла
  useEffect(() => {
    const { mainScrollTop } = restoreScrollPosition();
    if (mainScrollTop > 0) {
      // Восстанавливаем позицию скролла
      element.scrollTop = mainScrollTop;
    }
  }, []);

  return (
    // Ваш компонент
  );
}
```

## Преимущества

1. **Навигация** - пользователи могут использовать кнопки браузера "Назад/Вперед"
2. **Закладки** - можно сохранить ссылку с примененными фильтрами
3. **Поделиться** - можно отправить ссылку коллеге с конкретными настройками
4. **UX** - состояние сохраняется между сессиями
5. **SEO** - каждый набор фильтров имеет уникальный URL

## Техническая реализация

- Использует `useSearchParams` и `useRouter` из Next.js
- Состояние синхронизируется между URL и локальным состоянием
- Позиция скролла сохраняется в URL для восстановления
- Все изменения фильтров автоматически обновляют URL 