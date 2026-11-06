export const LOCALES = ['fa', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fa';
export const LOCALE_COOKIE = 'locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DIRECTION: Record<Locale, 'rtl' | 'ltr'> = { fa: 'rtl', en: 'ltr' };
export const INTL_TAG: Record<Locale, string> = { fa: 'fa-IR', en: 'en-US' };

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
export const parseLocale = (v: unknown): Locale => (isLocale(v) ? v : DEFAULT_LOCALE);

export function readLocaleFromCookieString(cookie: string): Locale {
  const match = cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  return parseLocale(match?.slice(LOCALE_COOKIE.length + 1));
}

export function getClientLocale(): Locale {
  return typeof document === 'undefined' ? DEFAULT_LOCALE : readLocaleFromCookieString(document.cookie);
}

export function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}
