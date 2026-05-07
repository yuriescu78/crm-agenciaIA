# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/03-tareas.spec.ts >> Tareas >> 02 — crear nueva tarea
- Location: tests/tests/03-tareas.spec.ts:18:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /nueva|añadir|crear|\+/i }).first()

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
  2   |  * Test: Tareas — CRUD completo
  3   |  * Crear → Verificar → Completar → Eliminar
  4   |  */
  5   | import { test, expect } from '@playwright/test';
  6   | import { navigateTo, fillField, selectOption, testTask } from './helpers';
  7   | 
  8   | const TASK = testTask('e2e');
  9   | 
  10  | test.describe('Tareas', () => {
  11  |   test.describe.configure({ mode: 'serial' });
  12  | 
  13  |   test('01 — lista tareas existentes', async ({ page }) => {
  14  |     await navigateTo(page, '/tareas');
  15  |     await expect(page.locator('body')).not.toContainText(/error 500/i);
  16  |   });
  17  | 
  18  |   test('02 — crear nueva tarea', async ({ page }) => {
  19  |     await navigateTo(page, '/tareas');
  20  | 
  21  |     // Click en nueva tarea
  22  |     const addBtn = page.getByRole('button', { name: /nueva|añadir|crear|\+/i });
> 23  |     await addBtn.first().click();
      |                          ^ Error: locator.click: Test timeout of 60000ms exceeded.
  24  |     await page.waitForTimeout(500);
  25  | 
  26  |     // Rellenar
  27  |     await fillField(page, /título|title|nombre/i, TASK.title);
  28  | 
  29  |     // Descripción — puede ser textarea
  30  |     const descField = page.getByLabel(/descripción|description/i).or(
  31  |       page.getByPlaceholder(/descripción|description/i)
  32  |     );
  33  |     if (await descField.count() > 0) {
  34  |       await descField.first().fill(TASK.description);
  35  |     }
  36  | 
  37  |     // Prioridad — puede ser select/dropdown
  38  |     try {
  39  |       await selectOption(page, /prioridad|priority/i, TASK.priority);
  40  |     } catch {
  41  |       // Si no hay selector de prioridad, no pasa nada
  42  |     }
  43  | 
  44  |     // Guardar
  45  |     const saveBtn = page.getByRole('button', { name: /guardar|crear|save/i });
  46  |     await saveBtn.first().click();
  47  |     await page.waitForTimeout(2000);
  48  | 
  49  |     // Verificar que aparece
  50  |     await expect(page.locator(`text=${TASK.title}`).first()).toBeVisible({ timeout: 10_000 });
  51  |   });
  52  | 
  53  |   test('03 — marcar tarea como completada', async ({ page }) => {
  54  |     await navigateTo(page, '/tareas');
  55  | 
  56  |     // Buscar la tarea
  57  |     const taskRow = page.locator('tr, [class*="card"], [class*="item"]').filter({
  58  |       hasText: TASK.title,
  59  |     });
  60  |     await expect(taskRow.first()).toBeVisible();
  61  | 
  62  |     // Buscar checkbox o botón de completar
  63  |     const checkbox = taskRow.first().locator('input[type="checkbox"], [role="checkbox"]');
  64  |     const completeBtn = taskRow.first().getByRole('button', { name: /completar|complete|done/i });
  65  | 
  66  |     if (await checkbox.count() > 0) {
  67  |       await checkbox.first().click();
  68  |     } else if (await completeBtn.count() > 0) {
  69  |       await completeBtn.first().click();
  70  |     } else {
  71  |       // Click en la tarea para abrir detalle y completar ahí
  72  |       await taskRow.first().click();
  73  |       await page.waitForTimeout(500);
  74  |       const detailComplete = page.getByRole('button', { name: /completar|complete/i });
  75  |       if (await detailComplete.count() > 0) {
  76  |         await detailComplete.first().click();
  77  |       }
  78  |     }
  79  | 
  80  |     await page.waitForTimeout(2000);
  81  |   });
  82  | 
  83  |   test('04 — eliminar tarea de test', async ({ page }) => {
  84  |     await navigateTo(page, '/tareas');
  85  | 
  86  |     // Buscar la tarea (puede estar en completadas)
  87  |     const taskRow = page.locator('tr, [class*="card"], [class*="item"]').filter({
  88  |       hasText: TASK.title,
  89  |     });
  90  | 
  91  |     if (await taskRow.count() > 0) {
  92  |       await taskRow.first().click();
  93  |       await page.waitForTimeout(500);
  94  | 
  95  |       const deleteBtn = page.getByRole('button', { name: /eliminar|borrar|delete/i });
  96  |       if (await deleteBtn.count() > 0) {
  97  |         await deleteBtn.first().click();
  98  |         const confirmBtn = page.getByRole('button', { name: /confirmar|sí|eliminar/i });
  99  |         if (await confirmBtn.count() > 0) {
  100 |           await confirmBtn.first().click();
  101 |         }
  102 |         await page.waitForTimeout(2000);
  103 |       }
  104 |     }
  105 | 
  106 |     // Verificar que desapareció
  107 |     const taskGone = await page.locator(`text=${TASK.title}`).count();
  108 |     expect(taskGone).toBe(0);
  109 |   });
  110 | });
  111 | 
```