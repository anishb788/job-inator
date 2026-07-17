/**
 * Thin, typed wrapper around localStorage. All Job-Inator state (provider
 * choice, per-provider API keys and models, resume source, job description,
 * theme) lives client-side only — nothing is ever sent anywhere except
 * directly to whichever provider is selected when the user clicks Optimize.
 *
 * Persistence itself is opt-out (see STORAGE_KEYS.persistData / the "Save my
 * data" toggle in Settings) — when the user turns it off, callers stop writing
 * through writeStorage and any previously-saved keys are wiped via removeStorage.
 */

const PREFIX = 'job-inator:'

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // localStorage unavailable (private browsing quota, etc.) — fail silently,
    // the app still works for the current session.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}

export const STORAGE_KEYS = {
  theme: 'theme',
  provider: 'provider',
  apiKeys: 'api-keys',
  models: 'models',
  resumeLatex: 'resume-latex',
  jobDescription: 'job-description',
  persistData: 'persist-data',
} as const
