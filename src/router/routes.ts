/**
 * Definizione delle rotte dell'applicazione
 */
export enum AppRoute {
  HOME = '/',
  SETTINGS = '/settings',
  CHAT = '/chat',
  EDITOR = '/editor',
  ERROR = '/error'
}

/**
 * Mappa delle rotte con i relativi titoli
 */
export const routeTitles: Record<AppRoute, string> = {
  [AppRoute.HOME]: 'Home',
  [AppRoute.SETTINGS]: 'Settings',
  [AppRoute.CHAT]: 'Chat',
  [AppRoute.EDITOR]: 'Editor',
  [AppRoute.ERROR]: 'Error'
};

/**
 * Verifica se una stringa è una rotta valida
 */
export function isValidRoute(route: string): route is AppRoute {
  return Object.values(AppRoute).includes(route as AppRoute);
}

/**
 * Ottiene il titolo di una rotta
 */
export function getRouteTitle(route: AppRoute): string {
  return routeTitles[route];
}
