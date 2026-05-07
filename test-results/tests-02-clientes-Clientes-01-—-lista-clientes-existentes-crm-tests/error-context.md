# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/02-clientes.spec.ts >> Clientes >> 01 — lista clientes existentes
- Location: tests/tests/02-clientes.spec.ts:13:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e6]
      - heading "Acceso a ELITOR.IA" [level=1] [ref=e9]
      - paragraph [ref=e10]: Panel de gestión estratégica para socios
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - text: Email de Socio
          - generic [ref=e15]:
            - img [ref=e16]
            - textbox "socio@agencia.com" [ref=e19]
        - generic [ref=e20]:
          - text: Contraseña
          - generic [ref=e21]:
            - img [ref=e22]
            - textbox "••••••••" [ref=e25]
      - button "Entrar al CRM" [ref=e26]
    - paragraph [ref=e27]: Si no tienes acceso, contacta con el administrador del sistema.
  - region "Notifications alt+T"
  - alert [ref=e28]
```

# Test source

```ts
  1   | /**
  2   |  * Test: Clientes — CRUD completo
  3   |  * Crear → Verificar → Editar → Verificar → Eliminar
  4   |  */
  5   | import { test, expect } from '@playwright/test';
  6   | import { navigateTo, fillField, testClient, uniqueId, waitForToast, waitForData } from './helpers';
  7   | 
  8   | const CLIENT = testClient('e2e');
  9   | 
  10  | test.describe('Clientes', () => {
  11  |   test.describe.configure({ mode: 'serial' }); // Ejecutar en orden
  12  | 
  13  |   test('01 — lista clientes existentes', async ({ page }) => {
  14  |     await navigateTo(page, '/clientes');
  15  | 
  16  |     // La página debe cargar sin errores
  17  |     await expect(page.locator('body')).not.toContainText(/error 500|internal server/i);
  18  | 
  19  |     // Debe haber alguna tabla o listado
  20  |     const hasTable = await page.locator('table, [class*="grid"], [class*="list"]').count();
> 21  |     expect(hasTable).toBeGreaterThan(0);
      |                      ^ Error: expect(received).toBeGreaterThan(expected)
  22  |   });
  23  | 
  24  |   test('02 — crear nuevo cliente', async ({ page }) => {
  25  |     await navigateTo(page, '/clientes');
  26  | 
  27  |     // Click en botón "Nuevo cliente" / "Añadir" / "+"
  28  |     const addBtn = page.getByRole('button', { name: /nuevo|añadir|crear|add|\+/i });
  29  |     await expect(addBtn.first()).toBeVisible();
  30  |     await addBtn.first().click();
  31  | 
  32  |     // Esperar a que aparezca el formulario/modal
  33  |     await page.waitForTimeout(500);
  34  | 
  35  |     // Rellenar campos
  36  |     await fillField(page, /nombre|first.?name/i, CLIENT.firstName);
  37  |     await fillField(page, /apellido|last.?name/i, CLIENT.lastName);
  38  |     await fillField(page, /empresa|company/i, CLIENT.company);
  39  |     await fillField(page, /email|correo/i, CLIENT.email);
  40  |     await fillField(page, /teléfono|phone/i, CLIENT.phone);
  41  | 
  42  |     // Guardar
  43  |     const saveBtn = page.getByRole('button', { name: /guardar|crear|save|submit/i });
  44  |     await saveBtn.first().click();
  45  | 
  46  |     // Verificar éxito: toast, o que aparece en la lista, o redirección a ficha
  47  |     await page.waitForTimeout(2000);
  48  | 
  49  |     // Buscar el nombre del cliente en la página
  50  |     const clientVisible = await page.locator(`text=${CLIENT.firstName}`).count();
  51  |     expect(clientVisible).toBeGreaterThan(0);
  52  |   });
  53  | 
  54  |   test('03 — buscar cliente creado', async ({ page }) => {
  55  |     await navigateTo(page, '/clientes');
  56  | 
  57  |     // Buscar por nombre
  58  |     const searchInput = page.getByPlaceholder(/buscar|search|filtrar/i);
  59  |     if (await searchInput.count() > 0) {
  60  |       await searchInput.first().fill(CLIENT.firstName);
  61  |       await page.waitForTimeout(1000); // Esperar debounce
  62  |     }
  63  | 
  64  |     // Verificar que aparece
  65  |     await expect(page.locator(`text=${CLIENT.firstName}`).first()).toBeVisible({ timeout: 10_000 });
  66  |   });
  67  | 
  68  |   test('04 — abrir ficha del cliente', async ({ page }) => {
  69  |     await navigateTo(page, '/clientes');
  70  | 
  71  |     // Click en el nombre del cliente para abrir ficha
  72  |     await page.locator(`text=${CLIENT.firstName}`).first().click();
  73  |     await page.waitForLoadState('networkidle');
  74  | 
  75  |     // Verificar que estamos en la ficha (URL tipo /clientes/UUID)
  76  |     await expect(page).toHaveURL(/\/clientes\/.+/);
  77  | 
  78  |     // Verificar que los datos están visibles
  79  |     await expect(page.locator(`text=${CLIENT.company}`)).toBeVisible();
  80  |   });
  81  | 
  82  |   test('05 — editar cliente', async ({ page }) => {
  83  |     await navigateTo(page, '/clientes');
  84  |     await page.locator(`text=${CLIENT.firstName}`).first().click();
  85  |     await page.waitForLoadState('networkidle');
  86  | 
  87  |     // Click en editar
  88  |     const editBtn = page.getByRole('button', { name: /editar|edit|modificar/i });
  89  |     if (await editBtn.count() > 0) {
  90  |       await editBtn.first().click();
  91  |       await page.waitForTimeout(500);
  92  |     }
  93  | 
  94  |     // Cambiar la empresa
  95  |     const newCompany = `${CLIENT.company}_EDITADA`;
  96  |     await fillField(page, /empresa|company/i, newCompany);
  97  | 
  98  |     // Guardar
  99  |     const saveBtn = page.getByRole('button', { name: /guardar|save|actualizar|update/i });
  100 |     await saveBtn.first().click();
  101 |     await page.waitForTimeout(2000);
  102 | 
  103 |     // Verificar que se guardó
  104 |     await expect(page.locator(`text=${newCompany}`).first()).toBeVisible({ timeout: 10_000 });
  105 |   });
  106 | 
  107 |   test('06 — eliminar cliente de test', async ({ page }) => {
  108 |     await navigateTo(page, '/clientes');
  109 | 
  110 |     // Buscar el cliente
  111 |     const searchInput = page.getByPlaceholder(/buscar|search|filtrar/i);
  112 |     if (await searchInput.count() > 0) {
  113 |       await searchInput.first().fill(CLIENT.firstName);
  114 |       await page.waitForTimeout(1000);
  115 |     }
  116 | 
  117 |     // Abrir ficha
  118 |     await page.locator(`text=${CLIENT.firstName}`).first().click();
  119 |     await page.waitForLoadState('networkidle');
  120 | 
  121 |     // Click en eliminar
```