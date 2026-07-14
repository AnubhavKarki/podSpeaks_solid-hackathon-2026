# SolidHackathon

A Solid-protocol application built with React + TypeScript.

## Stack

- **Runtime**: TypeScript (strict) + React 19 + Vite
- **Solid**: `@inrupt/solid-client`, `@inrupt/solid-client-authn-browser`, `@inrupt/vocab-common-rdf`
- **Testing**: Vitest + React Testing Library
- **Linting/Formatting**: ESLint (flat config) + Prettier + EditorConfig
- **Package manager**: pnpm

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm format` | Run Prettier |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm coverage` | Run tests with coverage |
| `pnpm clean` | Clean build artifacts |

## Project structure

```
src/
  components/   # Shared UI components
  pages/        # Route-level page components
  layouts/      # Layout wrappers
  hooks/        # Custom React hooks
  services/     # Solid/API service layer
  lib/          # Third-party integrations
  providers/    # React context providers
  contexts/     # React contexts
  features/     # Feature-scoped modules
  types/        # TypeScript type definitions
  styles/       # Global styles
  utils/        # Pure utility functions
  constants/    # App-wide constants
  config/       # Configuration helpers
tests/          # Test files
docs/           # Documentation
```

## License

MIT
