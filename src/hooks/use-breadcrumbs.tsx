'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { navItems } from '@/constants/data';
import { NavItem } from '@/types';

type BreadcrumbItem = {
  title: string;
  link: string;
  isActive: boolean;
};

// Контекст для хранения данных инвестора для breadcrumbs
let investorBreadcrumbData: {
  investorName?: string;
  parentName?: string;
  parentSlug?: string;
} | null = null;

// Функция для установки данных инвестора
export const setInvestorBreadcrumbData = (data: {
  investorName?: string;
  parentName?: string;
  parentSlug?: string;
} | null) => {
  investorBreadcrumbData = data;
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbData = useMemo(() => {
    // Добавляем корневой элемент (домашнюю страницу)
    const rootItem: BreadcrumbItem = {
      title: 'Главная',
      link: '/app',
      isActive: pathname === '/app'
    };

    // Функция для проверки, является ли URL вложенным в другой URL
    const isUrlInPath = (basePath: string, currentUrl: string) => {
      if (basePath === currentUrl) return true;
      return currentUrl.startsWith(basePath + '/');
    };

    // Функция для поиска активного элемента навигации на любом уровне вложенности
    const findActiveNavItem = (
      items: NavItem[],
      path: string
    ): NavItem | null => {
      // Сортируем элементы по длине URL (от длинных к коротким) для более точного соответствия
      const sortedItems = [...items].sort(
        (a, b) => b.url.length - a.url.length
      );

      for (const item of sortedItems) {
        if (isUrlInPath(item.url, path)) {
          // Если URL точно совпадает, возвращаем этот элемент
          if (item.url === path) {
            return item;
          }

          // Рекурсивно проверяем дочерние элементы
          if (item.items && item.items.length > 0) {
            const activeChild = findActiveNavItem(item.items, path);
            if (activeChild) return activeChild;
          }

          // Если не нашли точное совпадение в дочерних элементах, возвращаем текущий элемент
          return item;
        }
      }

      return null;
    };

    // Функция для построения пути хлебных крошек
    const buildBreadcrumbPath = (
      items: NavItem[],
      path: string
    ): BreadcrumbItem[] => {
      // Начинаем с корневого элемента
      const breadcrumbs: BreadcrumbItem[] = [rootItem];

      // Специальная обработка для страниц инвесторов (все страницы /app/investors/*)
      if (path.match(/^\/app\/investors\/db/)) {
        breadcrumbs.push({
          title: 'Investors',
          link: '/app/investors',
          isActive: false
        });
        
        breadcrumbs.push({
          title: 'Investor Database',
          link: '/app/investors',
          isActive: path === '/app/investors'
        });
        
        return breadcrumbs;
      }

      // Обработка для динамического маршрута инвестора /app/investors/[slug]
      if (path.match(/^\/app\/investors\/[^\/]+$/)) {
        // Извлекаем slug из URL
        const segments = path.split('/').filter(Boolean);
        const slug = segments[segments.length - 1]; // Последний сегмент - это slug
        
        breadcrumbs.push({
          title: 'Investors',
          link: '/app/investors',
          isActive: false
        });
        
        breadcrumbs.push({
          title: 'Investor Database',
          link: '/app/investors',
          isActive: false
        });
        
        // Если есть данные о родителе (фонде), добавляем его в breadcrumbs
        if (investorBreadcrumbData?.parentName && investorBreadcrumbData?.parentSlug) {
          breadcrumbs.push({
            title: investorBreadcrumbData.parentName,
            link: `/app/investors/${investorBreadcrumbData.parentSlug}`,
            isActive: false
          });
        }
        
        // Добавляем текущего инвестора
        const investorName = investorBreadcrumbData?.investorName || slug || 'Investor Details';
        breadcrumbs.push({
          title: investorName,
          link: path,
          isActive: true
        });
        
        return breadcrumbs;
      }

      // Разбиваем путь на сегменты
      const segments = path.split('/').filter(Boolean);

      // Если путь пустой или только '/app', возвращаем только корневой элемент
      if (segments.length <= 1) {
        return breadcrumbs;
      }

      // Строим путь постепенно, добавляя сегменты
      let currentPath = '/app';
      let currentItems = items;

      // Пропускаем первый сегмент 'app', так как он уже учтен в корневом элементе
      for (let i = 1; i < segments.length; i++) {
        currentPath += '/' + segments[i];

        // Ищем соответствующий элемент в текущем уровне навигации
        const matchingItem = currentItems.find(
          (item) => item.url === currentPath
        );

        if (matchingItem) {
          breadcrumbs.push({
            title: matchingItem.title,
            link: matchingItem.url,
            isActive: matchingItem.url === path
          });

          // Обновляем текущие элементы для следующего уровня
          if (matchingItem.items) {
            currentItems = matchingItem.items;
          }
        }
      }

      return breadcrumbs;
    };

    // Находим текущий активный элемент
    const activeItem = findActiveNavItem(navItems, pathname);

    // Строим путь хлебных крошек
    const breadcrumbs = buildBreadcrumbPath(navItems, pathname);

    // Находим текущую папку (родительский элемент)
    let currentFolder = null;
    let pagesInCurrentFolder: NavItem[] = [];

    if (breadcrumbs.length > 1) {
      // Проверяем, есть ли элементы кроме корневого
      // Если есть хотя бы один элемент в хлебных крошках
      const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];

      // Если последний элемент не совпадает с текущим путем, значит мы находимся в подпапке
      if (lastBreadcrumb.link !== pathname && breadcrumbs.length > 2) {
        // Берем предпоследний элемент как текущую папку
        const parentIndex = breadcrumbs.length - 2;
        currentFolder = {
          title: breadcrumbs[parentIndex].title,
          url: breadcrumbs[parentIndex].link
        };

        // Находим соответствующий элемент в navItems для получения дочерних страниц
        const findParentItem = (
          items: NavItem[],
          url: string
        ): NavItem | null => {
          for (const item of items) {
            if (item.url === url) return item;
            if (item.items && item.items.length > 0) {
              const found = findParentItem(item.items, url);
              if (found) return found;
            }
          }
          return null;
        };

        const parentItem = findParentItem(navItems, currentFolder.url);
        if (parentItem && parentItem.items) {
          pagesInCurrentFolder = parentItem.items;
        }
      } else {
        // Если последний элемент совпадает с текущим путем, используем его как текущую папку
        currentFolder = {
          title: lastBreadcrumb.title,
          url: lastBreadcrumb.link
        };

        // Находим соответствующий элемент в navItems
        const currentItem = findActiveNavItem(navItems, pathname);
        if (currentItem && currentItem.items) {
          pagesInCurrentFolder = currentItem.items;
        }
      }
    }

    return {
      breadcrumbs,
      folders: navItems,
      currentFolder,
      pagesInCurrentFolder,
      currentPage: activeItem
    };
  }, [pathname]);

  return breadcrumbData;
}
