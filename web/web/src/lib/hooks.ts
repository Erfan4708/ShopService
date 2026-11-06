'use client';

import useSWR, { mutate } from 'swr';
import { api, post } from './api';
import type { Cart, User } from './types';

export function useAuth() {
  const { data, error, isLoading, mutate: mutateUser } = useSWR<User>('account/profile', { shouldRetryOnError: false });
  const user = error ? null : data ?? null;

  async function login(identifier: string, password: string) {
    const r = await post<{ user: User }>('auth/login', { identifier, password });
    await mutateUser(r.user, false);
    await mutate('cart');
    return r.user;
  }
  async function register(body: { email: string; password: string; firstName: string; lastName: string; phoneNumber?: string }) {
    const r = await post<{ user: User }>('auth/register', body);
    await mutateUser(r.user, false);
    await mutate('cart');
    return r.user;
  }
  async function logout() {
    try { await api('auth/logout', { method: 'POST', json: {} }); } catch { /* ignore */ }
    await mutateUser(undefined, false);
    await mutate('cart', undefined, false);
    await mutate(() => true, undefined, { revalidate: false });
  }
  return { user, isLoading, login, register, logout, isStaff: user?.role === 'Admin' || user?.role === 'Manager', isAdmin: user?.role === 'Admin' };
}

export function useCart() {
  const { data, isLoading, mutate: mutateCart } = useSWR<Cart>('cart');
  return { cart: data, isLoading, mutateCart };
}
