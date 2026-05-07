/**
 * Test Helpers — funciones reutilizables en todos los tests
 */
import { Page, expect } from '@playwright/test';

// ─────────────────────────────────────────────
// Navegación
// ─────────────────────────────────────────────

/** Navega a una sección del CRM y espera a que cargue */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  // Esperar a que desaparezca cualquier spinner/skeleton
  const spinner = page.locator('[class*="spinner"], [class*="skeleton"], [class*="loading"]');
  if (await spinner.count() > 0) {
    await spinner.first().waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }
}

/** Espera a que aparezca un toast/notificación de éxito */
export async function waitForToast(page: Page, textPattern: RegExp | string) {
  const toast = page.locator('[role="status"], [class*="toast"], [class*="notification"], [class*="alert"]');
  await expect(toast.filter({ hasText: textPattern })).toBeVisible({ timeout: 10_000 });
}

/** Espera a que una tabla o lista cargue datos (al menos 1 fila) */
export async function waitForData(page: Page) {
  // Esperar a que haya al menos una fila de tabla o item de lista
  const dataRow = page.locator('tbody tr, [class*="card"], [class*="item"], [class*="row"]').first();
  await dataRow.waitFor({ state: 'visible', timeout: 15_000 });
}

// ─────────────────────────────────────────────
// Datos de test
// ─────────────────────────────────────────────

/** Genera un sufijo único para nombres de test (evita colisiones) */
export function uniqueId(): string {
  return Date.now().toString(36).slice(-5);
}

/** Datos de un cliente de prueba */
export function testClient(suffix?: string) {
  const s = suffix || uniqueId();
  return {
    firstName: `TestBot_${s}`,
    lastName: `Apellido_${s}`,
    company: `EmpresaTest_${s}`,
    email: `test_${s}@example.com`,
    phone: `+34600${s.padStart(6, '0').slice(0, 6)}`,
  };
}

/** Datos de una tarea de prueba */
export function testTask(suffix?: string) {
  const s = suffix || uniqueId();
  return {
    title: `Tarea_Test_${s}`,
    description: `Descripción automática de prueba ${s}`,
    priority: 'Media',
  };
}

/** Datos de una oportunidad de prueba */
export function testOpportunity(suffix?: string) {
  const s = suffix || uniqueId();
  return {
    title: `Oportunidad_Test_${s}`,
    stage: 'Contacto Inicial',
    value: '5000',
  };
}

/** Datos de un evento de prueba */
export function testEvent(suffix?: string) {
  const s = suffix || uniqueId();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return {
    title: `Reunión_Test_${s}`,
    date: tomorrow.toISOString().split('T')[0],
    time: '10:00',
  };
}

// ─────────────────────────────────────────────
// Utilidades de formulario
// ─────────────────────────────────────────────

/** Rellena un campo por su label o placeholder */
export async function fillField(
  page: Page,
  labelOrPlaceholder: string | RegExp,
  value: string
) {
  // Intentar primero por label
  const byLabel = page.getByLabel(labelOrPlaceholder);
  if (await byLabel.count() > 0) {
    await byLabel.first().clear();
    await byLabel.first().fill(value);
    return;
  }
  // Fallback: placeholder
  const byPlaceholder = page.getByPlaceholder(labelOrPlaceholder);
  if (await byPlaceholder.count() > 0) {
    await byPlaceholder.first().clear();
    await byPlaceholder.first().fill(value);
    return;
  }
  throw new Error(`No se encontró campo con label/placeholder: ${labelOrPlaceholder}`);
}

/** Selecciona una opción de un dropdown/select */
export async function selectOption(
  page: Page,
  labelOrPlaceholder: string | RegExp,
  value: string
) {
  // shadcn/ui usa custom selects — intentar click + opción
  const trigger = page.getByLabel(labelOrPlaceholder).or(page.getByText(labelOrPlaceholder));
  await trigger.first().click();
  await page.getByRole('option', { name: value }).or(page.getByText(value)).first().click();
}

// ─────────────────────────────────────────────
// Limpieza
// ─────────────────────────────────────────────

/** Busca y elimina un registro de test por nombre */
export async function cleanupByName(page: Page, section: string, name: string) {
  await navigateTo(page, section);
  const row = page.locator('tr, [class*="card"]').filter({ hasText: name });
  if (await row.count() > 0) {
    await row.first().click();
    // Buscar botón de eliminar
    const deleteBtn = page.getByRole('button', { name: /eliminar|borrar|delete/i });
    if (await deleteBtn.count() > 0) {
      await deleteBtn.first().click();
      // Confirmar
      const confirmBtn = page.getByRole('button', { name: /confirmar|sí|si|yes/i });
      if (await confirmBtn.count() > 0) {
        await confirmBtn.first().click();
      }
    }
  }
}
