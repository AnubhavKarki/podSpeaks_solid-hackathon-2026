export type AuditAction = 'grant' | 'revoke' | 'query' | 'emergency'

export interface AuditEntry {
  id: string
  timestamp: Date
  instruction: string
  action: AuditAction
  target: string | null
  targetName: string
  webId: string | null
  confirmationMessage: string
}
