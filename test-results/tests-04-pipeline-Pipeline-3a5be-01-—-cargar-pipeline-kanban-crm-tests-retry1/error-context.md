# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/04-pipeline.spec.ts >> Pipeline / Oportunidades >> 01 — cargar pipeline kanban
- Location: tests/tests/04-pipeline.spec.ts:13:7

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
  2   |  * Test: Pipeline — Oportunidades
  3   |  * Crear → Verificar en Kanban → Mover de etapa → Eliminar
  4   |  */
  5   | import { test, expect } from '@playwright/test';
  6   | import { navigateTo, fillField, selectOption, testOpportunity } from './helpers';
  7   | 
  8   | const OPP = testOpportunity('e2e');
  9   | 
  10  | test.describe('Pipeline / Oportunidades', () => {
  11  |   test.describe.configure({ mode: 'serial' });
  12  | 
  13  |   test('01 — cargar pipeline kanban', async ({ page }) => {
  14  |     await navigateTo(page, '/pipeline');
  15  |     await expect(page.locator('body')).not.toContainText(/error 500/i);
  16  | 
  17  |     // Verificar que hay columnas del kanban
  18  |     const columns = page.locator('[class*="column"], [class*="lane"], [class*="stage"], [data-stage]');
  19  |     const colCount = await columns.count();
> 20  |     expect(colCount).toBeGreaterThan(0);
      |                      ^ Error: expect(received).toBeGreaterThan(expected)
  21  |   });
  22  | 
  23  |   test('02 — crear nueva oportunidad', async ({ page }) => {
  24  |     await navigateTo(page, '/pipeline');
  25  | 
  26  |     // Botón de nueva oportunidad
  27  |     const addBtn = page.getByRole('button', { name: /nueva|añadir|crear|\+/i });
  28  |     await addBtn.first().click();
  29  |     await page.waitForTimeout(500);
  30  | 
  31  |     // Rellenar
  32  |     await fillField(page, /título|title|nombre/i, OPP.title);
  33  | 
  34  |     // Valor estimado
  35  |     try {
  36  |       await fillField(page, /valor|value|importe/i, OPP.value);
  37  |     } catch {
  38  |       // Campo opcional
  39  |     }
  40  | 
  41  |     // Etapa
  42  |     try {
  43  |       await selectOption(page, /etapa|stage|fase/i, OPP.stage);
  44  |     } catch {
  45  |       // Puede tener valor por defecto
  46  |     }
  47  | 
  48  |     // Guardar
  49  |     const saveBtn = page.getByRole('button', { name: /guardar|crear|save/i });
  50  |     await saveBtn.first().click();
  51  |     await page.waitForTimeout(2000);
  52  | 
  53  |     // Verificar que aparece en el kanban
  54  |     await expect(page.locator(`text=${OPP.title}`).first()).toBeVisible({ timeout: 10_000 });
  55  |   });
  56  | 
  57  |   test('03 — abrir detalle de oportunidad', async ({ page }) => {
  58  |     await navigateTo(page, '/pipeline');
  59  | 
  60  |     // Click en la tarjeta de la oportunidad
  61  |     await page.locator(`text=${OPP.title}`).first().click();
  62  |     await page.waitForTimeout(1000);
  63  | 
  64  |     // Verificar que se abre un modal/panel/página con detalles
  65  |     const detail = page.locator('[class*="modal"], [class*="drawer"], [class*="sheet"], [class*="detail"]');
  66  |     const titleVisible = page.locator(`text=${OPP.title}`);
  67  |     await expect(titleVisible.first()).toBeVisible();
  68  |   });
  69  | 
  70  |   test('04 — cambiar etapa de oportunidad (drag or select)', async ({ page }) => {
  71  |     await navigateTo(page, '/pipeline');
  72  | 
  73  |     // Click en la oportunidad
  74  |     await page.locator(`text=${OPP.title}`).first().click();
  75  |     await page.waitForTimeout(1000);
  76  | 
  77  |     // Intentar cambiar etapa desde el detalle
  78  |     const stageSelect = page.getByLabel(/etapa|stage/i).or(
  79  |       page.locator('select, [role="combobox"]').filter({ hasText: /contacto|etapa/i })
  80  |     );
  81  | 
  82  |     if (await stageSelect.count() > 0) {
  83  |       await stageSelect.first().click();
  84  |       await page.waitForTimeout(300);
  85  | 
  86  |       // Seleccionar "Contactado"
  87  |       const newStage = page.getByRole('option', { name: /contactado/i }).or(
  88  |         page.getByText('Contactado')
  89  |       );
  90  |       if (await newStage.count() > 0) {
  91  |         await newStage.first().click();
  92  |         await page.waitForTimeout(2000);
  93  |       }
  94  |     }
  95  |   });
  96  | 
  97  |   test('05 — eliminar oportunidad de test', async ({ page }) => {
  98  |     await navigateTo(page, '/pipeline');
  99  | 
  100 |     await page.locator(`text=${OPP.title}`).first().click();
  101 |     await page.waitForTimeout(1000);
  102 | 
  103 |     const deleteBtn = page.getByRole('button', { name: /eliminar|borrar|delete/i });
  104 |     if (await deleteBtn.count() > 0) {
  105 |       await deleteBtn.first().click();
  106 |       const confirmBtn = page.getByRole('button', { name: /confirmar|sí|eliminar/i });
  107 |       if (await confirmBtn.count() > 0) {
  108 |         await confirmBtn.first().click();
  109 |       }
  110 |       await page.waitForTimeout(2000);
  111 |     }
  112 | 
  113 |     // Verificar que desapareció
  114 |     await navigateTo(page, '/pipeline');
  115 |     const oppGone = await page.locator(`text=${OPP.title}`).count();
  116 |     expect(oppGone).toBe(0);
  117 |   });
  118 | });
  119 | 
```