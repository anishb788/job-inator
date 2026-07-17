# `src/types.ts`

Shared TypeScript types and the static AI-provider catalog used throughout the app (context,
Settings drawer, provider modules).

## Types

### `ThemeMode`

```ts
type ThemeMode = 'light' | 'dark'
```

### `Provider`

```ts
type Provider = 'anthropic' | 'openai' | 'google' | 'groq'
```

The four supported AI providers. Adding a new provider means adding a new member here (see
`docs/architecture.md`'s "Adding a new AI provider" section).

### `ModelOption`

```ts
interface ModelOption {
  value: string   // model id passed to the provider's SDK
  label: string   // display name shown in the model <select>
  hint: string    // one-line description shown under the select in Settings
}
```

### `ProviderInfo`

```ts
interface ProviderInfo {
  id: Provider
  label: string          // display name, e.g. "Claude (Anthropic)"
  keyPlaceholder: string // placeholder text for the API key input
  keyHelpText: string    // "Where do I get a key" hint text
  models: ModelOption[]
  defaultModel: string   // must match one of models[].value
}
```

## `PROVIDERS: ProviderInfo[]`

Static catalog of all four providers (Anthropic, OpenAI, Google, Groq), each with its own
`keyPlaceholder`/`keyHelpText` and a curated list of `ModelOption`s. This is the single source of
truth consumed by:

- `SettingsDrawer` — provider selector, model `<select>`, API key input.
- `AppContext` — `DEFAULT_MODELS` is derived from `PROVIDERS[].defaultModel`.

## `getProviderInfo(id: Provider): ProviderInfo`

Looks up a provider's `ProviderInfo` by id from `PROVIDERS`. Throws `Error('Unknown provider: ' +
id)` if `id` isn't found (which should be unreachable given `Provider` is a closed union, but the
catalog and the union type are maintained separately, so this is a runtime safety check).
