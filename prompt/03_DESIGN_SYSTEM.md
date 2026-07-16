# PodSpeaks — Design System

## Design direction

YC startup meets privacy tool. Think Raycast meets Linear meets a surveillance ops dashboard. Dark, premium, purposeful. Every element earns its place. The UI itself should communicate the product's thesis: your data is a controlled, visible, manageable thing — not a black box.

The signature element: a live **permission graph** — Pod folders as glowing nodes with animated connection lines to people who have access. When access is granted, a line pulses into existence. When revoked, it dissolves. This is the one visual people will remember.

## Color palette

```css
--bg-primary: #080C14;        /* near-black with blue undertone, the base */
--bg-secondary: #0D1220;      /* slightly lighter, for cards */
--bg-tertiary: #111827;       /* hover states, elevated surfaces */
--bg-glass: rgba(13, 18, 32, 0.7); /* glassmorphism panels */

--accent-primary: #6366F1;    /* indigo, main brand color */
--accent-glow: #818CF8;       /* lighter indigo for glows */
--accent-teal: #14B8A6;       /* active/granted state */
--accent-danger: #EF4444;     /* revoked/emergency state */
--accent-warning: #F59E0B;    /* expiring soon */

--text-primary: #F1F5F9;      /* main text */
--text-secondary: #94A3B8;    /* muted/label text */
--text-tertiary: #475569;     /* disabled/placeholder */

--border-subtle: rgba(99, 102, 241, 0.15);  /* indigo-tinted borders */
--border-active: rgba(99, 102, 241, 0.4);   /* active element borders */

--granted: #14B8A6;           /* teal for active access */
--revoked: #EF4444;           /* red for revoked */
--expiring: #F59E0B;          /* amber for expiring soon */
--pending: #6366F1;           /* indigo for pending confirmation */
```

## Typography

```css
/* Display — headings and hero text */
font-family: 'Inter', system-ui, sans-serif;
/* Use tight letter-spacing: -0.03em to -0.05em for large sizes */
/* Use font-weight: 700-800 for impact */

/* Body — readable content */
font-family: 'Inter', system-ui, sans-serif;
font-weight: 400-500;
line-height: 1.6;

/* Mono — WebIDs, URLs, technical identifiers */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
font-size: 0.85em;
```

### Type scale
```
hero:     clamp(2.5rem, 5vw, 4rem),   font-weight: 800, tracking: -0.04em
h1:       2rem,   font-weight: 700, tracking: -0.03em
h2:       1.5rem, font-weight: 600, tracking: -0.02em
h3:       1.1rem, font-weight: 600
body:     0.9rem, font-weight: 400, line-height: 1.6
label:    0.75rem, font-weight: 500, letter-spacing: 0.08em, UPPERCASE
mono:     0.8rem,  font-family: monospace
```

## Motion principles

Motion should feel like a living system, not a decoration.

### Entrance animations
- Elements enter with `opacity: 0 → 1` + `translateY(8px) → 0`
- Duration: 300-400ms, easing: cubic-bezier(0.16, 1, 0.3, 1)
- Stagger children by 60ms

### Permission grant animation
- New connection line draws from folder node to person node
- Line pulses once then settles to steady glow
- Folder card badge counter increments with a pop scale(1.3) → scale(1)
- Duration: 600ms

### Permission revoke animation
- Connection line dissolves: opacity fades + dash-offset animates out
- Folder card badge decrements with a shake micro-animation
- Duration: 400ms

### Command bar response
- Claude's response appears with typewriter effect character by character
- Cursor blinks while streaming
- On completion, action buttons (Confirm / Cancel) slide in from below

### Background particle field
- 60-80 particles, very small (1-2px), low opacity (0.2-0.4)
- Slow drift movement, no interaction — purely ambient
- Occasional glowing orb floaters: larger, more opaque, move slowly
- Color: muted indigo/violet tones only

### Emergency break-glass
- All connection lines dissolve simultaneously
- Red flash pulse across the entire permission graph
- Badge counters all drop to 0 with a rapid cascade
- Duration: 800ms total, dramatic

### Transitions
- Route changes: crossfade 200ms
- Panel content updates: fade 150ms
- Hover states: 120ms ease

## Component patterns

### Glass card
```css
background: var(--bg-glass);
backdrop-filter: blur(12px);
border: 1px solid var(--border-subtle);
border-radius: 12px;
```

### Folder node card
- Rectangle card, glass background
- Top: folder icon (custom SVG, glowing in accent-primary)
- Middle: folder name in h3, permission count as a colored badge
- Bottom: list of avatars/initials for people with access
- Hover: border brightens to --border-active, subtle scale(1.02)
- Active (selected): indigo glow border, background lightens slightly

### Permission badge
- Pill shape, color coded
- Teal background for active grants
- Red for recently revoked
- Amber for expiring within 7 days
- Shows: avatar initial + name + expiry if set

### Command bar
- Large frosted glass panel
- Big textarea, no border, placeholder text fades in/out
- Below textarea: example prompt chips (clickable)
- Response area below: appears after submission
- Confirm/Cancel buttons appear after Claude responds

### Audit log entry
- Left: colored dot (teal=grant, red=revoke, blue=query)
- Top: timestamp in mono, small, muted
- Middle: original instruction in body text
- Bottom: what actually changed in smaller muted text
- Entries slide in from right on new addition

### Example prompt chips
```
"Who can see my data right now?"
"Revoke all access immediately"
"Give temporary access to my documents"
"Show recent permission changes"
```
Styled as pill buttons, indigo-tinted border, click to populate command bar

## Layout

### Three-panel dashboard (desktop)
```
┌─────────────────────────────────────────────────────────┐
│  HEADER: PodSpeaks logo + WebID + connection indicator  │
├──────────────┬──────────────────────────┬───────────────┤
│              │                          │               │
│   POD MAP    │     COMMAND BAR          │  AUDIT LOG    │
│              │                          │               │
│  Folder      │  [Type your instruction] │  14 Jul 3:42  │
│  cards as    │                          │  "Give GP..." │
│  nodes with  │  Example chips:          │  Granted read │
│  glow lines  │  [Who can see me?]       │  to /health/  │
│  to people   │  [Revoke everything]     │               │
│              │                          │  14 Jul 3:30  │
│              │  Response area:          │  "Remove..."  │
│              │  Claude's confirmation   │  Revoked all  │
│              │  + Confirm/Cancel btns   │  from /docs/  │
│              │                          │               │
└──────────────┴──────────────────────────┴───────────────┘
```

Column widths: 30% / 40% / 30%

### Login screen
```
┌────────────────────────────────────┐
│                                    │
│         [particle field]           │
│                                    │
│      [glowing orb ambient]         │
│                                    │
│         PodSpeaks                  │
│   Your Pod. Your rules.            │
│   Your language.                   │
│                                    │
│   [Connect your Solid Pod]         │
│                                    │
│   ── or enter your Pod URL ──      │
│   [___________________________]    │
│                                    │
│   "The interface Solid always      │
│    needed."                        │
│                                    │
└────────────────────────────────────┘
```

## Responsive

- Desktop (>1024px): full three-panel layout
- Tablet (768-1024px): two panels, audit log collapses to a drawer
- Mobile (<768px): single panel, bottom navigation to switch between pod map / command / log

## Icons

Use Lucide React icons throughout. Key icons:
- `Shield` — security/privacy theme in header
- `FolderLock` — folder cards
- `Zap` — command bar submit
- `History` — audit log
- `UserCheck` — granted access
- `UserX` — revoked access
- `Clock` — expiring permissions
- `AlertTriangle` — emergency actions
- `Wifi` — Pod connection status

## Loading states

- Initial Pod load: skeleton cards in the Pod map panel with shimmer animation
- Claude processing: pulsing indigo ring around the command bar input
- ACL write in progress: folder card glows and pulses
- Audit log updating: new entry slides in with a brief highlight flash

## Empty states

- No folders in Pod: "Your Pod is empty. Create some folders to get started."
- No permissions granted: "No one has access to your data right now."
- Empty audit log: "No actions yet. Your permission history will appear here."

## Error states

- Pod connection failed: red indicator in header, banner message
- Claude API error: "Couldn't parse that instruction. Try rephrasing."
- ACL write failed: "Permission update failed. Your Pod may be offline."
- WebID not found: "I need a WebID for that person. What is their Pod address?"
