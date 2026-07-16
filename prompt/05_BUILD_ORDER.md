# PodSpeaks — Claude Code Build Instructions

Read ALL four other documents before writing a single line of code:
- 01_VISION.md
- 02_ARCHITECTURE.md
- 03_DESIGN_SYSTEM.md
- 04_SCREENS.md

These are your complete specification. Do not deviate from them.

---

## Critical rules before you start

1. This is a TypeScript + React + Vite project. The scaffold already exists.
2. Use @inrupt/solid-client and @inrupt/solid-client-authn-browser for all Solid operations.
3. Claude API key lives in VITE_CLAUDE_API_KEY environment variable.
4. No backend server. Everything is client-side.
5. Design must match 03_DESIGN_SYSTEM.md exactly: dark theme, indigo accent, glass cards, particle field.
6. Build in the exact order listed below. Do not skip ahead.
7. After each phase, the app must be runnable with no TypeScript errors and no console errors.

---

## Phase 1: Design foundation

### What to build
Install Google Fonts (Inter + JetBrains Mono via @fontsource or CDN link in index.html).

Create `src/styles/globals.css` with all CSS custom properties from the design system:
- All color variables from 03_DESIGN_SYSTEM.md
- Base reset
- Font imports
- Body background set to --bg-primary
- Base typography applied to html/body

Create `src/styles/animations.css` with keyframe definitions:
- fadeInUp: opacity 0→1, translateY 8px→0
- pulse: scale 1→1.05→1
- breathe: scale 1→1.08→1 (slow, for orbs)
- shimmer: for skeleton loading states
- dashOffset: for animated dashed SVG lines
- dissolve: opacity 1→0 with slight blur
- emergencyFlash: brief red overlay pulse

Apply Inter and JetBrains Mono as CSS variables.

### Deliverable
App loads with black background, correct fonts applied, no visual content yet.

---

## Phase 2: Types and services

### What to build

Create all TypeScript types in `src/types/`:

**pod.types.ts**
```typescript
export interface PodFolder {
  name: string
  path: string
  url: string
  currentAccess: Permission[]
}

export interface Permission {
  webId: string
  displayName: string
  modes: ('read' | 'write' | 'control')[]
  expiry: Date | null
  grantedAt: Date | null
}

export interface PodStructure {
  podUrl: string
  webId: string
  folders: PodFolder[]
}
```

**claude.types.ts**
```typescript
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
```

**audit.types.ts**
```typescript
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
```

Create all services in `src/services/`:

**claudeService.ts** — sends instruction + pod metadata to Claude API, returns ParsedOperation. Use the system prompt from 02_ARCHITECTURE.md exactly.

**solidService.ts** — wraps inrupt calls: readPodContainers(), readAclForContainer(), grantAccess(), revokeAccess(), revokeAllAccess()

**auditService.ts** — writeAuditEntry(), readAuditLog() to /podspeaks/log/ in the Pod

Create all hooks in `src/hooks/`:
- useSolidSession.ts — wraps session from @inrupt/solid-client-authn-browser
- usePodStructure.ts — fetches Pod containers and ACLs on mount and after operations
- useClaudeIntent.ts — manages Claude API call state (idle/loading/success/error)
- usePermissions.ts — executes ACL operations, triggers pod structure refresh
- useAuditLog.ts — reads and writes audit entries

### Deliverable
All types defined. All services and hooks created with real implementations. No UI yet.

---

## Phase 3: Login screen

### What to build
Create `src/components/auth/LoginScreen.tsx`

Exact visual from 04_SCREENS.md:
- Full viewport dark background
- ParticleField component in background
- GlowingOrb component, bottom right
- Centred content: wordmark, tagline, Connect button, divider, URL input, quote
- Connect button triggers Solid OIDC login with issuer from VITE_SOLID_ISSUER env var
- Handle redirect callback: if session exists on load, skip to dashboard

Create `src/components/ui/ParticleField.tsx`:
- Canvas element, full viewport, position absolute, z-index 0
- 60 particles, 1px, opacity 0.2-0.35
- Slow drift, bounce off edges
- Colors: indigo/violet variants only
- Uses requestAnimationFrame

Create `src/components/ui/GlowingOrb.tsx`:
- Blurred div circles, position absolute
- Three orbs: bottom-left (violet), top-right (indigo), centre-right (deep blue)
- Breathing animation, 8s loop
- Opacity 0.04-0.07

### Deliverable
Login screen renders beautifully with particles, orbs, and working Solid auth. After login redirects to dashboard URL route.

---

## Phase 4: Dashboard layout

### What to build
Create `src/components/dashboard/Dashboard.tsx` — the three-panel layout.

Three panels with exact proportions: 30% / 40% / 30%
Header bar with logo, WebID badge, connection indicator

All panels are glass cards (from design system).

At this stage, panels can contain placeholder content:
- Left: "Pod Map loading..."
- Centre: The command bar input (real, functional)
- Right: "Audit log loading..."

Add CSS for the three-panel layout, header, and glass card styles.
Add responsive breakpoints: tablet collapses to two panels, mobile to single panel with nav.

### Deliverable
Dashboard layout renders with correct proportions, glass styling, header. Solid session WebID shows in header. Connection indicator is green.

---

## Phase 5: Pod Map panel

### What to build
Create `src/components/dashboard/PodMap.tsx`

Wire up usePodStructure hook. On mount, read all containers from the user's Pod.

For each folder, render a FolderCard.

Create `src/components/dashboard/FolderCard.tsx`:
- Glass card styling
- FolderLock icon, folder name
- Permission count badge (color coded: teal if >0, grey if 0)
- List of current permissions with person initial, name, expiry
- Hover animation: border brightens, subtle scale(1.02)
- Stagger animation on initial render

Create `src/components/dashboard/PermissionBadge.tsx`:
- Pill shape
- Color: teal (active), amber (expiring <7 days), red (just revoked)
- Shows: initial avatar + name + expiry text

Handle loading state: skeleton cards with shimmer animation.
Handle empty state: "No folders found in your Pod."

### Deliverable
Pod Map panel shows real folders from the user's Solid Pod with real ACL data.

---

## Phase 6: Command Bar

### What to build
Create `src/components/dashboard/CommandBar.tsx`

This is the centrepiece. Wire up useClaudeIntent hook.

Render states exactly as specified in 04_SCREENS.md:
- Idle: textarea with placeholder, example chips below
- Processing: pulsing indigo ring, "Understanding your instruction..."
- Clarification needed: response box with follow-up input for WebID
- Ready to execute: confirmation message + Confirm/Cancel buttons
- Executing: folder card glows (emit event to PodMap panel)
- Complete: success message, audit log entry added

Create `src/components/ui/AnimatedResponse.tsx`:
- Typewriter effect: characters appear one by one
- Cursor blinks while streaming
- Duration: approx 30ms per character

Example prompt chips: clicking one populates the textarea.

On Confirm: call usePermissions to execute the operation, then refresh pod structure, write audit log entry.

On Cancel: reset to idle state.

### Deliverable
Full command bar flow works end to end: type instruction → Claude parses → confirmation shown → user confirms → Pod ACL updates → audit log written → Pod map refreshes.

---

## Phase 7: Audit Log panel

### What to build
Create `src/components/dashboard/AuditLog.tsx`

Read audit entries from /podspeaks/log/ in the user's Pod using useAuditLog hook.
If /podspeaks/log/ does not exist, create it silently.

Render each AuditEntry with:
- Colored dot (teal/red/blue/orange)
- Timestamp in mono font
- Original instruction
- What changed (confirmationMessage)
- Slide-in animation for new entries
- Click to expand: shows raw operation JSON

Search/filter input at top.

Footer: "This log lives in your Pod at /podspeaks/log/ — only you can see it."

Empty state: "No actions yet. Your permission history will appear here."

### Deliverable
Audit log reads from and writes to the user's Pod. New entries appear in real time after each command.

---

## Phase 8: Permission connection lines

### What to build
Create `src/components/dashboard/PermissionGraph.tsx`

SVG overlay positioned absolutely over the left panel.

For each active permission, draw a line between the folder card position and an indicator at the bottom of the panel.

Line styles:
- Solid glowing line: permanent grants (teal, 2px, with CSS drop-shadow filter)
- Animated dashed line: expiring grants (amber, animated dash-offset)
- Dissolve animation: when permission is revoked

To get card positions: use refs on each FolderCard and read their bounding rects.

On grant: new line draws in with a path-length animation.
On revoke: line dissolves with opacity + blur animation.
On emergency revoke: all lines dissolve simultaneously with red flash overlay.

### Deliverable
Live connection lines visualise active permissions. Animate on every grant/revoke.

---

## Phase 9: Polish and demo readiness

### What to build

**Emergency revoke UX:**
Special confirmation modal (not inline) for the break-glass moment.
Red colour scheme. Lists all grants about to be revoked.
After confirmation: cascade animation, all lines dissolve, badges drop to 0.

**Expiry handling:**
On Pod load, check each permission's expiry timestamp.
Permissions past expiry: show amber badge "Expired — click to revoke"
Permissions within 7 days: show amber "Expiring soon" badge

**Page title and favicon:**
Title: "PodSpeaks — Your Pod, your language"
Favicon: shield emoji or simple SVG shield

**Micro-interactions:**
- Copy WebID to clipboard on click with toast confirmation
- Tooltip on hover of any WebID showing full URL
- Toast notifications (top-right, auto-dismiss 3s) for success/error states

**Responsive:**
Ensure tablet and mobile layouts work. Test at 768px and 375px.

**Final checks:**
- No TypeScript errors
- No console errors or warnings
- Solid auth works on page refresh (silent session restore)
- All loading states show correctly
- All error states are handled gracefully

### Deliverable
A fully polished, demo-ready application. Every interaction is smooth. Every state is handled. The UI communicates the product's thesis.

---

## What the finished app must demonstrate in 3 minutes

1. Login with Solid WebID — Pod map populates with real folders and permissions
2. Type: "Give my GP access to my health folder for two weeks" — confirmation shown, user confirms, badge updates, line appears, audit entry slides in
3. Type: "Who can currently see my data?" — Claude responds in plain English, no changes made
4. Type: "Revoke everything right now" — emergency modal, dramatic cascade animation, all access gone
5. Show audit log — every action stored in the user's own Pod, expandable, yours forever

Close with: "Every app built at this hackathon today creates a new data sharing problem. PodSpeaks is the one app all of them need."
