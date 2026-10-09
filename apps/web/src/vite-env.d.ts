/// <reference types="vite/client" />

interface ImportMetaEnv {
  // The backend's URL, set at build time by alchemy.run.ts.
  readonly VITE_API_URL: string;
}
