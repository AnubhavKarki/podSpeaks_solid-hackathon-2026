import type { PodFolder } from '@/types/pod.types'
import type { AuditEntry } from '@/types/audit.types'

const BASE = 'https://pods.d01.solidcommunity.au/anubhav/'

export const DEMO_FOLDERS: PodFolder[] = [
  {
    name: 'health',
    path: '/anubhav/health/',
    url: `${BASE}health/`,
    currentAccess: [
      { webId: 'https://dr-smith.solidcommunity.net/profile/card#me', displayName: 'Dr. Smith', modes: ['read'], expiry: null, grantedAt: new Date('2024-03-01') },
      { webId: 'https://cityclinic.solidcommunity.net/profile/card#me', displayName: 'City Clinic', modes: ['read', 'write'], expiry: new Date(Date.now() + 30 * 86400000), grantedAt: new Date('2024-01-15') },
    ],
  },
  {
    name: 'financial',
    path: '/anubhav/financial/',
    url: `${BASE}financial/`,
    currentAccess: [
      { webId: 'https://taxagent.solidcommunity.net/profile/card#me', displayName: 'Tax Agent', modes: ['read'], expiry: new Date(Date.now() + 4 * 86400000), grantedAt: new Date('2024-06-01') },
    ],
  },
  {
    name: 'legal',
    path: '/anubhav/legal/',
    url: `${BASE}legal/`,
    currentAccess: [],
  },
  {
    name: 'documents',
    path: '/anubhav/documents/',
    url: `${BASE}documents/`,
    currentAccess: [
      { webId: 'https://alice.solidcommunity.net/profile/card#me', displayName: 'Alice Chen', modes: ['read'], expiry: null, grantedAt: new Date('2024-02-20') },
    ],
  },
  {
    name: 'family',
    path: '/anubhav/family/',
    url: `${BASE}family/`,
    currentAccess: [
      { webId: 'https://mum.solidcommunity.net/profile/card#me', displayName: 'Mum', modes: ['read'], expiry: null, grantedAt: null },
      { webId: 'https://dad.solidcommunity.net/profile/card#me', displayName: 'Dad', modes: ['read'], expiry: null, grantedAt: null },
      { webId: 'https://sister.solidcommunity.net/profile/card#me', displayName: 'Sister', modes: ['read', 'write'], expiry: null, grantedAt: null },
    ],
  },
  {
    name: 'work',
    path: '/anubhav/work/',
    url: `${BASE}work/`,
    currentAccess: [
      { webId: 'https://manager.solidcommunity.net/profile/card#me', displayName: 'Manager', modes: ['read', 'write'], expiry: new Date(Date.now() + 90 * 86400000), grantedAt: new Date('2024-05-01') },
    ],
  },
]

const now = Date.now()

export const DEMO_AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 'demo-1',
    timestamp: new Date(now - 3 * 60 * 1000),
    instruction: 'Who can access my health records?',
    action: 'query',
    target: `${BASE}health/`,
    targetName: 'health',
    webId: null,
    confirmationMessage: 'Dr. Smith has permanent read access. City Clinic has read & write access expiring in 30 days.',
  },
  {
    id: 'demo-2',
    timestamp: new Date(now - 18 * 60 * 1000),
    instruction: 'Give Alice read access to my documents',
    action: 'grant',
    target: `${BASE}documents/`,
    targetName: 'documents',
    webId: 'https://alice.solidcommunity.net/profile/card#me',
    confirmationMessage: 'Granted Alice Chen read access to documents.',
  },
  {
    id: 'demo-3',
    timestamp: new Date(now - 2 * 3600 * 1000),
    instruction: 'Remove the tax agent from financial after tax season',
    action: 'revoke',
    target: `${BASE}financial/`,
    targetName: 'financial',
    webId: 'https://taxagent.solidcommunity.net/profile/card#me',
    confirmationMessage: 'Scheduled revoke of Tax Agent access to financial (expiring in 4 days).',
  },
  {
    id: 'demo-4',
    timestamp: new Date(now - 24 * 3600 * 1000),
    instruction: 'Who has access to my legal documents?',
    action: 'query',
    target: `${BASE}legal/`,
    targetName: 'legal',
    webId: null,
    confirmationMessage: 'No one currently has access to your legal folder — only you.',
  },
  {
    id: 'demo-5',
    timestamp: new Date(now - 3 * 24 * 3600 * 1000),
    instruction: 'Revoke all access immediately',
    action: 'emergency',
    target: null,
    targetName: 'All folders',
    webId: null,
    confirmationMessage: 'Emergency revoke executed — all external access removed across all folders.',
  },
]
