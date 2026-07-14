/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLID_IDP: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
