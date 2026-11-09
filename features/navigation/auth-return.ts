const AUTH_RETURN_PATHS = ['/home', '/explore', '/properties', '/community', '/menu', '/wishlist', '/account', '/notifications'] as const;
export type AuthReturnPath = (typeof AUTH_RETURN_PATHS)[number];
export function getSafeAuthReturnPath(value: string | string[] | undefined): AuthReturnPath {
  return typeof value === 'string' && AUTH_RETURN_PATHS.some(path => path === value)
    ? value as AuthReturnPath : '/menu';
}

export function isProtectedMenuPath(path: string): path is '/account' | '/wishlist' {
  return path === '/account' || path === '/wishlist';
}
