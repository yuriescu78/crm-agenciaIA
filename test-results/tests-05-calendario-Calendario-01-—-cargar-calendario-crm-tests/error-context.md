# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/05-calendario.spec.ts >> Calendario >> 01 — cargar calendario
- Location: tests/tests/05-calendario.spec.ts:13:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[class*="calendar"], [class*="fullcalendar"], [class*="fc-"], table').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[class*="calendar"], [class*="fullcalendar"], [class*="fc-"], table').first()

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
  2   |  * Test: Calendario
  3   |  * Verificar carga → Crear evento → Verificar → Eliminar
  4   |  */
  5   | import { test, expect } from '@playwright/test';
  6   | import { navigateTo, fillField, testEvent } from './helpers';
  7   | 
  8   | const EVENT = testEvent('e2e');
  9   | 
  10  | test.describe('Calendario', () => {
  11  |   test.describe.configure({ mode: 'serial' });
  12  | 
  13  |   test('01 — cargar calendario', async ({ page }) => {
  14  |     await navigateTo(page, '/calendario');
  15  |     await expect(page.locator('body')).not.toContainText(/error 500/i);
  16  | 
  17  |     // Debe haber un componente de calendario visible
  18  |     const calendar = page.locator(
  19  |       '[class*="calendar"], [class*="fullcalendar"], [class*="fc-"], table'
  20  |     );
> 21  |     await expect(calendar.first()).toBeVisible({ timeout: 10_000 });
      |                                    ^ Error: expect(locator).toBeVisible() failed
  22  |   });
  23  | 
  24  |   test('02 — crear nuevo evento', async ({ page }) => {
  25  |     await navigateTo(page, '/calendario');
  26  | 
  27  |     // Botón nuevo evento
  28  |     const addBtn = page.getByRole('button', { name: /nuevo|añadir|crear|evento|\+/i });
  29  |     await addBtn.first().click();
  30  |     await page.waitForTimeout(500);
  31  | 
  32  |     // Rellenar título
  33  |     await fillField(page, /título|title|nombre|asunto/i, EVENT.title);
  34  | 
  35  |     // Fecha
  36  |     try {
  37  |       await fillField(page, /fecha|date/i, EVENT.date);
  38  |     } catch {
  39  |       // Puede que se seleccione desde el calendario
  40  |     }
  41  | 
  42  |     // Hora
  43  |     try {
  44  |       await fillField(page, /hora|time|inicio/i, EVENT.time);
  45  |     } catch {
  46  |       // Puede no tener campo separado de hora
  47  |     }
  48  | 
  49  |     // Tipo — intentar seleccionar "Reunión"
  50  |     try {
  51  |       const typeSelect = page.getByLabel(/tipo|type/i);
  52  |       if (await typeSelect.count() > 0) {
  53  |         await typeSelect.first().click();
  54  |         await page.getByRole('option', { name: /reunión|reunion/i }).first().click();
  55  |       }
  56  |     } catch {
  57  |       // Campo opcional
  58  |     }
  59  | 
  60  |     // Guardar
  61  |     const saveBtn = page.getByRole('button', { name: /guardar|crear|save/i });
  62  |     await saveBtn.first().click();
  63  |     await page.waitForTimeout(2000);
  64  | 
  65  |     // Verificar que aparece
  66  |     await expect(page.locator(`text=${EVENT.title}`).first()).toBeVisible({ timeout: 10_000 });
  67  |   });
  68  | 
  69  |   test('03 — eliminar evento de test', async ({ page }) => {
  70  |     await navigateTo(page, '/calendario');
  71  | 
  72  |     // Click en el evento
  73  |     const eventEl = page.locator(`text=${EVENT.title}`);
  74  |     if (await eventEl.count() > 0) {
  75  |       await eventEl.first().click();
  76  |       await page.waitForTimeout(500);
  77  | 
  78  |       const deleteBtn = page.getByRole('button', { name: /eliminar|borrar|delete/i });
  79  |       if (await deleteBtn.count() > 0) {
  80  |         await deleteBtn.first().click();
  81  |         const confirmBtn = page.getByRole('button', { name: /confirmar|sí|eliminar/i });
  82  |         if (await confirmBtn.count() > 0) {
  83  |           await confirmBtn.first().click();
  84  |         }
  85  |         await page.waitForTimeout(2000);
  86  |       }
  87  |     }
  88  |   });
  89  | 
  90  |   test('04 — navegar entre meses', async ({ page }) => {
  91  |     await navigateTo(page, '/calendario');
  92  | 
  93  |     // Buscar botones de navegación del calendario
  94  |     const nextBtn = page.getByRole('button', { name: /siguiente|next|>|→/i }).or(
  95  |       page.locator('[class*="next"], [aria-label*="next"]')
  96  |     );
  97  |     const prevBtn = page.getByRole('button', { name: /anterior|prev|<|←/i }).or(
  98  |       page.locator('[class*="prev"], [aria-label*="prev"]')
  99  |     );
  100 | 
  101 |     if (await nextBtn.count() > 0) {
  102 |       await nextBtn.first().click();
  103 |       await page.waitForTimeout(1000);
  104 |       // No debe haber errores al cambiar de mes
  105 |       await expect(page.locator('body')).not.toContainText(/error/i);
  106 |     }
  107 | 
  108 |     if (await prevBtn.count() > 0) {
  109 |       await prevBtn.first().click();
  110 |       await page.waitForTimeout(1000);
  111 |       await expect(page.locator('body')).not.toContainText(/error/i);
  112 |     }
  113 |   });
  114 | });
  115 | 
```