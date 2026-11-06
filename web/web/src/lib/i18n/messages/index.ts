import type { Locale } from '../config';
import { fa } from './fa';
import { en } from './en';

export type Message = string | { one: string; other: string };
export type MessageKey = keyof typeof fa;

export const messages: Record<Locale, Record<MessageKey, Message>> = { fa, en };
