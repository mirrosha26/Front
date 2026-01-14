'use client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { ChevronDown, Home } from 'lucide-react';
import { Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/types';
import Link from 'next/link';

export function Breadcrumbs() {
  const {
    breadcrumbs,
    folders,
    currentFolder,
    pagesInCurrentFolder,
    currentPage
  } = useBreadcrumbs();

  const pathname = usePathname();
  const homeUrl = '/app/feeds/all-signals';

  if (!breadcrumbs.length) return null;

  // Обработка специальных случаев
  const handleSpecialCases = () => {
    // Определяем специальные маршруты и их целевые страницы
    const specialRoutes = [
      { path: '/app/leads', targetPath: '/app/leads/saved' },
      { path: '/app/feeds', targetPath: '/app/feeds/all-signals' },
      { path: '/app/investors', targetPath: '/app/investors' }
    ];

    // Обработка для корневого пути /app - обрабатываем его как /app/feeds
    if (pathname === '/app') {
      const feedsFolder = folders.find((f) => f.url === '/app/feeds');
      const allSignalsPage = feedsFolder?.items?.find(
        (item) => item.url === '/app/feeds/all-signals'
      );

      if (feedsFolder && allSignalsPage) {
        return {
          modifiedBreadcrumbs: [
            {
              title: feedsFolder.title,
              link: feedsFolder.url,
              isActive: false
            },
            {
              title: allSignalsPage.title,
              link: allSignalsPage.url,
              isActive: true
            }
          ],
          modifiedPathname: '/app/feeds/all-signals'
        };
      }
    }

    // Проверяем, соответствует ли текущий путь одному из специальных маршрутов
    const specialRoute = specialRoutes.find((route) => route.path === pathname);

    if (specialRoute) {
      // Находим папку в структуре навигации
      const folderUrl = specialRoute.path;
      const folder = folders.find((f) => f.url === folderUrl);

      if (folder && folder.items && folder.items.length > 0) {
        // Находим целевую страницу в папке
        const targetPage = folder.items.find(
          (item) => item.url === specialRoute.targetPath
        );

        if (targetPage) {
          // Возвращаем модифицированные хлебные крошки с добавленной целевой страницей
          return {
            modifiedBreadcrumbs: [
              ...breadcrumbs,
              { title: targetPage.title, link: targetPage.url, isActive: true }
            ],
            modifiedPathname: targetPage.url
          };
        }
      }
    }

    // Исключение для Founder Contacts - отображаем только как папку без страницы
    if (pathname === '/app/founder-contacts') {
      return {
        modifiedBreadcrumbs: breadcrumbs,
        modifiedPathname: pathname,
        isSpecialCase: true
      };
    }

    // Обработка для страницы профиля
    if (pathname === '/app/profile') {
      return {
        modifiedBreadcrumbs: [
          ...breadcrumbs,
          { title: 'Профиль', link: '/app/profile', isActive: true }
        ],
        modifiedPathname: pathname,
        isSpecialCase: false
      };
    }

    // Для всех остальных случаев возвращаем исходные данные
    return {
      modifiedBreadcrumbs: breadcrumbs,
      modifiedPathname: pathname,
      isSpecialCase: false
    };
  };

  // Применяем обработку специальных случаев
  const { modifiedBreadcrumbs, modifiedPathname, isSpecialCase } =
    handleSpecialCases();

  // Находим индекс папки и страницы в хлебных крошках
  const folderIndex = modifiedBreadcrumbs.length > 2 ? 1 : 0; // Если есть Home, то папка - второй элемент
  const pageIndex = modifiedBreadcrumbs.length - 1; // Страница всегда последний элемент

  // Получаем данные о папке и странице
  const folder = modifiedBreadcrumbs[folderIndex];
  const page = modifiedBreadcrumbs[pageIndex];

  // Проверяем, является ли последний элемент страницей или папкой
  const isLastElementPage = isSpecialCase ? false : folderIndex !== pageIndex;

  // Находим все страницы в текущей папке из структуры навигации
  const getSiblingPages = (): NavItem[] => {
    // Находим родительскую папку в структуре навигации
    const findParentFolder = (
      items: NavItem[],
      folderUrl: string
    ): NavItem | null => {
      for (const item of items) {
        if (item.url === folderUrl) {
          return item;
        }
        if (item.items && item.items.length > 0) {
          const found = findParentFolder(item.items, folderUrl);
          if (found) return found;
        }
      }
      return null;
    };

    // Если у нас есть текущая папка, находим её в структуре навигации
    if (folder && folder.link) {
      const parentFolder = findParentFolder(folders, folder.link);
      // Возвращаем все дочерние страницы этой папки
      if (parentFolder && parentFolder.items) {
        return parentFolder.items;
      }
    }

    // Если не нашли папку или у неё нет страниц, возвращаем пустой массив
    return [];
  };

  // Получаем все страницы-соседи в текущей папке
  const siblingPages = getSiblingPages();

  return (
    <Breadcrumb>
      <BreadcrumbList className='text-muted-foreground flex h-8 flex-wrap items-center gap-2 text-sm break-words sm:gap-2.5'>
        {/* Первый элемент - выпадающее меню с папками */}
        <BreadcrumbItem className='inline-flex items-center gap-1.5'>
          <BreadcrumbPage className='text-foreground font-normal'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge
                  variant='secondary'
                  className='focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-muted-foreground hover:text-foreground flex w-fit shrink-0 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-full border-0 px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3'
                >
                  {isLastElementPage
                    ? folder.title
                    : pathname === '/app/founder-contacts'
                      ? 'Контакты основателей'
                      : <Home className='size-3' />}
                  <ChevronDown className='size-3' />
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                {folders.map((folderItem) => (
                  <DropdownMenuItem
                    key={folderItem.url}
                    asChild
                    disabled={
                      folderItem.url === folder.link ||
                      (pathname === '/app/founder-contacts' &&
                        folderItem.url === '/app/founder-contacts')
                    }
                    className={
                      folderItem.url === folder.link ||
                      (pathname === '/app/founder-contacts' &&
                        folderItem.url === '/app/founder-contacts')
                        ? 'bg-accent text-accent-foreground font-medium'
                        : ''
                    }
                  >
                    <Link href={folderItem.url}>{folderItem.title}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbPage>
        </BreadcrumbItem>

        {/* Отображаем второй элемент (страницу), если она отличается от папки и не является специальным случаем */}
        {isLastElementPage && !isSpecialCase && (
          <>
            <BreadcrumbSeparator> / </BreadcrumbSeparator>

            <BreadcrumbItem className='inline-flex items-center gap-1.5'>
              <BreadcrumbPage className='text-foreground font-normal'>
                {/* Всегда показываем выпадающий список для страницы, если есть соседние страницы */}
                {siblingPages.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant='secondary'
                        className='focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-muted-foreground hover:text-foreground flex w-fit shrink-0 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-full border-0 px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3'
                      >
                        {page.title}
                        <ChevronDown className='size-3' />
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start'>
                      {siblingPages.map((pageItem) => {
                        const isActive = pageItem.url === modifiedPathname;
                        return (
                          <DropdownMenuItem
                            key={pageItem.url}
                            asChild
                            disabled={isActive}
                            className={
                              isActive
                                ? 'bg-accent text-accent-foreground font-medium'
                                : ''
                            }
                          >
                            <Link href={pageItem.url}>{pageItem.title}</Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge
                    variant='secondary'
                    className='text-muted-foreground w-fit shrink-0 justify-center rounded-full border-0 px-2 py-0.5 text-xs font-medium whitespace-nowrap'
                  >
                    {page.title}
                  </Badge>
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
