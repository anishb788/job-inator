import { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { PROVIDERS, getProviderInfo } from '../../types'

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const {
    theme,
    setTheme,
    provider,
    setProvider,
    apiKey,
    setApiKey,
    model,
    setModel,
    persistData,
    setPersistData,
  } = useAppContext()
  const [showKey, setShowKey] = useState(false)

  if (!open) return null

  const providerInfo = getProviderInfo(provider)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close settings"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-sm flex-col gap-6 overflow-y-auto bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Save my data in this browser
            </h3>
            <button
              type="button"
              role="switch"
              aria-checked={persistData}
              onClick={() => setPersistData(!persistData)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                persistData ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  persistData ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            When on, your API keys, model choices, theme, base resume, and last job description are
            kept in this browser's local storage so they're still here next time. Turn this off to
            keep everything in memory only for this tab — nothing is written to disk, and anything
            already saved is deleted immediately.
          </p>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Appearance</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                theme === 'light'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              Dark
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            AI provider
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  provider === p.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Each provider remembers its own model and API key, so you can switch back and forth
            without re-entering anything.
          </p>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {providerInfo.label} model
          </h3>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {providerInfo.models.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {providerInfo.models.find((o) => o.value === model)?.hint}
          </p>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {providerInfo.label} API key
          </h3>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={providerInfo.keyPlaceholder}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="rounded-md border border-slate-300 px-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{providerInfo.keyHelpText}</p>
          <p className="mt-2 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
            This app has no backend — your key is sent directly from your browser to{' '}
            {providerInfo.label} when you click Optimize.{' '}
            {persistData
              ? "It's also saved in this browser's local storage (see the toggle above if you'd rather it wasn't)."
              : "It is not being saved anywhere — it'll be gone the moment you close or reload this tab."}{' '}
            Don't use this on a shared or public computer, and don't paste in a key with a large
            budget attached.
          </p>
        </section>
      </div>
    </div>
  )
}
