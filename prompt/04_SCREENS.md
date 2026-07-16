# PodSpeaks — Screens & Interactions

## Screen 1: Login

### Visual
Full viewport. Dark background with slowly drifting particle field. One large soft glowing orb in the lower right, muted indigo. Centred content block.

### Content
```
[PodSpeaks wordmark — Inter 800, 2rem, white]
[tagline — "Your Pod. Your rules. Your language." — muted, 1rem]

[24px gap]

[Primary button — "Connect your Solid Pod" — filled indigo, full width 320px]

[16px gap]

[Divider — "— or enter your Pod URL —" in muted text]

[Input — Pod server URL, placeholder: "https://pods.d01.solidcommunity.au"]
[Secondary button — "Connect" — ghost style]

[32px gap]

[Small italic quote — "The interface Solid always needed." — very muted]
```

### Interactions
- Connect button triggers Solid OIDC redirect
- Pod URL input allows custom Pod server entry
- On return from redirect: brief loading state then transition to dashboard
- Page transition: fade out particles, content scales up slightly, crossfade to dashboard

---

## Screen 2: Dashboard

### Header bar
```
[PodSpeaks logo — small, left]     [WebID badge — mono font, pill]     [Green dot "Connected" or Red "Offline"]
```

WebID badge shows the user's Pod URL truncated. Hovering shows full WebID in a tooltip.

---

### Left panel: Pod Map

Title: `YOUR DATA` — label style, uppercase, muted

Each folder in the Pod rendered as a FolderCard:

```
┌─────────────────────────┐
│  🔒  health/            │
│                         │
│  [teal pill] 2 people   │
│  ○ Dr Smith  · 4 days   │
│  ○ Clinic    · 30 days  │
│                         │
│  [Manage]               │
└─────────────────────────┘
```

- If no access granted: single grey pill "No access granted"
- Clicking a card highlights it and pre-fills the command bar context
- Cards animate in with stagger on initial load

At the bottom of the panel:
```
[+ Add folder context]  — muted button to manually specify a folder not yet in Pod
```

---

### Centre panel: Command Bar

This is the main interface. It takes 40% of the width and is the visual centrepiece.

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│   Tell PodSpeaks what you want...                    │
│                                                       │
│   [large textarea, no visible border, just bg]       │
│   [placeholder text fades in with typing cursor]     │
│                                                       │
│                               [Zap icon] [Send]      │
└──────────────────────────────────────────────────────┘

[Example chips row:]
[Who can see my data?]  [Revoke all access]  [Grant temporary access]  [Show recent changes]
```

After user submits instruction:

**State 1: Processing**
```
[Pulsing indigo ring around the input]
[Small spinner + "Understanding your instruction..."]
```

**State 2: Claude responds — needs clarification**
```
┌──────────────────────────────────────────────────────┐
│  ⚡ PodSpeaks                                         │
│                                                       │
│  I want to grant read access to your /health/        │
│  folder. Who is your GP? Please provide their        │
│  WebID or Pod address.                               │
│                                                       │
│  [WebID input field]                                  │
│  [Submit WebID]                                       │
└──────────────────────────────────────────────────────┘
```

**State 3: Claude responds — ready to execute**
```
┌──────────────────────────────────────────────────────┐
│  ⚡ PodSpeaks                                         │
│                                                       │
│  Ready to grant Dr Smith read access to your         │
│  /health/ folder until 28 July 2026.                 │
│  Access will automatically expire after that date.   │
│                                                       │
│  [✓ Confirm]    [✗ Cancel]                           │
└──────────────────────────────────────────────────────┘
```

**State 4: Executing**
```
[Folder card for /health/ glows and pulses]
["Updating permissions..."]
```

**State 5: Complete**
```
┌──────────────────────────────────────────────────────┐
│  ✓ Done                                               │
│                                                       │
│  Dr Smith now has read access to /health/            │
│  until 28 July 2026.                                  │
│  This action has been logged to your Pod.            │
└──────────────────────────────────────────────────────┘
[Connection line animates in the Pod map between /health/ and Dr Smith]
```

**Emergency revoke state (special)**
When operation type is "emergency":
```
┌──────────────────────────────────────────────────────┐
│  ⚠️  EMERGENCY REVOKE                                 │
│                                                       │
│  This will immediately remove ALL permissions        │
│  across ALL folders in your Pod.                     │
│                                                       │
│  3 active grants will be revoked:                    │
│  · Dr Smith → /health/                               │
│  · Tax Agent → /finance/                             │
│  · Client A → /documents/                            │
│                                                       │
│  [🔴 Revoke Everything]    [Cancel]                  │
└──────────────────────────────────────────────────────┘
```

After emergency revoke: all connection lines dissolve simultaneously, red flash, all badge counters drop to 0.

---

### Right panel: Audit Log

Title: `PERMISSION HISTORY` — label style, uppercase, muted

```
[Search/filter input — small, ghost style]

─────────────────────────────
● 14 Jul 2026, 3:42 PM
"Give my GP access to health for 2 weeks"
Granted read → /health/ until 28 Jul
─────────────────────────────
● 14 Jul 2026, 3:30 PM
"Who can see my data?"
Query — 2 active grants found
─────────────────────────────
● 14 Jul 2026, 3:15 PM
"Remove the tax agent from everything"
Revoked all → /finance/
─────────────────────────────
```

Color coding:
- Teal dot = grant
- Red dot = revoke
- Blue dot = query
- Orange dot = emergency

Each entry is expandable on click to show full JSON operation details for technical users.

Empty state: "No actions yet. Your permission history will appear here."

Footer note below audit log (small, muted):
```
"This log lives in your Pod at /podspeaks/log/
Only you can see it."
```

---

## Ambient visual elements

### Particle field (background layer, all screens)
- 60 tiny dots, 1px, opacity 0.15-0.3
- Drift slowly in random directions, bounce off edges
- Color: mix of --accent-primary and --accent-glow tones
- Never interactive, purely atmospheric

### Permission connection lines (Pod Map overlay)
- SVG lines drawn between folder cards and person indicators
- Color: --accent-teal for active grants, --accent-danger for recently revoked
- Animated: dashed lines with animated dash-offset for expiring permissions
- Solid glowing lines for permanent grants
- Disappear with dissolve animation when revoked

### Glowing orbs (background layer, subtle)
- 2-3 large blurred circles, 200-400px diameter
- Very low opacity (0.03-0.06)
- Slow breathing animation (scale 1.0 → 1.1 → 1.0, 8s loop)
- Positioned: one bottom-left, one top-right, one centre-right
- Color: indigo and violet tones

---

## Key demo moments (optimise for these)

### Demo moment 1: Grant
Type: "Give my GP access to my health folder for two weeks"
Watch: /health/ card badge increments, connection line appears, audit log entry slides in

### Demo moment 2: Query
Type: "Who can currently see my data?"
Watch: Claude responds with a plain English list, no changes made, just a read

### Demo moment 3: Emergency revoke
Type: "Revoke everything right now"
Watch: red flash, all lines dissolve simultaneously, all badges drop to 0, dramatic

### Demo moment 4: Show audit log
Scroll the audit log, expand an entry, show the raw operation stored in the Pod
Say: "This lives in your Pod. Not on our servers. Not on Anthropic's servers. Yours."
