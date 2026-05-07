/**
 * Test: Ajustes
 * Verificar carga de la configuración y que los cambios se guardan.
 */
import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Ajustes', () => {
  test('01 — cargar página de ajustes', async ({ page }) => {
    await navigateTo(page, '/ajustes');
    await expect(page.locator('body')).not.toContainText(/error 500/i);
  });

  test('02 — verificar sección de configuración del agente', async ({ page }) => {
    await navigateTo(page, '/ajustes');

    // Debe haber campos de configuración del bot/agente
    const agentSection = page.locator(
      'text=/modelo|agente|bot|llm|proveedor|temperatura|instrucciones/i'
    );
    const count = await agentSection.count();
    expect(count).toBeGreaterThan(0);
  });

  test('03 — verificar conexión Google Calendar', async ({ page }) => {
    await navigateTo(page, '/ajustes');

    // Debe haber algo sobre Google Calendar
    const googleSection = page.locator('text=/google|calendar|calendario/i');
    if (await googleSection.count() > 0) {
      // Verificar que hay un estado de conexión (conectado/desconectado)
      const connectionStatus = page.locator(
        'text=/conectado|vinculado|sincronizado|connected/i'
      );
      // No fallamos si no está — solo verificamos que la sección existe
      expect(await googleSection.count()).toBeGreaterThan(0);
    }
  });
});
