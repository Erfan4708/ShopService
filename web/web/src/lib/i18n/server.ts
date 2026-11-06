import { cookies } from 'next/headers';
import { LOCALE_COOKIE, parseLocale } from './config';
import { createI18n } from './translate';

export function getLocale() {
  return parseLocale(cookies().get(LOCALE_COOKIE)?.value);
}

export function getI18n() {
  return createI18n(getLocale());
}
