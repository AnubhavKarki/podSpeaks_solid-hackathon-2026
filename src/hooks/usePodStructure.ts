import { useState, useCallback } from 'react'
import { readPodContainers } from '@/services/solidService'
import type { PodStructure } from '@/types/pod.types'

interface UsePodStructureReturn {
  podStructure: PodStructure | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePodStructure(podUrl: string, webId: string, fetchFn: typeof fetch | null): UsePodStructureReturn {
  const [podStructure, setPodStructure] = useState<PodStructure | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!fetchFn || !podUrl) return
    setIsLoading(true)
    setError(null)
    try {
      const folders = await readPodContainers(podUrl, fetchFn)
      setPodStructure({ podUrl, webId, folders })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Pod structure')
    } finally {
      setIsLoading(false)
    }
  }, [podUrl, webId, fetchFn])

  return { podStructure, isLoading, error, refresh }
}
