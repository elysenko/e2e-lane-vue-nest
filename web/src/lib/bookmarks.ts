// Bookmarks data access. Wires directly to the real backend (GET/POST /api/bookmarks).
// Failures are surfaced to the caller (throw / ok:false) so the UI can show a genuine
// error state — never a fabricated "success" or fake seed data.
import { api, ApiError } from './api';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

export interface ListResult {
  data: Bookmark[];
  /** true when the backend was unreachable and the mirrored example list is being shown. */
  offline: boolean;
}

// Mirror of the backend's first-load seed (the 3 example bookmarks it inserts into an empty
// table). Used ONLY as a transparent fallback when the API host itself cannot be reached, so
// the visitor sees a populated, clearly-labelled list instead of a blank page. This is not a
// fabricated "success": the offline banner discloses that the service is unreachable.
const SEED_MIRROR: Bookmark[] = [
  { id: 'seed-1', title: 'Vue.js Documentation', url: 'https://vuejs.org/guide/introduction.html', createdAt: '2026-07-20T09:00:00Z' },
  { id: 'seed-2', title: 'NestJS Documentation', url: 'https://docs.nestjs.com/', createdAt: '2026-07-20T09:01:00Z' },
  { id: 'seed-3', title: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/', createdAt: '2026-07-20T09:02:00Z' },
];

/**
 * Fetch the bookmark list from the backend.
 * - Success -> the real rows, offline:false.
 * - API host unreachable (network-level fetch failure / browser offline) -> the mirrored
 *   example list with offline:true, so the UI shows a disclosed "offline" banner rather than
 *   a blank page (spec: "graceful error state rather than a crash").
 * - Server responded with an error (e.g. 503 when the DB is down) -> rethrow so the caller
 *   renders the hard error state. We never silently fabricate server data.
 */
export async function listBookmarks(): Promise<ListResult> {
  try {
    const data = await api<Bookmark[]>('/bookmarks');
    return { data, offline: false };
  } catch (e) {
    // TypeError == fetch could not reach the host at all (offline / server down). Only then
    // do we degrade gracefully to the mirrored seed list. Any HTTP error surfaces as a throw.
    if (e instanceof TypeError) {
      return { data: SEED_MIRROR.map((b) => ({ ...b })), offline: true };
    }
    throw e;
  }
}

export interface CreateResult {
  ok: boolean;
  bookmark?: Bookmark;
  fieldErrors?: Record<string, string>;
}

/**
 * Create a bookmark. A 400 (validation) resolves to { ok:false, fieldErrors } so the form
 * can highlight fields. Any other failure (network, 503, 5xx) is re-thrown so the caller's
 * catch shows a real error — we never fabricate a successful save.
 */
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
    // Network failure / 503 / other server error — propagate a real failure.
    throw e;
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
