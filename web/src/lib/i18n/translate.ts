import { DEFAULT_LOCALE, DIRECTION, INTL_TAG, type Locale } from './config';
import { messages, type Message, type MessageKey } from './messages';

export type Params = Record<string, string | number>;

export function createI18n(locale: Locale) {
  const dict = messages[locale];
  const tag = INTL_TAG[locale];
  const plural = new Intl.PluralRules(tag);
  const numberFormat = new Intl.NumberFormat(tag);
  const percentFormat = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 2 });

  const parseApiDate = (iso: string) => new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');

  const number = (n: number | string) => numberFormat.format(Number(n));

  function t(key: MessageKey, params?: Params): string {
    const raw: Message = dict[key] ?? messages[DEFAULT_LOCALE][key] ?? key;
    const text = typeof raw === 'string' ? raw : raw[plural.select(Number(params?.count ?? 1)) === 'one' ? 'one' : 'other'];
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (_, name: string) => {
      const value = params[name];
      if (value === undefined) return `{${name}}`;
      return typeof value === 'number' ? number(value) : value;
    });
  }

  return {
    locale,
    dir: DIRECTION[locale],
    t,
    has: (key: string): key is MessageKey => key in dict,
    fmt: {
      number,
      percent: (n: number) => percentFormat.format(n / 100),
      date: (iso: string | null | undefined) =>
        iso ? parseApiDate(iso).toLocaleString(tag, { dateStyle: 'medium', timeStyle: 'short' }) : '—',
      dayOnly: (iso: string) => parseApiDate(iso).toLocaleDateString(tag)
    }
  };
}

export type I18n = ReturnType<typeof createI18n>;
export type TFunction = I18n['t'];

export function translate(locale: Locale, key: MessageKey, params?: Params) {
  return createI18n(locale).t(key, params);
}
