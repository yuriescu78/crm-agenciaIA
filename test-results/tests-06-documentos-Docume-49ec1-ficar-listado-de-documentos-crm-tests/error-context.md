# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/06-documentos.spec.ts >> Documentos >> 02 — verificar listado de documentos
- Location: tests/tests/06-documentos.spec.ts:14:7

# Error details

```
Error: locator.count: Unexpected token "=" while parsing css selector "table, [class*="grid"], [class*="list"], [class*="empty"], text=/no hay|sin documentos/i". Did you mean to CSS.escape it?
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
  1  | /**
  2  |  * Test: Documentos
  3  |  * Verificar que la sección carga y muestra documentos de Google Drive.
  4  |  */
  5  | import { test, expect } from '@playwright/test';
  6  | import { navigateTo } from './helpers';
  7  | 
  8  | test.describe('Documentos', () => {
  9  |   test('01 — cargar sección de documentos', async ({ page }) => {
  10 |     await navigateTo(page, '/documentos');
  11 |     await expect(page.locator('body')).not.toContainText(/error 500/i);
  12 |   });
  13 | 
  14 |   test('02 — verificar listado de documentos', async ({ page }) => {
  15 |     await navigateTo(page, '/documentos');
  16 | 
  17 |     // Esperar un momento para que cargue desde Google Drive
  18 |     await page.waitForTimeout(3000);
  19 | 
  20 |     // Debe haber alguna tabla, lista o mensaje de "no hay documentos"
  21 |     const hasContent = await page.locator(
  22 |       'table, [class*="grid"], [class*="list"], [class*="empty"], text=/no hay|sin documentos/i'
> 23 |     ).count();
     |       ^ Error: locator.count: Unexpected token "=" while parsing css selector "table, [class*="grid"], [class*="list"], [class*="empty"], text=/no hay|sin documentos/i". Did you mean to CSS.escape it?
  24 |     expect(hasContent).toBeGreaterThan(0);
  25 |   });
  26 | });
  27 | 
```