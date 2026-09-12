import {
  assignAppPath,
  isStaleChunkLoadError,
  recoverFromStaleChunk,
} from './stale-chunk.util';

describe('isStaleChunkLoadError', () => {
  it('detects the production dynamic-import failure message', () => {
    expect(
      isStaleChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://test-portal.gurokonekt.com/chunk-CGX0IK7F.js'
        )
      )
    ).toBe(true);
  });

  it('returns false for ordinary setup errors', () => {
    expect(isStaleChunkLoadError(new Error('Failed to setup mentor profile'))).toBe(
      false
    );
  });
});

describe('assignAppPath', () => {
  it('assigns a rooted path', () => {
    const assigned: string[] = [];

    assignAppPath('dashboard', {
      assign: (url: string) => {
        assigned.push(url);
      },
    });

    expect(assigned).toEqual(['/dashboard']);
  });
});

describe('recoverFromStaleChunk', () => {
  it('reloads once for a stale chunk and skips a second reload on the same URL', () => {
    let reloadCount = 0;
    const location = {
      href: 'https://test-portal.gurokonekt.com/profile-setup',
      reload: () => {
        reloadCount += 1;
      },
    };
    const store = new Map<string, string>();
    const sessionStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };

    const error = new TypeError(
      'Failed to fetch dynamically imported module: https://test-portal.gurokonekt.com/chunk-CGX0IK7F.js'
    );

    expect(recoverFromStaleChunk(error, { location, sessionStorage })).toBe(true);
    expect(reloadCount).toBe(1);

    expect(recoverFromStaleChunk(error, { location, sessionStorage })).toBe(false);
    expect(reloadCount).toBe(1);
  });
});
