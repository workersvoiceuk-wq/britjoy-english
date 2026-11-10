import { defineConfig, devices } from '@playwright/test';

// «Inglés para el día a día»: end-to-end against a production build that points to a local fake of the Supabase
// functions (e2e-vida-diaria/fake-backend.ts). The fake applies the real access contract to Stripe-signed test events.
// The anon key below is a placeholder for the build, not a credential.
const PORT = 4174;
export default defineConfig({
  testDir: 'e2e-vida-diaria',
  timeout: 90_000,
  workers: 1,
  reporter: process.env.CI ? [['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'movil-390', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'escritorio-1280', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `npx vite build --outDir dist-vida-diaria-e2e && npx vite preview --outDir dist-vida-diaria-e2e --host 127.0.0.1 --port ${PORT} --strictPort`,
    env: { VITE_SUPABASE_URL: 'http://127.0.0.1:54399', VITE_SUPABASE_ANON_KEY: 'e2e-placeholder-anon-key' },
    url: `http://127.0.0.1:${PORT}/vida-diaria/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
