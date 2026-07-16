# PodSpeaks — Vision & Product Brief

## What it is

PodSpeaks is a natural language interface for Solid Pods. It lets anyone control who has access to their personal data using plain English sentences, no technical knowledge required.

## The problem it solves

Solid gives people ownership of their data. But the interface to actually exercise that ownership requires understanding ACLs, RDF, WebIDs, and container structures. Normal people have no idea what any of that means. So Solid never gets adopted.

Every app built at this hackathon — health trackers, baby trackers, document vaults — creates a new permission problem. Who can access your baby's data? Who can see your health records? How do you revoke them?

PodSpeaks is the one app every other app here needs.

## The one-line pitch

> "Your Pod. Your rules. Your language."

## The secondary pitch (for judges)

> "Every AI app today sends your data to a server to get intelligence. PodSpeaks brings the intelligence to your data."

## What it does

1. User logs in with their Solid WebID
2. App reads their Pod structure and current ACL permissions
3. User types a plain English instruction
4. Claude API parses intent from the instruction + Pod metadata (NOT personal data)
5. App executes the ACL operation on the Pod using the inrupt JS library
6. Audit log entry is written back to the Pod, owned by the user
7. Dashboard updates in real time

## What it does NOT do

- Never reads file contents from the Pod
- Never sends personal data to Claude API — only folder structure and permission metadata
- Never stores anything on a backend server — everything lives in the user's Pod
- Never requires the user to understand Solid, ACLs, RDF, or WebIDs

## The five user interactions

### 1. Grant access
> "Give my GP access to my health folder for two weeks"

Claude parses: operation=grant, target=/health/, webId=[GP's WebID], mode=read, expiry=+14days

### 2. Revoke access
> "Remove everyone from my finance folder immediately"

Claude parses: operation=revoke, target=/finance/, scope=all

### 3. Query
> "Who can currently see my data?"

Claude reads ACL metadata and responds in plain English. No write operation.

### 4. Time-limited access
> "Give the immigration agent access to my visa documents for three weeks then remove them"

Claude sets grant with expiry timestamp. App flags expired permissions on next load.

### 5. Emergency break-glass
> "Revoke everything. All folders. Right now."

All active permissions across the entire Pod are revoked in sequence. Logged as a single emergency event.

## The AI security argument (critical for pitch)

Claude API only ever receives:
- The user's plain English instruction
- Pod folder names and structure
- Existing permission metadata (who has access to what folder)

Claude NEVER receives:
- File contents
- Health records
- Financial data
- Any personal data

In the production vision: intent parsing runs locally using Transformers.js. The AI never touches a server. The only network call is the ACL write to the user's own Pod server which they control.

**The pitch line:** "For this demo we use Claude API. In production, the model runs in your browser. Your data never leaves your machine."

## Why this wins

- Every other team is building on top of Solid
- We are building the layer that makes Solid usable
- The judges who built solidui and solidpod know Solid's biggest problem is usability
- We are solving their problem, live, in front of them
- Infrastructure beats features
