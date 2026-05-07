/**
 * Test: Documentos
 * Verificar que la sección carga y muestra documentos de Google Drive.
 */
import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Documentos', () => {
  test('01 — cargar sección de documentos', async ({ page }) => {
    await navigateTo(page, '/documentos');
    await expect(page.locator('body')).not.toContainText(/error 500/i);
  });

  test('02 — verificar listado de documentos', async ({ page }) => {
    await navigateTo(page, '/documentos');

    // Esperar un momento para que cargue desde Google Drive
    await page.waitForTimeout(3000);

    // Debe haber alguna tabla, lista o mensaje de "no hay documentos"
    const hasContent = await page.locator(
      'table, [class*="grid"], [class*="list"], [class*="empty"], text=/no hay|sin documentos/i'
    ).count();
    expect(hasContent).toBeGreaterThan(0);
  });
});
