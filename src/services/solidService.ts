import {
  getSolidDataset,
  getSolidDatasetWithAcl,
  getContainedResourceUrlAll,
  getResourceAcl,
  setAgentResourceAccess,
  saveAclFor,
  hasResourceAcl,
  hasAccessibleAcl,
  createAcl,
  getAgentAccessAll,
  createAclFromFallbackAcl,
  hasFallbackAcl,
} from '@inrupt/solid-client'
import type { PodFolder, Permission } from '@/types/pod.types'

type FetchFn = typeof fetch

function extractDisplayName(webId: string): string {
  try {
    const url = new URL(webId)
    const parts = url.pathname.split('/').filter(Boolean)
    return parts[0] ?? webId
  } catch {
    return webId
  }
}

export async function readPodContainers(podUrl: string, fetchFn: FetchFn): Promise<PodFolder[]> {
  try {
    const rootDataset = await getSolidDataset(podUrl, { fetch: fetchFn })
    const containerUrls = getContainedResourceUrlAll(rootDataset).filter((url) => url.endsWith('/'))

    const folders = await Promise.allSettled(
      containerUrls.map(async (url) => {
        const name = url.replace(podUrl, '').replace(/\/$/, '')
        const access = await readAclForContainer(url, fetchFn)
        return { name, path: url, url, currentAccess: access } satisfies PodFolder
      }),
    )

    return folders
      .filter((r): r is PromiseFulfilledResult<PodFolder> => r.status === 'fulfilled')
      .map((r) => r.value)
  } catch {
    return []
  }
}

export async function readAclForContainer(containerUrl: string, fetchFn: FetchFn): Promise<Permission[]> {
  try {
    const dataset = await getSolidDatasetWithAcl(containerUrl, { fetch: fetchFn })
    const agentAccess = getAgentAccessAll(dataset)
    if (!agentAccess) return []
    return Object.entries(agentAccess).map(([webId, modes]) => ({
      webId,
      displayName: extractDisplayName(webId),
      modes: Object.entries(modes ?? {})
        .filter(([, v]) => v)
        .map(([k]) => k) as Permission['modes'],
      expiry: null,
      grantedAt: null,
    }))
  } catch {
    return []
  }
}

export async function grantAccess(
  containerUrl: string,
  webId: string,
  modes: { read?: boolean; write?: boolean; control?: boolean },
  fetchFn: FetchFn,
): Promise<void> {
  const dataset = await getSolidDatasetWithAcl(containerUrl, { fetch: fetchFn })

  if (!hasAccessibleAcl(dataset)) throw new Error('ACL is not accessible for this resource')

  let acl: ReturnType<typeof createAcl>
  if (hasResourceAcl(dataset)) {
    acl = getResourceAcl(dataset)
  } else if (hasFallbackAcl(dataset)) {
    acl = createAclFromFallbackAcl(dataset)
  } else {
    acl = createAcl(dataset)
  }

  const updatedAcl = setAgentResourceAccess(acl, webId, {
    read: modes.read ?? false,
    write: modes.write ?? false,
    control: modes.control ?? false,
    append: false,
  })

  await saveAclFor(dataset, updatedAcl, { fetch: fetchFn })
}

export async function revokeAccess(containerUrl: string, webId: string, fetchFn: FetchFn): Promise<void> {
  await grantAccess(containerUrl, webId, { read: false, write: false, control: false }, fetchFn)
}

export async function revokeAllAccess(folders: PodFolder[], fetchFn: FetchFn): Promise<void> {
  await Promise.allSettled(
    folders.flatMap((folder) =>
      folder.currentAccess.map((permission) => revokeAccess(folder.url, permission.webId, fetchFn)),
    ),
  )
}

export async function ensureContainer(containerUrl: string, fetchFn: FetchFn): Promise<void> {
  const head = await fetchFn(containerUrl, { method: 'HEAD' })
  if (head.ok) return

  const res = await fetchFn(containerUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/turtle',
      'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
    },
    body: '',
  })

  if (!res.ok && res.status !== 409) {
    throw new Error(`Could not create folder: ${res.status} ${res.statusText}`)
  }
}

export async function uploadFileToPod(containerUrl: string, file: File, fetchFn: FetchFn): Promise<string> {
  const safeName = file.name.replace(/\s+/g, '_')
  const fileUrl = `${containerUrl}${encodeURIComponent(safeName)}`
  const res = await fetchFn(fileUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`)
  return fileUrl
}
