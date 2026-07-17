import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { readStorage, writeStorage, removeStorage, STORAGE_KEYS } from '../lib/storage'
import { DEFAULT_RESUME_LATEX } from '../lib/defaultResume'
import { PROVIDERS, type Provider, type ThemeMode } from '../types'

const PERSISTABLE_KEYS = [
  STORAGE_KEYS.theme,
  STORAGE_KEYS.provider,
  STORAGE_KEYS.apiKeys,
  STORAGE_KEYS.models,
  STORAGE_KEYS.resumeLatex,
  STORAGE_KEYS.jobDescription,
]

const DEFAULT_API_KEYS: Record<Provider, string> = {
  anthropic: '',
  openai: '',
  google: '',
  groq: '',
}

const DEFAULT_MODELS: Record<Provider, string> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p.defaultModel]),
) as Record<Provider, string>

/**
 * Like useState, but mirrored to localStorage under `key` — as long as
 * `persistEnabled` is true. When it's false, state is in-memory only for the
 * current page load (nothing is read or written), which is how the "Save my
 * data" toggle in Settings opts a user out of persistence entirely.
 */
function usePersistentState<T>(key: string, fallback: T, persistEnabled: boolean) {
  const [value, setValue] = useState<T>(() => (persistEnabled ? readStorage<T>(key, fallback) : fallback))

  useEffect(() => {
    if (persistEnabled) {
      writeStorage(key, value)
    }
  }, [key, value, persistEnabled])

  return [value, setValue] as const
}

function getInitialTheme(): ThemeMode {
  const stored = readStorage<ThemeMode | null>(STORAGE_KEYS.theme, null)
  if (stored) return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface AppContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  provider: Provider
  setProvider: (provider: Provider) => void
  /** The API key for the currently selected provider. */
  apiKey: string
  setApiKey: (key: string) => void
  /** The model for the currently selected provider. */
  model: string
  setModel: (model: string) => void
  resumeLatex: string
  setResumeLatex: (source: string) => void
  jobDescription: string
  setJobDescription: (text: string) => void
  persistData: boolean
  setPersistData: (enabled: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [persistData, setPersistData] = useState<boolean>(() =>
    readStorage(STORAGE_KEYS.persistData, true),
  )

  // The toggle itself always persists (it's just a preference, not sensitive)
  // so the user's choice survives a reload.
  useEffect(() => {
    writeStorage(STORAGE_KEYS.persistData, persistData)
  }, [persistData])

  // The moment the user turns persistence off, wipe anything already saved —
  // "off" should mean off, not just "stop saving from now on".
  const prevPersistData = useRef(persistData)
  useEffect(() => {
    if (prevPersistData.current && !persistData) {
      PERSISTABLE_KEYS.forEach(removeStorage)
    }
    prevPersistData.current = persistData
  }, [persistData])

  const [theme, setTheme] = usePersistentState<ThemeMode>(
    STORAGE_KEYS.theme,
    getInitialTheme(),
    persistData,
  )
  const [provider, setProvider] = usePersistentState<Provider>(
    STORAGE_KEYS.provider,
    'anthropic',
    persistData,
  )
  const [apiKeys, setApiKeys] = usePersistentState<Record<Provider, string>>(
    STORAGE_KEYS.apiKeys,
    DEFAULT_API_KEYS,
    persistData,
  )
  const [models, setModels] = usePersistentState<Record<Provider, string>>(
    STORAGE_KEYS.models,
    DEFAULT_MODELS,
    persistData,
  )
  const [resumeLatex, setResumeLatex] = usePersistentState<string>(
    STORAGE_KEYS.resumeLatex,
    DEFAULT_RESUME_LATEX,
    persistData,
  )
  const [jobDescription, setJobDescription] = usePersistentState<string>(
    STORAGE_KEYS.jobDescription,
    '',
    persistData,
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  function setApiKey(key: string) {
    setApiKeys((prev) => ({ ...prev, [provider]: key }))
  }

  function setModel(model: string) {
    setModels((prev) => ({ ...prev, [provider]: model }))
  }

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        provider,
        setProvider,
        apiKey: apiKeys[provider] ?? '',
        setApiKey,
        model: models[provider] ?? DEFAULT_MODELS[provider],
        setModel,
        resumeLatex,
        setResumeLatex,
        jobDescription,
        setJobDescription,
        persistData,
        setPersistData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider')
  return ctx
}
