import type { Permission } from './pod.types'

export type OperationType = 'grant' | 'revoke' | 'query' | 'emergency'

export interface ParsedOperation {
  operation: OperationType
  target: string | null
  targetName: string
  webId: string | null
  webIdNeeded: boolean
  modes: string[]
  expiry: string | null
  confirmationMessage: string
  clarificationNeeded: string | null
}

export interface ClaudePayload {
  instruction: string
  podStructure: {
    podUrl: string
    folders: Array<{
      name: string
      path: string
      currentAccess: Permission[]
    }>
  }
}
