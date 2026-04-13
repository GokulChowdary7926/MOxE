import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchClientSettings,
  patchClientSettings,
  type ClientSettingsData,
} from '../services/clientSettings';

type Section = keyof NonNullable<ClientSettingsData['notifications']>;

/**
 * Load/save one `clientSettings.notifications.*` map (string values for radio groups).
 */
export function usePersistedNotificationGroup<S extends Record<string, string>>(
  section: Section,
  defaults: S,
  debounceMs = 450,
) {
  const [values, setValuesState] = useState<S>(() => ({ ...defaults }));
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;

  const clearSaveError = useCallback(() => setSaveError(null), []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    (async () => {
      const all = await fetchClientSettings();
      if (cancelled) return;
      const d = defaultsRef.current;
      const sub = (all.notifications?.[section] ?? {}) as Partial<S>;
      setValuesState({ ...d, ...sub });
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [section]);

  const scheduleSave = useCallback(
    (next: S) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setSaveError(null);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (!mountedRef.current) return;
        patchClientSettings({ notifications: { [section]: next } })
          .then(() => {
            if (mountedRef.current) setSaveError(null);
          })
          .catch((e: unknown) => {
            if (!mountedRef.current) return;
            setSaveError(e instanceof Error ? e.message : 'Failed to save settings');
          });
      }, debounceMs);
    },
    [section, debounceMs],
  );

  const setField = useCallback(
    <K extends keyof S>(key: K, value: S[K]) => {
      setValuesState((prev) => {
        const next = { ...prev, [key]: value };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  return { values, setField, ready, saveError, clearSaveError };
}
