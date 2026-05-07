/**
 * Test: Clientes — CRUD completo
 * Crear → Verificar → Editar → Verificar → Eliminar
 */
import { test, expect } from '@playwright/test';
import { navigateTo, fillField, testClient, uniqueId, waitForToast, waitForData } from './helpers';

const CLIENT = testClient('e2e');

test.describe('Clientes', () => {
  test.describe.configure({ mode: 'serial' }); // Ejecutar en orden

  test('01 — lista clientes existentes', async ({ page }) => {
    await navigateTo(page, '/clientes');

    // La página debe cargar sin errores
    await expect(page.locator('body')).not.toContainText(/error 500|internal server/i);

    // Debe haber alguna tabla o listado
    const hasTable = await page.locator('table, [class*="grid"], [class*="list"]').count();
    expect(hasTable).toBeGreaterThan(0);
  });

  test('02 — crear nuevo cliente', async ({ page }) => {
    await navigateTo(page, '/clientes');

    // Click en botón "Nuevo cliente" / "Añadir" / "+"
    const addBtn = page.getByRole('button', { name: /nuevo|añadir|crear|add|\+/i });
    await expect(addBtn.first()).toBeVisible();
    await addBtn.first().click();

    // Esperar a que aparezca el formulario/modal
    await page.waitForTimeout(500);

    // Rellenar campos
    await fillField(page, /nombre|first.?name/i, CLIENT.firstName);
    await fillField(page, /apellido|last.?name/i, CLIENT.lastName);
    await fillField(page, /empresa|company/i, CLIENT.company);
    await fillField(page, /email|correo/i, CLIENT.email);
    await fillField(page, /teléfono|phone/i, CLIENT.phone);

    // Guardar
    const saveBtn = page.getByRole('button', { name: /guardar|crear|save|submit/i });
    await saveBtn.first().click();

    // Verificar éxito: toast, o que aparece en la lista, o redirección a ficha
    await page.waitForTimeout(2000);

    // Buscar el nombre del cliente en la página
    const clientVisible = await page.locator(`text=${CLIENT.firstName}`).count();
    expect(clientVisible).toBeGreaterThan(0);
  });

  test('03 — buscar cliente creado', async ({ page }) => {
    await navigateTo(page, '/clientes');

    // Buscar por nombre
    const searchInput = page.getByPlaceholder(/buscar|search|filtrar/i);
    if (await searchInput.count() > 0) {
      await searchInput.first().fill(CLIENT.firstName);
      await page.waitForTimeout(1000); // Esperar debounce
    }

    // Verificar que aparece
    await expect(page.locator(`text=${CLIENT.firstName}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test('04 — abrir ficha del cliente', async ({ page }) => {
    await navigateTo(page, '/clientes');

    // Click en el nombre del cliente para abrir ficha
    await page.locator(`text=${CLIENT.firstName}`).first().click();
    await page.waitForLoadState('networkidle');

    // Verificar que estamos en la ficha (URL tipo /clientes/UUID)
    await expect(page).toHaveURL(/\/clientes\/.+/);

    // Verificar que los datos están visibles
    await expect(page.locator(`text=${CLIENT.company}`)).toBeVisible();
  });

  test('05 — editar cliente', async ({ page }) => {
    await navigateTo(page, '/clientes');
    await page.locator(`text=${CLIENT.firstName}`).first().click();
    await page.waitForLoadState('networkidle');

    // Click en editar
    const editBtn = page.getByRole('button', { name: /editar|edit|modificar/i });
    if (await editBtn.count() > 0) {
      await editBtn.first().click();
      await page.waitForTimeout(500);
    }

    // Cambiar la empresa
    const newCompany = `${CLIENT.company}_EDITADA`;
    await fillField(page, /empresa|company/i, newCompany);

    // Guardar
    const saveBtn = page.getByRole('button', { name: /guardar|save|actualizar|update/i });
    await saveBtn.first().click();
    await page.waitForTimeout(2000);

    // Verificar que se guardó
    await expect(page.locator(`text=${newCompany}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test('06 — eliminar cliente de test', async ({ page }) => {
    await navigateTo(page, '/clientes');

    // Buscar el cliente
    const searchInput = page.getByPlaceholder(/buscar|search|filtrar/i);
    if (await searchInput.count() > 0) {
      await searchInput.first().fill(CLIENT.firstName);
      await page.waitForTimeout(1000);
    }

    // Abrir ficha
    await page.locator(`text=${CLIENT.firstName}`).first().click();
    await page.waitForLoadState('networkidle');

    // Click en eliminar
    const deleteBtn = page.getByRole('button', { name: /eliminar|borrar|delete/i });
    await expect(deleteBtn.first()).toBeVisible();
    await deleteBtn.first().click();

    // Confirmar eliminación en el diálogo
    const confirmBtn = page.getByRole('button', { name: /confirmar|sí|si|yes|eliminar/i });
    await confirmBtn.first().click();
    await page.waitForTimeout(2000);

    // Verificar que ya no aparece en la lista
    await navigateTo(page, '/clientes');
    const clientGone = await page.locator(`text=${CLIENT.firstName}`).count();
    expect(clientGone).toBe(0);
  });
});
