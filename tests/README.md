# 🧪 Tests E2E — CRM ELITOR.IA

Suite de tests end-to-end con Playwright para todo el CRM.

## Instalación rápida

```bash
# 1. Instalar Playwright (desde la raíz del proyecto)
npm install -D @playwright/test dotenv
npx playwright install chromium

# 2. Copiar archivos de test al proyecto
#    Copia todo el contenido de esta carpeta a la raíz del proyecto:
#    - playwright.config.ts
#    - tests/

# 3. Configurar credenciales
cp .env.example .env.local
# Edita .env.local con tu contraseña y Telegram ID
```

## Estructura

```
playwright.config.ts          ← Configuración principal
tests/
  auth.setup.ts               ← Login automático (se ejecuta 1 vez)
  helpers.ts                  ← Funciones reutilizables
  fixtures/.auth.json         ← Sesión guardada (se genera automáticamente)
  01-dashboard.spec.ts        ← Dashboard: carga, navegación
  02-clientes.spec.ts         ← Clientes: crear, buscar, editar, eliminar
  03-tareas.spec.ts           ← Tareas: crear, completar, eliminar
  04-pipeline.spec.ts         ← Pipeline: kanban, crear/mover oportunidades
  05-calendario.spec.ts       ← Calendario: crear eventos, navegar meses
  06-documentos.spec.ts       ← Documentos: carga desde Google Drive
  07-ajustes.spec.ts          ← Ajustes: configuración del agente
  08-equipo.spec.ts           ← Equipo: verificar usuarios
  09-bot-agent.spec.ts        ← Bot: 17 test cases contra el webhook
```

## Ejecución

```bash
# Ejecutar TODOS los tests
npx playwright test

# Solo un módulo
npx playwright test tests/02-clientes.spec.ts

# Solo el bot
npx playwright test tests/09-bot-agent.spec.ts

# Con interfaz visual (ver el browser)
npx playwright test --headed

# Modo debug (paso a paso)
npx playwright test --debug

# Ver reporte HTML después de ejecutar
npx playwright show-report
```

## Tests del Bot (09-bot-agent.spec.ts)

Estos tests envían mensajes directamente al webhook de Telegram
simulando un usuario real. Cubren:

| ID  | Categoría   | Mensaje                                              |
|-----|-------------|------------------------------------------------------|
| S01 | Saludo      | "Hola"                                               |
| S02 | Saludo      | "Qué pasa"                                           |
| S03 | Saludo      | "Buenos días"                                        |
| C01 | Clientes    | "Lista mis clientes"                                 |
| C02 | Búsqueda    | "Busca el cliente AC2"                               |
| C03 | Clientes    | "Crea cliente PruebaBot empresa BotCorp..."          |
| T01 | Tareas      | "Muestra mis tareas pendientes"                      |
| T02 | Tareas      | "Crea tarea Revisar propuesta con prioridad Alta"    |
| T03 | Tareas      | "Qué tareas urgentes tengo"                          |
| E01 | Calendario  | "Qué reuniones tengo hoy"                            |
| E02 | Calendario  | "Agenda reunión con Test el viernes a las 15h"       |
| P01 | Pipeline    | "Muestra el pipeline"                                |
| P02 | Pipeline    | "Crea oportunidad Proyecto BotTest valor 10000"      |
| B01 | Búsqueda    | "Busca algo que no existe xyznoexiste123"            |
| X01 | Resumen     | "Dame un resumen del día"                            |
| X02 | Clientes    | "Cuántos clientes tengo"                             |

## Notas importantes

- Los tests se ejecutan **en orden** (serial, no paralelo)
- Los tests de CRUD crean datos reales y los limpian al final
- El auth setup se ejecuta 1 sola vez y reutiliza la sesión
- Si un test falla, se guarda screenshot + video + trace en `test-results/`
- Para ver fallos detallados: `npx playwright show-report`

## Ajustar selectores

Si un test falla porque no encuentra un botón o campo, probablemente
tu CRM usa selectores diferentes. Revisa:

1. Abre el test en modo debug: `npx playwright test --debug`
2. Usa el inspector de Playwright para encontrar el selector correcto
3. Actualiza el test en el archivo `.spec.ts` correspondiente

Los selectores están escritos con patrones amplios (regex, roles ARIA)
para ser lo más resilientes posible, pero cada CRM es diferente.
