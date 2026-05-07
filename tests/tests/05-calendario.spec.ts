/**
 * Test: Calendario
 * Verificar carga → Crear evento → Verificar → Eliminar
 */
import { test, expect } from '@playwright/test';
import { navigateTo, fillField, testEvent } from './helpers';

const EVENT = testEvent('e2e');

test.describe('Calendario', () => {
  test.describe.configure({ mode: 'serial' });

  test('01 — cargar calendario', async ({ page }) => {
    await navigateTo(page, '/calendario');
    await expect(page.locator('body')).not.toContainText(/error 500/i);

    // Debe haber un componente de calendario visible
    const calendar = page.locator(
      '[class*="calendar"], [class*="fullcalendar"], [class*="fc-"], table'
    );
    await expect(calendar.first()).toBeVisible({ timeout: 10_000 });
  });

  test('02 — crear nuevo evento', async ({ page }) => {
    await navigateTo(page, '/calendario');

    // Botón nuevo evento
    const addBtn = page.getByRole('button', { name: /nuevo|añadir|crear|evento|\+/i });
    await addBtn.first().click();
    await page.waitForTimeout(500);

    // Rellenar título
    await fillField(page, /título|title|nombre|asunto/i, EVENT.title);

    // Fecha
    try {
      await fillField(page, /fecha|date/i, EVENT.date);
    } catch {
      // Puede que se seleccione desde el calendario
    }

    // Hora
    try {
      await fillField(page, /hora|time|inicio/i, EVENT.time);
    } catch {
      // Puede no tener campo separado de hora
    }

    // Tipo — intentar seleccionar "Reunión"
    try {
      const typeSelect = page.getByLabel(/tipo|type/i);
      if (await typeSelect.count() > 0) {
        await typeSelect.first().click();
        await page.getByRole('option', { name: /reunión|reunion/i }).first().click();
      }
    } catch {
      // Campo opcional
    }

    // Guardar
    const saveBtn = page.getByRole('button', { name: /guardar|crear|save/i });
    await saveBtn.first().click();
    await page.waitForTimeout(2000);

    // Verificar que aparece
    await expect(page.locator(`text=${EVENT.title}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test('03 — eliminar evento de test', async ({ page }) => {
    await navigateTo(page, '/calendario');

    // Click en el evento
    const eventEl = page.locator(`text=${EVENT.title}`);
    if (await eventEl.count() > 0) {
      await eventEl.first().click();
      await page.waitForTimeout(500);

      const deleteBtn = page.getByRole('button', { name: /eliminar|borrar|delete/i });
      if (await deleteBtn.count() > 0) {
        await deleteBtn.first().click();
        const confirmBtn = page.getByRole('button', { name: /confirmar|sí|eliminar/i });
        if (await confirmBtn.count() > 0) {
          await confirmBtn.first().click();
        }
        await page.waitForTimeout(2000);
      }
    }
  });

  test('04 — navegar entre meses', async ({ page }) => {
    await navigateTo(page, '/calendario');

    // Buscar botones de navegación del calendario
    const nextBtn = page.getByRole('button', { name: /siguiente|next|>|→/i }).or(
      page.locator('[class*="next"], [aria-label*="next"]')
    );
    const prevBtn = page.getByRole('button', { name: /anterior|prev|<|←/i }).or(
      page.locator('[class*="prev"], [aria-label*="prev"]')
    );

    if (await nextBtn.count() > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(1000);
      // No debe haber errores al cambiar de mes
      await expect(page.locator('body')).not.toContainText(/error/i);
    }

    if (await prevBtn.count() > 0) {
      await prevBtn.first().click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toContainText(/error/i);
    }
  });
});
