export type ThemeMode = 'light' | 'dark'

export type Provider = 'anthropic' | 'openai' | 'google' | 'groq'

export interface ModelOption {
  value: string
  label: string
  hint: string
}

export interface ProviderInfo {
  id: Provider
  label: string
  keyPlaceholder: string
  keyHelpText: string
  models: ModelOption[]
  defaultModel: string
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'anthropic',
    label: 'Claude (Anthropic)',
    keyPlaceholder: 'sk-ant-...',
    keyHelpText: 'From console.anthropic.com',
    defaultModel: 'claude-opus-4-8',
    models: [
      {
        value: 'claude-opus-4-8',
        label: 'Claude Opus 4.8',
        hint: 'Most capable — best quality tailoring (recommended)',
      },
      {
        value: 'claude-sonnet-5',
        label: 'Claude Sonnet 5',
        hint: 'Faster and cheaper, still very strong',
      },
      {
        value: 'claude-haiku-4-5',
        label: 'Claude Haiku 4.5',
        hint: 'Fastest and cheapest',
      },
    ],
  },
  {
    id: 'openai',
    label: 'ChatGPT (OpenAI)',
    keyPlaceholder: 'sk-...',
    keyHelpText: 'From platform.openai.com',
    defaultModel: 'gpt-5.6-sol',
    models: [
      {
        value: 'gpt-5.6-sol',
        label: 'GPT-5.6 Sol',
        hint: 'Most capable — best quality tailoring (recommended)',
      },
      {
        value: 'gpt-5.6-terra',
        label: 'GPT-5.6 Terra',
        hint: 'Balanced quality and cost',
      },
      {
        value: 'gpt-5.6-luna',
        label: 'GPT-5.6 Luna',
        hint: 'Fastest and cheapest',
      },
    ],
  },
  {
    id: 'google',
    label: 'Gemini (Google)',
    keyPlaceholder: 'AIza...',
    keyHelpText: 'From aistudio.google.com/apikey',
    defaultModel: 'gemini-3.5-flash',
    models: [
      {
        value: 'gemini-3.5-flash',
        label: 'Gemini 3.5 Flash',
        hint: 'Most capable stable model — best quality tailoring (recommended)',
      },
      {
        value: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        hint: 'Strong alternative, deeper reasoning',
      },
      {
        value: 'gemini-3.1-flash-lite',
        label: 'Gemini 3.1 Flash Lite',
        hint: 'Fastest and cheapest',
      },
    ],
  },
  {
    id: 'groq',
    label: 'Groq',
    keyPlaceholder: 'gsk_...',
    keyHelpText: 'From console.groq.com/keys',
    defaultModel: 'openai/gpt-oss-120b',
    models: [
      {
        value: 'openai/gpt-oss-120b',
        label: 'GPT-OSS 120B',
        hint: 'Most capable — best quality tailoring (recommended)',
      },
      {
        value: 'llama-3.3-70b-versatile',
        label: 'Llama 3.3 70B Versatile',
        hint: 'Strong all-rounder',
      },
      {
        value: 'llama-3.1-8b-instant',
        label: 'Llama 3.1 8B Instant',
        hint: 'Fastest and cheapest',
      },
    ],
  },
]

export function getProviderInfo(id: Provider): ProviderInfo {
  const info = PROVIDERS.find((p) => p.id === id)
  if (!info) throw new Error(`Unknown provider: ${id}`)
  return info
}
