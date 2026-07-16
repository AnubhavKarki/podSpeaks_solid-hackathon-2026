# PodSpeaks — Technical Architecture

## Stack

- React + TypeScript + Vite (already scaffolded)
- @inrupt/solid-client — Pod read/write operations
- @inrupt/solid-client-authn-browser — Solid OIDC authentication
- Anthropic Claude API (claude-sonnet-4-6) — intent parsing
- No backend server. Everything is client-side + Pod.

## Environment variables required

```
VITE_CLAUDE_API_KEY=your_anthropic_api_key
VITE_SOLID_ISSUER=https://pods.d01.solidcommunity.au
```

## Data flow

```
User types instruction
        ↓
buildClaudePayload(instruction, podStructure)
        ↓
Claude API receives: { instruction, folders: [{name, path, currentPermissions}] }
Claude API NEVER receives: file contents, personal data
        ↓
Claude returns: ParsedOperation (JSON)
        ↓
executeOperation(parsedOperation, session)
        ↓
inrupt writes ACL to Pod
        ↓
writeAuditLog(operation, session)
        ↓
inrupt writes log entry to /podspeaks/log/ in Pod
        ↓
refreshPodState() — re-reads Pod structure and ACLs
        ↓
UI updates in real time
```

## Solid operations

### 1. Read Pod structure on login
```typescript
// Read the root containers in the Pod
getSolidDataset(podUrl, { fetch: session.fetch })
// Returns list of containers (folders)
```

### 2. Read ACL for each container
```typescript
// Get current access control list
getResourceAcl(dataset)
// Returns who has what access to each folder
```

### 3. Write ACL after Claude operation
```typescript
// Grant access
setAgentResourceAccess(resourceAcl, webId, { read: true, write: false })
saveAclFor(dataset, updatedAcl, { fetch: session.fetch })

// Revoke access
setAgentResourceAccess(resourceAcl, webId, { read: false, write: false })
saveAclFor(dataset, updatedAcl, { fetch: session.fetch })
```

### 4. Write audit log entry
```typescript
// Write a Turtle file to /podspeaks/log/{timestamp}.ttl
const logEntry = buildThing(createThing())
  .addStringNoLocale(SCHEMA_INRUPT.description, logText)
  .addDatetime(SCHEMA_INRUPT.dateCreated, new Date())
  .build()

saveSolidDatasetAt(logUrl, setThing(createSolidDataset(), logEntry), { fetch: session.fetch })
```

## Claude API payload structure

### What we send
```json
{
  "instruction": "Give my GP access to my health folder for two weeks",
  "podStructure": {
    "podUrl": "https://pods.d01.solidcommunity.au/anubhav/",
    "folders": [
      {
        "name": "health",
        "path": "https://pods.d01.solidcommunity.au/anubhav/health/",
        "currentAccess": [
          { "webId": "https://example.com/profile#me", "modes": ["read"] }
        ]
      },
      {
        "name": "finance",
        "path": "https://pods.d01.solidcommunity.au/anubhav/finance/",
        "currentAccess": []
      }
    ]
  }
}
```

### What Claude returns
```json
{
  "operation": "grant",
  "target": "https://pods.d01.solidcommunity.au/anubhav/health/",
  "targetName": "health",
  "webId": null,
  "webIdNeeded": true,
  "modes": ["read"],
  "expiry": "2026-07-28T00:00:00Z",
  "confirmationMessage": "Ready to grant read access to your health folder until 28 July 2026. Please provide your GP's WebID to proceed.",
  "clarificationNeeded": "What is your GP's WebID or Pod URL?",
  "operationType": "grant | revoke | query | emergency"
}
```

### Claude system prompt
```
You are an intent parser for PodSpeaks, a Solid Pod permission manager.

The user will give you a natural language instruction about their data permissions.
You will receive their Pod structure showing folder names and current access.

Return ONLY valid JSON matching this schema:
{
  "operation": "grant" | "revoke" | "query" | "emergency",
  "target": "full Pod URL of the target folder or null for all",
  "targetName": "human readable folder name",
  "webId": "WebID of the person to grant/revoke, or null if unknown",
  "webIdNeeded": true | false,
  "modes": ["read"] | ["read", "write"] | [],
  "expiry": "ISO date string or null for permanent",
  "confirmationMessage": "Plain English description of what will happen",
  "clarificationNeeded": "Question to ask if more info is needed, or null"
}

CRITICAL RULES:
- Never invent WebIDs. If a person is mentioned but no WebID is known, set webIdNeeded: true
- For emergency/revoke-all, set target to null and operation to "emergency"
- For query operations, do not return an operation that modifies anything
- Always write confirmationMessage in friendly plain English
- Return only JSON. No markdown, no explanation, no preamble.
```

## File structure within the app

```
src/
  components/
    auth/
      LoginScreen.tsx          — Full screen Solid login
    dashboard/
      PodMap.tsx               — Left panel: folder cards with permission badges
      CommandBar.tsx           — Centre: text input + response area
      AuditLog.tsx             — Right panel: chronological action history
      FolderCard.tsx           — Individual folder node card
      PermissionBadge.tsx      — Who has access indicator
    ui/
      ParticleField.tsx        — Background ambient animation
      GlowingOrb.tsx           — Decorative ambient element
      AnimatedResponse.tsx     — Typewriter-style Claude response display
  hooks/
    useSolidSession.ts         — Solid auth session management
    usePodStructure.ts         — Read Pod containers and ACLs
    useClaudeIntent.ts         — Send instruction to Claude, receive operation
    usePermissions.ts          — Execute ACL operations on Pod
    useAuditLog.ts             — Read and write audit log to Pod
  services/
    solidService.ts            — All inrupt library calls
    claudeService.ts           — Claude API calls
    aclService.ts              — ACL read/write helpers
    auditService.ts            — Audit log read/write
  types/
    pod.types.ts               — PodStructure, Folder, Permission types
    claude.types.ts            — ParsedOperation, ClaudePayload types
    audit.types.ts             — AuditEntry types
  constants/
    prompts.ts                 — Claude system prompt
    exampleInstructions.ts     — Example prompt chips
```

## Session and state management

Use React Context for the Solid session. Every component that needs to read/write the Pod accesses `useSolidSession()`.

Pod structure is fetched once on login and refreshed after every successful ACL operation.

No external state management library needed. React Context + hooks is sufficient.

## Error handling

- Solid auth failure: redirect back to login with error message
- ACL write failure: show error in command bar response area, do not update UI state
- Claude API failure: show fallback message, suggest retrying
- WebID not found: ask user to provide WebID manually via a follow-up input
- Expired permissions: flag on Pod load, prompt user to review

## Deployment

Vite static build deployable to Vercel, Netlify, or GitHub Pages.
No backend required.
The only server calls are to pods.d01.solidcommunity.au and api.anthropic.com.
