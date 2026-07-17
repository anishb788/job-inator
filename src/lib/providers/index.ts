import type { Provider } from '../../types'
import type { TailorResumeOptions } from './shared'

export type { TailorResumeOptions } from './shared'

interface ProviderImpl {
  tailorResume(opts: TailorResumeOptions): Promise<string>
  describeError(err: unknown): string
}

// Each provider's SDK is a non-trivial dependency (Anthropic, OpenAI, Google
// GenAI, Groq) — lazy-load only the one the user actually selected instead of
// bundling all four into the initial page load.
const LOADERS: Record<Provider, () => Promise<ProviderImpl>> = {
  anthropic: () => import('./anthropic'),
  openai: () => import('./openai'),
  google: () => import('./google'),
  groq: () => import('./groq'),
}

export async function tailorResume(provider: Provider, opts: TailorResumeOptions): Promise<string> {
  const impl = await LOADERS[provider]()
  return impl.tailorResume(opts)
}

export async function describeProviderError(provider: Provider, err: unknown): Promise<string> {
  const impl = await LOADERS[provider]()
  return impl.describeError(err)
}
