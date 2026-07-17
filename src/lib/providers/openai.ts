import OpenAI from 'openai'
import {
  SYSTEM_PROMPT,
  buildUserMessage,
  stripCodeFences,
  MAX_OUTPUT_TOKENS,
  describeFallbackError,
  type TailorResumeOptions,
} from './shared'

export async function tailorResume(opts: TailorResumeOptions): Promise<string> {
  const client = new OpenAI({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true })

  const stream = await client.chat.completions.create(
    {
      model: opts.model,
      // max_tokens is deprecated on newer models in favor of max_completion_tokens
      max_completion_tokens: MAX_OUTPUT_TOKENS,
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
  if (err instanceof OpenAI.AuthenticationError) {
    return 'Invalid API key. Check the key in Settings and try again.'
  }
  if (err instanceof OpenAI.PermissionDeniedError) {
    return "This API key doesn't have permission to use this model."
  }
  if (err instanceof OpenAI.RateLimitError) {
    return 'Rate limited by the OpenAI API. Wait a moment and try again.'
  }
  if (err instanceof OpenAI.APIConnectionError) {
    return 'Could not reach the OpenAI API. Check your internet connection.'
  }
  if (err instanceof OpenAI.APIError) {
    return `OpenAI API error (${err.status ?? 'unknown status'}): ${err.message}`
  }
  return describeFallbackError(err, 'OpenAI')
}
