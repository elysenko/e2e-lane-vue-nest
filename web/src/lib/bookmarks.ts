// Bookmarks data access. Wires to the real backend (GET/POST /api/bookmarks) but, so the
// preview mockup renders a populated UI when no backend is attached, it falls back to a
// local seed set that mirrors the server's first-load seeding of 3 example bookmarks.
import { api, ApiError } from './api';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

const SEED: Bookmark[] = [
  { id: 'seed-1', title: 'Vue.js Documentation', url: 'https://vuejs.org/guide/introduction.html', createdAt: '2026-07-20T09:00:00Z' },
  { id: 'seed-2', title: 'NestJS Documentation', url: 'https://docs.nestjs.com/', createdAt: '2026-07-20T09:01:00Z' },
  { id: 'seed-3', title: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/', createdAt: '2026-07-20T09:02:00Z' },
];

// Local fallback store (mockup only — the backend is the source of truth in production).
let local: Bookmark[] | null = null;
function localStore(): Bookmark[] {
  if (!local) local = SEED.map((b) => ({ ...b }));
  return local;
}

export async function listBookmarks(): Promise<{ data: Bookmark[]; offline: boolean }> {
  try {
    const data = await api<Bookmark[]>('/bookmarks');
    return { data, offline: false };
  } catch (e) {
    // Network failure or backend down -> show the intended UI with local seed data.
    if (e instanceof TypeError || e instanceof ApiError) {
      return { data: localStore(), offline: true };
    }
    return { data: localStore(), offline: true };
  }
}

export interface CreateResult {
  ok: boolean;
  bookmark?: Bookmark;
  fieldErrors?: Record<string, string>;
}

export async function createBookmark(input: { title: string; url: string }): Promise<CreateResult> {
  try {
    const bookmark = await api<Bookmark>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, bookmark };
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) {
      return { ok: false, fieldErrors: mapValidation(e.body) };
    }
    // Offline mockup: persist to the local store so the new row appears in the list.
    const bookmark: Bookmark = {
      id: 'local-' + localStore().length,
      title: input.title,
      url: input.url,
      createdAt: '2026-07-22T12:00:00Z',
    };
    localStore().unshift(bookmark);
    return { ok: true, bookmark };
  }
}

// Map NestJS ValidationPipe error payloads ({ message: string[] }) to per-field messages.
function mapValidation(body: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const messages = (body as { message?: string[] | string })?.message;
  const arr = Array.isArray(messages) ? messages : messages ? [messages] : [];
  for (const m of arr) {
    const lower = m.toLowerCase();
    if (lower.includes('title')) out.title = m;
    else if (lower.includes('url')) out.url = m;
  }
  return out;
}
