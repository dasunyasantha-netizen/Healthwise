import { launcherHomeUrl } from './launchSource';

const APP_ID = 'healthwise';

/** Return through the launcher that opened this app, with no credentials in the URL. */
export function sharedIdentityUrl(action: 'login' | 'logout' = 'login'): string {
  const home = new URL(launcherHomeUrl());
  const source = home.pathname === '/pickiti' ? 'pickiti' : 'syswise';
  const target = new URL(action === 'logout' ? '/auth/logout' : source === 'pickiti' ? '/pickiti/login' : '/auth/login', home.origin);
  target.searchParams.set('next', `/sso/${APP_ID}?source=${source}`);
  if (action === 'logout') target.searchParams.set('source', source);
  return target.toString();
}

export function clearAppSession(): void {
  localStorage.removeItem(`${APP_ID}_token`);
  localStorage.removeItem(`${APP_ID}_user`);
}

export function signOut(): void {
  clearAppSession();
  // The shared origin must read and revoke its refresh token before clearing it.
  window.location.replace(sharedIdentityUrl('logout'));
}

export function requireSharedSignIn(): void {
  clearAppSession();
  window.location.replace(sharedIdentityUrl());
}

/** Stop displaying an authenticated app in another tab after shared sign-out. */
export function watchSharedSignOut(enabled: () => boolean = () => true): () => void {
  const handle = (event: StorageEvent) => {
    if (enabled() && event.newValue === null && (event.key === `${APP_ID}_token` || event.key === 'syswise_token')) requireSharedSignIn();
  };
  window.addEventListener('storage', handle);
  return () => window.removeEventListener('storage', handle);
}
