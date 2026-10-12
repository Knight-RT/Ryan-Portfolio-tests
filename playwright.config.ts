import { defineConfig } from '@playwright/test';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL is required. Start the portfolio server, then set BASE_URL (for example http://127.0.0.1:8000) before running npm test.');
}
const url = new URL(process.env.BASE_URL);
if (!['http:', 'https:'].includes(url.protocol)) throw new Error('BASE_URL must be an HTTP or HTTPS URL.');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.BASE_URL, viewport: { width: 1280, height: 720 }, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
