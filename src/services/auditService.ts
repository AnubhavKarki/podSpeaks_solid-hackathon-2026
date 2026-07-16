import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  buildThing,
  createThing,
  setThing,
  getStringNoLocale,
  getThingAll,
  getContainedResourceUrlAll,
} from '@inrupt/solid-client'
import { SCHEMA_INRUPT } from '@inrupt/vocab-common-rdf'
import { deriveKey, encryptText, decryptText } from './cryptoService'
import type { AuditEntry, AuditAction } from '@/types/audit.types'

type FetchFn = typeof fetch

const LOG_CONTAINER = 'podspeaks/log/'

interface SerializedEntry {
  id: string
  timestamp: string
  instruction: string
  action: AuditAction
  target: string | null
  targetName: string
  webId: string | null
  confirmationMessage: string
}

function logUrl(podUrl: string, id: string): string {
  return `${podUrl}${LOG_CONTAINER}${id}.ttl`
}

export async function writeAuditEntry(entry: AuditEntry, podUrl: string, fetchFn: FetchFn, ownerWebId?: string): Promise<void> {
  const serialized: SerializedEntry = {
    ...entry,
    timestamp: entry.timestamp.toISOString(),
  }

  let payload: string
  if (ownerWebId) {
    try {
      const key = await deriveKey(ownerWebId)
      payload = await encryptText(key, JSON.stringify(serialized))
    } catch {
      payload = JSON.stringify(serialized)
    }
  } else {
    payload = JSON.stringify(serialized)
  }

  const thing = buildThing(createThing({ name: 'entry' }))
    .addStringNoLocale(SCHEMA_INRUPT.description, payload)
    .build()

  const dataset = setThing(createSolidDataset(), thing)
  await saveSolidDatasetAt(logUrl(podUrl, entry.id), dataset, { fetch: fetchFn })
}

export async function readAuditLog(podUrl: string, fetchFn: FetchFn, ownerWebId?: string): Promise<AuditEntry[]> {
  let key: CryptoKey | null = null
  if (ownerWebId) {
    try { key = await deriveKey(ownerWebId) } catch { /* no decryption */ }
  }

  try {
    const containerUrl = `${podUrl}${LOG_CONTAINER}`
    const container = await getSolidDataset(containerUrl, { fetch: fetchFn })
    const fileUrls = getContainedResourceUrlAll(container).filter((u) => u.endsWith('.ttl'))

    const results = await Promise.allSettled(
      fileUrls.map(async (fileUrl) => {
        const ds = await getSolidDataset(fileUrl, { fetch: fetchFn })
        const things = getThingAll(ds)
        const thing = things[0]
        if (!thing) return null
        const raw = getStringNoLocale(thing, SCHEMA_INRUPT.description)
        if (!raw) return null

        let jsonString = raw
        if (key) {
          try { jsonString = await decryptText(key, raw) } catch { /* fallback: try raw JSON */ }
        }

        const parsed = JSON.parse(jsonString) as SerializedEntry
        return { ...parsed, timestamp: new Date(parsed.timestamp) } satisfies AuditEntry
      }),
    )

    return results
      .filter((r): r is PromiseFulfilledResult<AuditEntry | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((e): e is AuditEntry => e !== null)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  } catch {
    return []
  }
}

export function buildAuditEntry(
  instruction: string,
  action: AuditAction,
  confirmationMessage: string,
  target: string | null,
  targetName: string,
  webId: string | null,
): AuditEntry {
  return {
    id: `${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    instruction,
    action,
    target,
    targetName,
    webId,
    confirmationMessage,
  }
}
