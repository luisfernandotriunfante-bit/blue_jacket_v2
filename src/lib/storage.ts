// Local-first persistence: every manual-data collection (RCAs, metas,
// marcações de lançamento/top varejista) lives in localStorage via this
// hook. No backend yet — this is the single source of truth until a real
// sync/motor layer replaces it.

import { useEffect, useState } from 'react';

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function usePersistedState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => readStorage(key, initial));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage full or unavailable (private mode, quota) — fail silently,
      // the in-memory state still works for the rest of the session.
    }
  }, [key, state]);

  return [state, setState] as const;
}
