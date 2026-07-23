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

/**
 * Fetch the bookmark list from the backend. On network/DB failure this rejects so the
 * caller renders a real error state (spec: "graceful error state rather than a crash").
 */
export async function listBookmarks(): Promise<Bookmark[]> {
  return api<Bookmark[]>('/bookmarks');
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
