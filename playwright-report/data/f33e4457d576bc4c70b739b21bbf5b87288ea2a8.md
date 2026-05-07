# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/01-dashboard.spec.ts >> Dashboard >> carga el dashboard con widgets
- Location: tests/tests/01-dashboard.spec.ts:9:7

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
  1  | /**
  2  |  * Test: Dashboard
  3  |  * Verifica que el dashboard carga y muestra los widgets principales.
  4  |  */
  5  | import { test, expect } from '@playwright/test';
  6  | import { navigateTo } from './helpers';
  7  | 
  8  | test.describe('Dashboard', () => {
  9  |   test('carga el dashboard con widgets', async ({ page }) => {
  10 |     await navigateTo(page, '/');
  11 | 
  12 |     // Verificar que estamos en el dashboard
  13 |     await expect(page).toHaveURL('/');
  14 | 
  15 |     // Verificar que hay contenido visible (widgets, métricas, etc.)
  16 |     const body = page.locator('body');
  17 |     await expect(body).toBeVisible();
  18 | 
  19 |     // Debe haber al menos algún texto numérico (métricas)
  20 |     // o textos clave del dashboard
  21 |     const hasContent = await page
  22 |       .locator('text=/cliente|tarea|oportunidad|reunión|pipeline/i')
  23 |       .count();
> 24 |     expect(hasContent).toBeGreaterThan(0);
     |                        ^ Error: expect(received).toBeGreaterThan(expected)
  25 |   });
  26 | 
  27 |   test('los links de navegación funcionan', async ({ page }) => {
  28 |     await navigateTo(page, '/');
  29 | 
  30 |     // Verificar que existe el menú/sidebar
  31 |     const nav = page.locator('nav, [class*="sidebar"], [class*="menu"]');
  32 |     await expect(nav.first()).toBeVisible();
  33 | 
  34 |     // Verificar links principales
  35 |     const sections = [
  36 |       { name: /cliente/i, url: '/clientes' },
  37 |       { name: /tarea/i, url: '/tareas' },
  38 |       { name: /pipeline/i, url: '/pipeline' },
  39 |       { name: /calendario/i, url: '/calendario' },
  40 |     ];
  41 | 
  42 |     for (const section of sections) {
  43 |       const link = page.getByRole('link', { name: section.name });
  44 |       if (await link.count() > 0) {
  45 |         await link.first().click();
  46 |         await page.waitForLoadState('networkidle');
  47 |         await expect(page).toHaveURL(section.url);
  48 |         await navigateTo(page, '/'); // Volver al dashboard
  49 |       }
  50 |     }
  51 |   });
  52 | });
  53 | 
```