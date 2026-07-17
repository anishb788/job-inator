import { GoogleGenAI, ApiError } from '@google/genai'
import {
  SYSTEM_PROMPT,
  buildUserMessage,
  stripCodeFences,
  MAX_OUTPUT_TOKENS,
  describeFallbackError,
  type TailorResumeOptions,
} from './shared'

export async function tailorResume(opts: TailorResumeOptions): Promise<string> {
  const client = new GoogleGenAI({ apiKey: opts.apiKey })

  const stream = await client.models.generateContentStream({
    model: opts.model,
    contents: buildUserMessage(opts.jobDescription, opts.resumeLatex),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: opts.signal,
    },
  })

  let fullText = ''
  for await (const chunk of stream) {
    const delta = chunk.text ?? ''
    if (delta) {
      fullText += delta
      opts.onDelta?.(fullText)
    }
  }

  return stripCodeFences(fullText)
}

/** The Google GenAI SDK exposes one ApiError class with a numeric `.status` — no typed subclasses. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return 'Invalid API key. Check the key in Settings and try again.'
    }
    if (err.status === 429) {
      return 'Rate limited by the Gemini API. Wait a moment and try again.'
    }
    return `Gemini API error (${err.status ?? 'unknown status'}): ${err.message}`
  }
  return describeFallbackError(err, 'Gemini')
}
