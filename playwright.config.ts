import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Config — CRM ELITOR.IA
 * Sesión guardada manualmente con:
 *   npx playwright codegen https://crm.elitorsoluciones.es --save-storage=tests/fixtures/.auth.json
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'https://crm.elitorsoluciones.es',
    storageState: './tests/fixtures/.auth.json',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    channel: 'chrome',
  },

  projects: [
    {
      name: 'crm-tests',
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});
