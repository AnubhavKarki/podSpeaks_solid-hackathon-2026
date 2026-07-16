import { useState, useCallback } from 'react'
import { parseIntent } from '@/services/claudeService'
import type { ParsedOperation, ClaudePayload } from '@/types/claude.types'

type IntentState = 'idle' | 'loading' | 'clarification' | 'ready' | 'executing' | 'complete' | 'error'

interface UseClaudeIntentReturn {
  state: IntentState
  operation: ParsedOperation | null
  lastInstruction: string
  error: string | null
  submit: (payload: ClaudePayload) => Promise<ParsedOperation | null>
  reset: () => void
  setExecuting: () => void
  setComplete: () => void
}

export function useClaudeIntent(): UseClaudeIntentReturn {
  const [state, setState] = useState<IntentState>('idle')
  const [operation, setOperation] = useState<ParsedOperation | null>(null)
  const [lastInstruction, setLastInstruction] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (payload: ClaudePayload): Promise<ParsedOperation | null> => {
    setState('loading')
    setError(null)
    setOperation(null)
    setLastInstruction(payload.instruction)
    try {
      const parsed = await parseIntent(payload)
      setOperation(parsed)
      setState(parsed.clarificationNeeded ? 'clarification' : 'ready')
      return parsed
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse instruction')
      setState('error')
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setOperation(null)
    setError(null)
  }, [])

  const setExecuting = useCallback(() => setState('executing'), [])
  const setComplete = useCallback(() => setState('complete'), [])

  return { state, operation, lastInstruction, error, submit, reset, setExecuting, setComplete }
}
