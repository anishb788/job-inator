# `src/lib/providers/`

One module per AI provider, all conforming to the same shape, plus shared plumbing in `shared.ts`
and a lazy-loading dispatcher in `index.ts`.

## `shared.ts`

Common pieces used by every provider implementation.

### `SYSTEM_PROMPT: string`

The full system prompt sent to every provider's model. Instructs the model to:
1. Extract job-title/skills/responsibilities/tools/soft-skills/domain keywords from the job
   description.
2. For each keyword, strengthen/reorder existing resume content that supports it, add a truthful
   connecting sentence for transferable-but-unstated experience, and never fabricate employers,
   titles, dates, skills, or accomplishments not grounded in the source resume.
3. Reorganize the resume (most relevant experience first, a new keyword-driven summary, stronger
   measurable-impact phrasing).
4. Restrict output to a specific safe LaTeX subset (documented in full inline): only
   `\documentclass[11pt]{article}` + `\pagestyle{empty}` in the preamble (no `\usepackage`, no
   `\newcommand`/`\renewcommand`), `\section*{...}`, `center` blocks, `\textbf`/`\textit`/`{\Huge
   \bfseries ...}`, `itemize`/`\item`, `---`/`--` separators, `\\` line breaks, no `\hfill`/`\rule`.
5. Output ONLY the LaTeX source (no markdown fences, no commentary).

This prompt is the reason both `DEFAULT_RESUME_LATEX` and every provider's tailored output stay
renderable by `latexCompiler.ts` — see `docs/architecture.md`'s "LaTeX rendering constraints".

### `buildUserMessage(jobDescription: string, resumeLatex: string): string`

Formats the per-request user message as:
```
JOB DESCRIPTION:
<jobDescription.trim()>

CURRENT RESUME (LaTeX source):
<resumeLatex.trim()>
```

### `stripCodeFences(text: string): string`

Trims `text` and strips a single leading ```` ```latex ````/```` ```tex ````/```` ``` ```` fence
and a single trailing ```` ``` ```` fence (case-insensitive), in case a model wraps its output in
markdown despite the prompt's instructions not to.

### `MAX_OUTPUT_TOKENS = 8000`

Token cap passed to every provider's completion/generation call.

### `TailorResumeOptions`

```ts
interface TailorResumeOptions {
  apiKey: string
  model: string
  jobDescription: string
  resumeLatex: string
  onDelta?: (fullTextSoFar: string) => void  // called as tokens stream in
  signal?: AbortSignal
}
```

The options object every provider's `tailorResume` accepts. `onDelta` is called with the
accumulated text so far on every streamed chunk (not just the new chunk), which is what lets
`OptimizerPage` show a live "typing" preview.

### `describeFallbackError(err: unknown, providerLabel: string): string`

Last-resort error mapper, meant to be called after each provider's own `instanceof
<SDK-specific-error>` checks (since those error classes are themselves `Error` subclasses and
would otherwise be caught by a generic `instanceof Error` check first). Maps:
- `DOMException` with `name === 'AbortError'` → `'Cancelled.'`
- Any other `Error` → `err.message`
- Anything else → `` `Something went wrong while contacting ${providerLabel}.` ``

## `index.ts` — provider dispatcher

### `LOADERS: Record<Provider, () => Promise<ProviderImpl>>`

Maps each `Provider` id to a dynamic `import()` of its module. Each provider's SDK is a
non-trivial dependency, so only the selected provider's module (and its SDK) is pulled into the
bundle at runtime instead of bundling all four upfront.

### `tailorResume(provider: Provider, opts: TailorResumeOptions): Promise<string>`

Lazy-loads the selected provider's module via `LOADERS` and delegates to its `tailorResume(opts)`.

### `describeProviderError(provider: Provider, err: unknown): Promise<string>`

Lazy-loads the selected provider's module and delegates to its `describeError(err)`.

## Per-provider modules

Each of `anthropic.ts`, `openai.ts`, `google.ts`, and `groq.ts` exports the same two functions and
follows the same pattern: instantiate the SDK client with the user-supplied `apiKey` (with
browser use explicitly allowed, since there's no backend proxy), stream a completion using
`SYSTEM_PROMPT` + `buildUserMessage(...)`, forward each chunk's accumulated text to `onDelta`, and
return `stripCodeFences(fullText)`.

### `anthropic.ts` (Claude)

- `tailorResume`: uses `@anthropic-ai/sdk`'s `client.messages.stream({ model, max_tokens:
  MAX_OUTPUT_TOKENS, system: SYSTEM_PROMPT, messages: [...] }, { signal })`, accumulating text via
  the stream's `'text'` event, then awaits `stream.finalMessage()`.
- `describeError`: maps `Anthropic.AuthenticationError` → invalid API key,
  `Anthropic.PermissionDeniedError` → no model permission, `Anthropic.RateLimitError` → rate
  limited, `Anthropic.APIConnectionError` → connection failure, `Anthropic.APIError` → generic
  `Anthropic API error (<status>): <message>`, else `describeFallbackError(err, 'Anthropic')`.

### `openai.ts` (ChatGPT)

- `tailorResume`: uses `openai`'s `client.chat.completions.create({ model,
  max_completion_tokens: MAX_OUTPUT_TOKENS, stream: true, messages: [system, user] }, { signal })`
  and iterates the async stream, reading `chunk.choices[0]?.delta?.content`. Note: uses
  `max_completion_tokens` rather than the deprecated `max_tokens` param (per inline comment).
- `describeError`: same mapping pattern as Anthropic, using `OpenAI.AuthenticationError` /
  `PermissionDeniedError` / `RateLimitError` / `APIConnectionError` / `APIError`, else
  `describeFallbackError(err, 'OpenAI')`.

### `google.ts` (Gemini)

- `tailorResume`: uses `@google/genai`'s `client.models.generateContentStream({ model, contents:
  buildUserMessage(...), config: { systemInstruction: SYSTEM_PROMPT, maxOutputTokens:
  MAX_OUTPUT_TOKENS, abortSignal } })` and iterates the stream reading `chunk.text`. Note this SDK
  takes the system prompt as `config.systemInstruction` rather than a `system`-role message, and
  the whole job description + resume as a single `contents` string rather than a message array.
- `describeError`: the Google GenAI SDK exposes a single `ApiError` class with a numeric
  `.status` (no typed error subclasses per-failure-mode, unlike the other three SDKs) — maps
  status `401`/`403` → invalid API key, `429` → rate limited, else generic `Gemini API error
  (<status>): <message>`; falls back to `describeFallbackError(err, 'Gemini')` for non-`ApiError`
  errors.

### `groq.ts`

- `tailorResume`: uses `groq-sdk`'s `client.chat.completions.create({ model, max_tokens:
  MAX_OUTPUT_TOKENS, stream: true, messages: [system, user] }, { signal })`, same streaming
  pattern as `openai.ts`.
- `describeError`: same mapping pattern as Anthropic/OpenAI using `Groq.AuthenticationError` /
  `PermissionDeniedError` / `RateLimitError` / `APIConnectionError` / `APIError`, else
  `describeFallbackError(err, 'Groq')`.
