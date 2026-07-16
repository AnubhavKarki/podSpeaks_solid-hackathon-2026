/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLID_IDP?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_URL?: string
  readonly VITE_CLAUDE_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
