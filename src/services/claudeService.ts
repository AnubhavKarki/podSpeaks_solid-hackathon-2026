import type { ClaudePayload, ParsedOperation } from '@/types/claude.types'
import { CLAUDE_SYSTEM_PROMPT } from '@/constants/prompts'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

export async function parseIntent(payload: ClaudePayload): Promise<ParsedOperation> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY
  if (!apiKey) throw new Error('VITE_CLAUDE_API_KEY is not set')

  const userMessage = JSON.stringify({
    instruction: payload.instruction,
    podStructure: {
      podUrl: payload.podStructure.podUrl,
      folders: payload.podStructure.folders.map((f) => ({
        name: f.name,
        path: f.path,
        currentAccess: f.currentAccess.map((a) => ({ webId: a.webId, modes: a.modes })),
      })),
    },
  })

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error ${response.status}: ${err}`)
  }

  const data = (await response.json()) as { content: Array<{ type: string; text: string }> }
  const text = data.content.find((c) => c.type === 'text')?.text ?? ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude returned no valid JSON')

  return JSON.parse(jsonMatch[0]) as ParsedOperation
}
