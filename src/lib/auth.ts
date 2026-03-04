import { readJsonSafe } from './http';

export const getToken = () => localStorage.getItem('ignite26_admin_token');
export const setToken = (token: string) => localStorage.setItem('ignite26_admin_token', token);
export const removeToken = () => localStorage.removeItem('ignite26_admin_token');

export const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

export async function checkAdminAuth(): Promise<{ id: number; email: string } | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/auth/me', { headers: authHeaders() });
    if (!res.ok) { removeToken(); return null; }
    const payload = await readJsonSafe<{ user?: { id: number; email: string } }>(res);
    return payload?.user ?? null;
  } catch {
    return null;
  }
}
