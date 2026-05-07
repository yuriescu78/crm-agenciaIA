/**
 * Test: Dashboard
 * Verifica que el dashboard carga y muestra los widgets principales.
 */
import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Dashboard', () => {
  test('carga el dashboard con widgets', async ({ page }) => {
    await navigateTo(page, '/');

    // Verificar que estamos en el dashboard
    await expect(page).toHaveURL('/');

    // Verificar que hay contenido visible (widgets, métricas, etc.)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Debe haber al menos algún texto numérico (métricas)
    // o textos clave del dashboard
    const hasContent = await page
      .locator('text=/cliente|tarea|oportunidad|reunión|pipeline/i')
      .count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('los links de navegación funcionan', async ({ page }) => {
    await navigateTo(page, '/');

    // Verificar que existe el menú/sidebar
    const nav = page.locator('nav, [class*="sidebar"], [class*="menu"]');
    await expect(nav.first()).toBeVisible();

    // Verificar links principales
    const sections = [
      { name: /cliente/i, url: '/clientes' },
      { name: /tarea/i, url: '/tareas' },
      { name: /pipeline/i, url: '/pipeline' },
      { name: /calendario/i, url: '/calendario' },
    ];

    for (const section of sections) {
      const link = page.getByRole('link', { name: section.name });
      if (await link.count() > 0) {
        await link.first().click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(section.url);
        await navigateTo(page, '/'); // Volver al dashboard
      }
    }
  });
});
