export const getToken = () => localStorage.getItem('freshero_admin_token');
export const setToken = (token: string) => localStorage.setItem('freshero_admin_token', token);
export const removeToken = () => localStorage.removeItem('freshero_admin_token');

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
    const { user } = await res.json();
    return user;
  } catch {
    return null;
  }
}
