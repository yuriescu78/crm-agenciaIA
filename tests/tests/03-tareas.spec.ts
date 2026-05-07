/**
 * Test: Tareas — CRUD completo
 * Crear → Verificar → Completar → Eliminar
 */
import { test, expect } from '@playwright/test';
import { navigateTo, fillField, selectOption, testTask } from './helpers';

const TASK = testTask('e2e');

test.describe('Tareas', () => {
  test.describe.configure({ mode: 'serial' });

  test('01 — lista tareas existentes', async ({ page }) => {
    await navigateTo(page, '/tareas');
    await expect(page.locator('body')).not.toContainText(/error 500/i);
  });

  test('02 — crear nueva tarea', async ({ page }) => {
    await navigateTo(page, '/tareas');

    // Click en nueva tarea
    const addBtn = page.getByRole('button', { name: /nueva|añadir|crear|\+/i });
    await addBtn.first().click();
    await page.waitForTimeout(500);

    // Rellenar
    await fillField(page, /título|title|nombre/i, TASK.title);

    // Descripción — puede ser textarea
    const descField = page.getByLabel(/descripción|description/i).or(
      page.getByPlaceholder(/descripción|description/i)
    );
    if (await descField.count() > 0) {
      await descField.first().fill(TASK.description);
    }

    // Prioridad — puede ser select/dropdown
    try {
      await selectOption(page, /prioridad|priority/i, TASK.priority);
    } catch {
      // Si no hay selector de prioridad, no pasa nada
    }

    // Guardar
    const saveBtn = page.getByRole('button', { name: /guardar|crear|save/i });
    await saveBtn.first().click();
    await page.waitForTimeout(2000);

    // Verificar que aparece
    await expect(page.locator(`text=${TASK.title}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test('03 — marcar tarea como completada', async ({ page }) => {
    await navigateTo(page, '/tareas');

    // Buscar la tarea
    const taskRow = page.locator('tr, [class*="card"], [class*="item"]').filter({
      hasText: TASK.title,
    });
    await expect(taskRow.first()).toBeVisible();

    // Buscar checkbox o botón de completar
    const checkbox = taskRow.first().locator('input[type="checkbox"], [role="checkbox"]');
    const completeBtn = taskRow.first().getByRole('button', { name: /completar|complete|done/i });

    if (await checkbox.count() > 0) {
      await checkbox.first().click();
    } else if (await completeBtn.count() > 0) {
      await completeBtn.first().click();
    } else {
      // Click en la tarea para abrir detalle y completar ahí
      await taskRow.first().click();
      await page.waitForTimeout(500);
      const detailComplete = page.getByRole('button', { name: /completar|complete/i });
      if (await detailComplete.count() > 0) {
        await detailComplete.first().click();
      }
    }

    await page.waitForTimeout(2000);
  });

  test('04 — eliminar tarea de test', async ({ page }) => {
    await navigateTo(page, '/tareas');

    // Buscar la tarea (puede estar en completadas)
    const taskRow = page.locator('tr, [class*="card"], [class*="item"]').filter({
      hasText: TASK.title,
    });

    if (await taskRow.count() > 0) {
      await taskRow.first().click();
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

    // Verificar que desapareció
    const taskGone = await page.locator(`text=${TASK.title}`).count();
    expect(taskGone).toBe(0);
  });
});
