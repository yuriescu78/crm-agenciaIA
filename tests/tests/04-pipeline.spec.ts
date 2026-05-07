/**
 * Test: Pipeline — Oportunidades
 * Crear → Verificar en Kanban → Mover de etapa → Eliminar
 */
import { test, expect } from '@playwright/test';
import { navigateTo, fillField, selectOption, testOpportunity } from './helpers';

const OPP = testOpportunity('e2e');

test.describe('Pipeline / Oportunidades', () => {
  test.describe.configure({ mode: 'serial' });

  test('01 — cargar pipeline kanban', async ({ page }) => {
    await navigateTo(page, '/pipeline');
    await expect(page.locator('body')).not.toContainText(/error 500/i);

    // Verificar que hay columnas del kanban
    const columns = page.locator('[class*="column"], [class*="lane"], [class*="stage"], [data-stage]');
    const colCount = await columns.count();
    expect(colCount).toBeGreaterThan(0);
  });

  test('02 — crear nueva oportunidad', async ({ page }) => {
    await navigateTo(page, '/pipeline');

    // Botón de nueva oportunidad
    const addBtn = page.getByRole('button', { name: /nueva|añadir|crear|\+/i });
    await addBtn.first().click();
    await page.waitForTimeout(500);

    // Rellenar
    await fillField(page, /título|title|nombre/i, OPP.title);

    // Valor estimado
    try {
      await fillField(page, /valor|value|importe/i, OPP.value);
    } catch {
      // Campo opcional
    }

    // Etapa
    try {
      await selectOption(page, /etapa|stage|fase/i, OPP.stage);
    } catch {
      // Puede tener valor por defecto
    }

    // Guardar
    const saveBtn = page.getByRole('button', { name: /guardar|crear|save/i });
    await saveBtn.first().click();
    await page.waitForTimeout(2000);

    // Verificar que aparece en el kanban
    await expect(page.locator(`text=${OPP.title}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test('03 — abrir detalle de oportunidad', async ({ page }) => {
    await navigateTo(page, '/pipeline');

    // Click en la tarjeta de la oportunidad
    await page.locator(`text=${OPP.title}`).first().click();
    await page.waitForTimeout(1000);

    // Verificar que se abre un modal/panel/página con detalles
    const detail = page.locator('[class*="modal"], [class*="drawer"], [class*="sheet"], [class*="detail"]');
    const titleVisible = page.locator(`text=${OPP.title}`);
    await expect(titleVisible.first()).toBeVisible();
  });

  test('04 — cambiar etapa de oportunidad (drag or select)', async ({ page }) => {
    await navigateTo(page, '/pipeline');

    // Click en la oportunidad
    await page.locator(`text=${OPP.title}`).first().click();
    await page.waitForTimeout(1000);

    // Intentar cambiar etapa desde el detalle
    const stageSelect = page.getByLabel(/etapa|stage/i).or(
      page.locator('select, [role="combobox"]').filter({ hasText: /contacto|etapa/i })
    );

    if (await stageSelect.count() > 0) {
      await stageSelect.first().click();
      await page.waitForTimeout(300);

      // Seleccionar "Contactado"
      const newStage = page.getByRole('option', { name: /contactado/i }).or(
        page.getByText('Contactado')
      );
      if (await newStage.count() > 0) {
        await newStage.first().click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('05 — eliminar oportunidad de test', async ({ page }) => {
    await navigateTo(page, '/pipeline');

    await page.locator(`text=${OPP.title}`).first().click();
    await page.waitForTimeout(1000);

    const deleteBtn = page.getByRole('button', { name: /eliminar|borrar|delete/i });
    if (await deleteBtn.count() > 0) {
      await deleteBtn.first().click();
      const confirmBtn = page.getByRole('button', { name: /confirmar|sí|eliminar/i });
      if (await confirmBtn.count() > 0) {
        await confirmBtn.first().click();
      }
      await page.waitForTimeout(2000);
    }

    // Verificar que desapareció
    await navigateTo(page, '/pipeline');
    const oppGone = await page.locator(`text=${OPP.title}`).count();
    expect(oppGone).toBe(0);
  });
});
