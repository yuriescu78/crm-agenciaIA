/**
 * Test: Equipo
 * Verificar que la sección de equipo carga y muestra usuarios.
 */
import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Equipo', () => {
  test('01 — cargar sección de equipo', async ({ page }) => {
    await navigateTo(page, '/equipo');
    await expect(page.locator('body')).not.toContainText(/error 500/i);
  });

  test('02 — verificar que hay al menos un usuario', async ({ page }) => {
    await navigateTo(page, '/equipo');
    await page.waitForTimeout(2000);

    // Debe mostrar al menos el usuario actual (yuriescu78@gmail.com)
    const hasUser = await page.locator(
      'text=/yuriescu|usuario|miembro|admin/i'
    ).count();
    expect(hasUser).toBeGreaterThan(0);
  });
});
