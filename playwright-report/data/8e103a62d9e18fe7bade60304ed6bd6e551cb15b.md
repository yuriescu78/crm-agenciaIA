# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/07-ajustes.spec.ts >> Ajustes >> 02 — verificar sección de configuración del agente
- Location: tests/tests/07-ajustes.spec.ts:14:7

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
  2  |  * Test: Ajustes
  3  |  * Verificar carga de la configuración y que los cambios se guardan.
  4  |  */
  5  | import { test, expect } from '@playwright/test';
  6  | import { navigateTo } from './helpers';
  7  | 
  8  | test.describe('Ajustes', () => {
  9  |   test('01 — cargar página de ajustes', async ({ page }) => {
  10 |     await navigateTo(page, '/ajustes');
  11 |     await expect(page.locator('body')).not.toContainText(/error 500/i);
  12 |   });
  13 | 
  14 |   test('02 — verificar sección de configuración del agente', async ({ page }) => {
  15 |     await navigateTo(page, '/ajustes');
  16 | 
  17 |     // Debe haber campos de configuración del bot/agente
  18 |     const agentSection = page.locator(
  19 |       'text=/modelo|agente|bot|llm|proveedor|temperatura|instrucciones/i'
  20 |     );
  21 |     const count = await agentSection.count();
> 22 |     expect(count).toBeGreaterThan(0);
     |                   ^ Error: expect(received).toBeGreaterThan(expected)
  23 |   });
  24 | 
  25 |   test('03 — verificar conexión Google Calendar', async ({ page }) => {
  26 |     await navigateTo(page, '/ajustes');
  27 | 
  28 |     // Debe haber algo sobre Google Calendar
  29 |     const googleSection = page.locator('text=/google|calendar|calendario/i');
  30 |     if (await googleSection.count() > 0) {
  31 |       // Verificar que hay un estado de conexión (conectado/desconectado)
  32 |       const connectionStatus = page.locator(
  33 |         'text=/conectado|vinculado|sincronizado|connected/i'
  34 |       );
  35 |       // No fallamos si no está — solo verificamos que la sección existe
  36 |       expect(await googleSection.count()).toBeGreaterThan(0);
  37 |     }
  38 |   });
  39 | });
  40 | 
```