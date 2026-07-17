# `src/context/AppContext.tsx`

The single global state container for the app. Everything cross-page (theme, provider selection,
API keys, models, resume source, job description, persistence preference) lives here, backed
optionally by `localStorage` via `src/lib/storage.ts`.

## `AppProvider`

```tsx
function AppProvider({ children }: { children: ReactNode }): JSX.Element
```

Wraps the app (mounted once in `App.tsx`, above `BrowserRouter`) and supplies `AppContextValue`
via React context. Internals:

- `persistData` is read from `localStorage` on mount (default `true`) and is itself always
  persisted (it's a preference, not sensitive data), independent of its own value.
- When `persistData` transitions from `true` to `false`, every key in `PERSISTABLE_KEYS` (theme,
  provider, API keys, models, resume LaTeX, job description) is deleted from `localStorage`
  immediately via `removeStorage` — turning the toggle off doesn't just stop future writes, it
  wipes what's already there.
- `theme`, `provider`, `apiKeys` (a `Record<Provider, string>`), `models` (a
  `Record<Provider, string>`), `resumeLatex`, and `jobDescription` are each backed by
  `usePersistentState`, so they read from `localStorage` on first mount only when `persistData`
  is `true`, and write on every change only while `persistData` stays `true`.
- `apiKeys` and `models` are keyed by `Provider` so each provider remembers its own key and model
  independently — switching providers in Settings doesn't clear previously entered values for
  other providers.
- `theme` also drives a `document.documentElement.classList.toggle('dark', ...)` side effect for
  Tailwind's `dark:` variant.

### `usePersistentState<T>(key, fallback, persistEnabled)`

Internal hook (not exported). Behaves like `useState`, except:
- Initial value is read via `readStorage(key, fallback)` only if `persistEnabled` is `true` at
  mount time; otherwise it starts at `fallback`.
- On every value change, writes via `writeStorage(key, value)` only if `persistEnabled` is
  currently `true`.

### `getInitialTheme(): ThemeMode`

Internal helper (not exported). Returns the theme stored in `localStorage` if present, otherwise
falls back to the OS-level `prefers-color-scheme: dark` media query, defaulting to `'light'`.

## `useAppContext(): AppContextValue`

Hook for consuming the context. Throws `Error('useAppContext must be used within an AppProvider')`
if called outside an `AppProvider` subtree.

## `AppContextValue` shape

| Field | Type | Notes |
|---|---|---|
| `theme` | `ThemeMode` | |
| `setTheme` | `(theme: ThemeMode) => void` | |
| `provider` | `Provider` | Currently selected AI provider. |
| `setProvider` | `(provider: Provider) => void` | |
| `apiKey` | `string` | The API key **for the currently selected provider** (derived from the internal `apiKeys` record). |
| `setApiKey` | `(key: string) => void` | Writes to `apiKeys[provider]` only. |
| `model` | `string` | The model **for the currently selected provider** (falls back to that provider's `defaultModel` if unset). |
| `setModel` | `(model: string) => void` | Writes to `models[provider]` only. |
| `resumeLatex` | `string` | Base resume LaTeX source; defaults to `DEFAULT_RESUME_LATEX`. |
| `setResumeLatex` | `(source: string) => void` | |
| `jobDescription` | `string` | Last-entered job description text. |
| `setJobDescription` | `(text: string) => void` | |
| `persistData` | `boolean` | Whether the above is mirrored to `localStorage`. |
| `setPersistData` | `(enabled: boolean) => void` | See wipe-on-disable behavior above. |

Note that `apiKey`/`model` are convenience projections of the per-provider `apiKeys`/`models`
records for whichever `provider` is currently selected — there is no separate top-level state for
them.
