import { useCallback } from 'react'
import { grantAccess, revokeAccess, revokeAllAccess } from '@/services/solidService'
import type { ParsedOperation } from '@/types/claude.types'
import type { PodFolder } from '@/types/pod.types'

interface UsePermissionsReturn {
  executeOperation: (
    operation: ParsedOperation,
    webIdOverride: string | null,
    folders: PodFolder[],
    fetchFn: typeof fetch,
  ) => Promise<void>
}

export function usePermissions(): UsePermissionsReturn {
  const executeOperation = useCallback(
    async (
      operation: ParsedOperation,
      webIdOverride: string | null,
      folders: PodFolder[],
      fetchFn: typeof fetch,
    ) => {
      const webId = webIdOverride ?? operation.webId

      if (operation.operation === 'emergency') {
        await revokeAllAccess(folders, fetchFn)
        return
      }

      if (!operation.target) throw new Error('No target specified')

      if (operation.operation === 'grant') {
        if (!webId) throw new Error('No WebID specified for grant')
        await grantAccess(
          operation.target,
          webId,
          { read: operation.modes.includes('read'), write: operation.modes.includes('write') },
          fetchFn,
        )
        return
      }

      if (operation.operation === 'revoke') {
        if (webId) {
          await revokeAccess(operation.target, webId, fetchFn)
        } else {
          const folder = folders.find((f) => f.url === operation.target)
          if (folder) {
            await revokeAllAccess([folder], fetchFn)
          }
        }
        return
      }
      // query — no write operation
    },
    [],
  )

  return { executeOperation }
}
