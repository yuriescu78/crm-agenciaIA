/**
 * Auth Setup — Se ejecuta UNA vez antes de todos los tests.
 * Hace login en el CRM y guarda la sesión en .auth.json para reutilizarla.
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, 'fixtures', '.auth.json');

setup('login al CRM', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Faltan TEST_USER_EMAIL y/o TEST_USER_PASSWORD en .env.local'
    );
  }

  // 1. Ir al login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // 2. Rellenar credenciales
  //    Ajusta los selectores si tu formulario usa otros ids/placeholders
  await page.getByPlaceholder(/email|correo/i).fill(email);
  await page.getByPlaceholder(/contraseña|password/i).fill(password);

  // 3. Submit
  await page.getByRole('button', { name: /iniciar|login|entrar|acceder/i }).click();

  // 4. Esperar a que cargue el dashboard (redirige tras login)
  await page.waitForURL('/', { timeout: 15_000 });
  await expect(page.locator('body')).not.toContainText(/error|invalid/i);

  // 5. Guardar sesión (cookies + localStorage + sessionStorage)
  await page.context().storageState({ path: AUTH_FILE });

  console.log('✅ Login exitoso — sesión guardada en .auth.json');
});
