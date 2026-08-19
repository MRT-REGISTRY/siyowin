const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/backend';

type ApiOptions = RequestInit & {
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? 'API request failed.');
  }

  return data as T;
}

export type LoginRole = 'student' | 'teacher' | 'admin' | 'super-admin';

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: LoginRole;
    studentId?: string;
    teacherId?: string;
  };
};

export const login = (input: { email?: string; username?: string; password: string; role?: LoginRole }) =>
  apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('siyowin_token') ?? window.sessionStorage.getItem('siyowin_token');
};

export const getStoredUser = (): LoginResponse['user'] | null => {
  if (typeof window === 'undefined') return null;

  const rawUser = window.localStorage.getItem('siyowin_user') ?? window.sessionStorage.getItem('siyowin_user');
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as LoginResponse['user'];
  } catch {
    return null;
  }
};

export const storeSession = (session: LoginResponse, remember: boolean) => {
  if (typeof window === 'undefined') return;

  const persistentStorage = window.localStorage;
  const temporaryStorage = window.sessionStorage;
  const targetStorage = remember ? persistentStorage : temporaryStorage;
  const staleStorage = remember ? temporaryStorage : persistentStorage;

  staleStorage.removeItem('siyowin_token');
  staleStorage.removeItem('siyowin_user');
  targetStorage.setItem('siyowin_token', session.token);
  targetStorage.setItem('siyowin_user', JSON.stringify(session.user));
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('siyowin_token');
  window.localStorage.removeItem('siyowin_user');
  window.sessionStorage.removeItem('siyowin_token');
  window.sessionStorage.removeItem('siyowin_user');
};

export const getDashboardPathForRole = (role?: LoginRole) => {
  if (role === 'student') return '/dashboard';
  if (role === 'teacher') return '/teacher';
  if (role === 'admin' || role === 'super-admin') return '/admin';
  return '/';
};

export const apiGet = <T>(path: string) =>
  apiRequest<T>(path, {
    token: getStoredToken(),
  });

export const apiPost = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, {
    method: 'POST',
    token: getStoredToken(),
    body: JSON.stringify(body),
  });

export const apiPatch = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, {
    method: 'PATCH',
    token: getStoredToken(),
    body: JSON.stringify(body),
  });

export const apiDelete = <T>(path: string) =>
  apiRequest<T>(path, {
    method: 'DELETE',
    token: getStoredToken(),
  });
