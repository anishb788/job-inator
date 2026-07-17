import Groq from 'groq-sdk'
import {
  SYSTEM_PROMPT,
  buildUserMessage,
  stripCodeFences,
  MAX_OUTPUT_TOKENS,
  describeFallbackError,
  type TailorResumeOptions,
} from './shared'

export async function tailorResume(opts: TailorResumeOptions): Promise<string> {
  const client = new Groq({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true })

  const stream = await client.chat.completions.create(
    {
      model: opts.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(opts.jobDescription, opts.resumeLatex) },
      ],
    },
    { signal: opts.signal },
  )

  let fullText = ''
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? ''
    if (delta) {
      fullText += delta
      opts.onDelta?.(fullText)
    }
  }

  return stripCodeFences(fullText)
}

export function describeError(err: unknown): string {
  if (err instanceof Groq.AuthenticationError) {
    return 'Invalid API key. Check the key in Settings and try again.'
  }
  if (err instanceof Groq.PermissionDeniedError) {
    return "This API key doesn't have permission to use this model."
  }
  if (err instanceof Groq.RateLimitError) {
    return 'Rate limited by the Groq API. Wait a moment and try again.'
  }
  if (err instanceof Groq.APIConnectionError) {
    return 'Could not reach the Groq API. Check your internet connection.'
  }
  if (err instanceof Groq.APIError) {
    return `Groq API error (${err.status ?? 'unknown status'}): ${err.message}`
  }
  return describeFallbackError(err, 'Groq')
}
