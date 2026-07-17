import Anthropic from '@anthropic-ai/sdk'
import {
  SYSTEM_PROMPT,
  buildUserMessage,
  stripCodeFences,
  MAX_OUTPUT_TOKENS,
  describeFallbackError,
  type TailorResumeOptions,
} from './shared'

export async function tailorResume(opts: TailorResumeOptions): Promise<string> {
  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true })

  const stream = client.messages.stream(
    {
      model: opts.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserMessage(opts.jobDescription, opts.resumeLatex) },
      ],
    },
    { signal: opts.signal },
  )

  let fullText = ''
  stream.on('text', (delta) => {
    fullText += delta
    opts.onDelta?.(fullText)
  })

  await stream.finalMessage()
  return stripCodeFences(fullText)
}

export function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return 'Invalid API key. Check the key in Settings and try again.'
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return "This API key doesn't have permission to use this model."
  }
  if (err instanceof Anthropic.RateLimitError) {
    return 'Rate limited by the Anthropic API. Wait a moment and try again.'
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return 'Could not reach the Anthropic API. Check your internet connection.'
  }
  if (err instanceof Anthropic.APIError) {
    return `Anthropic API error (${err.status ?? 'unknown status'}): ${err.message}`
  }
  return describeFallbackError(err, 'Anthropic')
}
