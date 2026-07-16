export interface Permission {
  webId: string
  displayName: string
  modes: ('read' | 'write' | 'control')[]
  expiry: Date | null
  grantedAt: Date | null
}

export interface PodFolder {
  name: string
  path: string
  url: string
  currentAccess: Permission[]
}

export interface PodStructure {
  podUrl: string
  webId: string
  folders: PodFolder[]
}
