import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env.local del proyecto
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * Playwright Config — CRM ELITOR.IA
 *
 * Variables de entorno necesarias en .env.local:
 *   TEST_USER_EMAIL=yuriescu78@gmail.com
 *   TEST_USER_PASSWORD=<tu contraseña de Supabase>
 *   TEST_BASE_URL=http://localhost:3000  (o https://crm.elitorsoluciones.es)
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,           // 60s por test — Supabase a veces tarda
  expect: { timeout: 10_000 },
  fullyParallel: false,      // Secuencial: los tests comparten estado (crear → editar → borrar)
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    storageState: './tests/fixtures/.auth.json',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  },

  projects: [
    // Setup: login y guardar sesión
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { storageState: undefined },
    },
    // Tests principales — dependen del setup
    {
      name: 'crm-tests',
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Lanza dev server automáticamente si estás en local
  webServer: process.env.TEST_BASE_URL?.includes('localhost')
    ? {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
