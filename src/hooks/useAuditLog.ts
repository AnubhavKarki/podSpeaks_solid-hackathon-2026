import { useState, useCallback } from 'react'
import { writeAuditEntry, readAuditLog, buildAuditEntry } from '@/services/auditService'
import type { AuditEntry, AuditAction } from '@/types/audit.types'

interface UseAuditLogReturn {
  entries: AuditEntry[]
  isLoading: boolean
  seedEntries: (entries: AuditEntry[]) => void
  load: (podUrl: string, fetchFn: typeof fetch, ownerWebId?: string) => Promise<void>
  addEntry: (
    instruction: string,
    action: AuditAction,
    confirmationMessage: string,
    target: string | null,
    targetName: string,
    webId: string | null,
    podUrl: string,
    fetchFn: typeof fetch,
    ownerWebId?: string,
  ) => Promise<void>
}

export function useAuditLog(): UseAuditLogReturn {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const seedEntries = useCallback((seed: AuditEntry[]) => {
    setEntries(seed)
  }, [])

  const load = useCallback(async (podUrl: string, fetchFn: typeof fetch, ownerWebId?: string) => {
    setIsLoading(true)
    try {
      const log = await readAuditLog(podUrl, fetchFn, ownerWebId)
      // Prepend real Pod entries on top of the seeded demo entries
      if (log.length > 0) {
        setEntries((prev) => {
          const existingIds = new Set(log.map((e) => e.id))
          return [...log, ...prev.filter((e) => !existingIds.has(e.id))]
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addEntry = useCallback(
    async (
      instruction: string,
      action: AuditAction,
      confirmationMessage: string,
      target: string | null,
      targetName: string,
      webId: string | null,
      podUrl: string,
      fetchFn: typeof fetch,
      ownerWebId?: string,
    ) => {
      const entry = buildAuditEntry(instruction, action, confirmationMessage, target, targetName, webId)
      setEntries((prev) => [entry, ...prev])
      try {
        await writeAuditEntry(entry, podUrl, fetchFn, ownerWebId)
      } catch {
        // Audit write is best-effort; don't block the UI
      }
    },
    [],
  )

  return { entries, isLoading, seedEntries, load, addEntry }
}
