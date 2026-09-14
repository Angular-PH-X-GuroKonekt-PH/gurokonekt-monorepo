const STALE_CHUNK_RELOAD_KEY = 'gk.stale-chunk-reload';

const STALE_CHUNK_PATTERN =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Loading chunk [\w.-]+ failed|ChunkLoadError/i;

export interface AssignableLocation {
  assign(url: string): void;
}

export interface ReloadableLocation {
  href: string;
  reload(): void;
}

export interface SessionStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * True when a lazy route/chunk request failed because this tab is still
 * running an older hashed build (typical after leaving the app open across a deploy).
 */
export function isStaleChunkLoadError(error: unknown): boolean {
  const candidates: string[] = [];

  if (error instanceof Error) {
    candidates.push(error.message, error.name);
  } else if (error && typeof error === 'object') {
    const record = error as { message?: unknown; name?: unknown };
    if (typeof record.message === 'string') {
      candidates.push(record.message);
    }
    if (typeof record.name === 'string') {
      candidates.push(record.name);
    }
  } else if (typeof error === 'string') {
    candidates.push(error);
  }

  return candidates.some((text) => STALE_CHUNK_PATTERN.test(text));
}

/** Full navigation so the browser loads current index.html + chunks. */
export function assignAppPath(path: string, location?: AssignableLocation): void {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  (location ?? window.location).assign(normalized);
}

/**
 * Reloads once per URL when a stale chunk is detected. Returns true when a
 * reload was triggered so callers can skip user-facing error toasts.
 */
export function recoverFromStaleChunk(
  error: unknown,
  deps: {
    location?: ReloadableLocation;
    sessionStorage?: SessionStore;
  } = {}
): boolean {
  if (!isStaleChunkLoadError(error)) {
    return false;
  }

  const location = deps.location ?? window.location;
  const storage = deps.sessionStorage ?? window.sessionStorage;
  const href = location.href;

  try {
    if (storage.getItem(STALE_CHUNK_RELOAD_KEY) === href) {
      return false;
    }
    storage.setItem(STALE_CHUNK_RELOAD_KEY, href);
  } catch {
    // Storage can be blocked; still try a single reload.
  }

  location.reload();
  return true;
}
