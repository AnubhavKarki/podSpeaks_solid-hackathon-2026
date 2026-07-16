# PodSpeaks — Claude Code Master Prompt

Paste this entire file into Claude Code as your first message.

---

You are the lead engineer building PodSpeaks, a hackathon submission for the Solid 2026 Hackathon at ANU Canberra.

Before writing any code, read all five specification documents in this order:
1. 01_VISION.md — what the product is and why it wins
2. 02_ARCHITECTURE.md — technical architecture, data flow, Solid operations, Claude API payload
3. 03_DESIGN_SYSTEM.md — colors, typography, motion, component patterns, layout
4. 04_SCREENS.md — every screen, every state, every interaction
5. 05_BUILD_ORDER.md — the exact build sequence, one phase at a time

These documents are your complete specification. Do not invent features not in them. Do not deviate from the design system. Do not skip phases.

## Context

- React + TypeScript + Vite project, already scaffolded and building cleanly
- @inrupt/solid-client and @inrupt/solid-client-authn-browser already installed
- The user's Solid Pod is at: https://pods.d01.solidcommunity.au/anubhav/
- The user's WebID is: https://pods.d01.solidcommunity.au/anubhav/profile/card#me
- The Solid OIDC issuer is: https://pods.d01.solidcommunity.au
- Claude API key will be in: VITE_CLAUDE_API_KEY environment variable
- No backend server. Everything client-side.
- Model to use for Claude API calls: claude-sonnet-4-6

## Your mandate

Build phases 1 through 9 from 05_BUILD_ORDER.md in strict sequence.

After each phase:
- Confirm the app builds with no TypeScript errors
- Confirm no console errors at runtime
- State clearly which phase is complete and what you are starting next

Do not proceed to the next phase until the current one is complete and verified.

## Non-negotiables

- Dark theme only. Background: #080C14. No light mode.
- Particle field on login screen and subtly on dashboard background
- Glass card components with backdrop-filter blur throughout
- Indigo (#6366F1) as primary accent everywhere
- Teal (#14B8A6) for active/granted states
- Red (#EF4444) for revoked/emergency states
- Claude API NEVER receives Pod file contents. Only folder names, structure, and permission metadata.
- Audit log writes to /podspeaks/log/ in the user's Pod
- Permission graph with animated SVG connection lines on the Pod Map panel
- Emergency revoke must have a dramatic cascade animation

## Start now

Read the five documents. Then begin Phase 1: Design Foundation.
