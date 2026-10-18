/// <reference types="vite/client" />

interface ImportMetaEnv {
  // The backend's URL, set at build time by alchemy.run.ts.
  readonly VITE_API_URL: string;
  // The website's own address, set at build time by alchemy.run.ts. Canonical URLs and the preview
  // image use it. Unset while the dev server runs.
  readonly VITE_SITE_URL?: string;
}
