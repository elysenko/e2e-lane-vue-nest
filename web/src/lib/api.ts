// Same-origin API client. In every deployed environment the NestJS backend serves
// both the SPA and the REST API on the same host under BASE_URL; the vite dev-server
// proxies /api locally. Base URL = import.meta.env.BASE_URL + 'api'. Never hardcode a host.
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(API_BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}
