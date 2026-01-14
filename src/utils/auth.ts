// Список защищенных маршрутов
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings'];

/**
 * Проверяет, является ли маршрут защищенным
 * @param path Путь для проверки
 * @returns true, если маршрут защищен
 */
export function isProtectedRoute(path: string): boolean {
  // Проверяем, начинается ли путь с одного из защищенных маршрутов
  return PROTECTED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

/**
 * Проверяет, является ли маршрут страницей аутентификации
 * @param path Путь для проверки
 * @returns true, если маршрут является страницей аутентификации
 */
export function isAuthRoute(path: string): boolean {
  return path.startsWith('/auth/');
}

/**
 * Проверяет, является ли маршрут публичным (не требует аутентификации)
 * @param path Путь для проверки
 * @returns true, если маршрут публичный
 */
export function isPublicRoute(path: string): boolean {
  return !isProtectedRoute(path) && !isAuthRoute(path);
}
