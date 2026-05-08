# CLAUDE.md — CRM ELITOR.IA

> Instrucciones para Claude Code. Leer completo antes de cualquier cambio.

## Stack técnico
- **Frontend/Backend:** Next.js 16.2.4, App Router, TypeScript, Tailwind, shadcn/ui
- **Base de datos:** Supabase Postgres (proyecto: `rmajfovafnydcwmeyjub`)
- **LLM:** AI SDK v6 (`ai@^6.0.174`), Zod v4 (`zod@^4.4.2`)
- **Bot:** Telegram @ElitorBot, webhook en `/api/telegram/webhook`
- **Deploy:** Vercel, branch `main` → auto-deploy

## Comandos esenciales
```bash
npm run build          # Verificar que no hay errores TypeScript antes de push
npm run dev            # Desarrollo local
git push               # Despliega automáticamente en Vercel
```

## Reglas críticas — NUNCA ignorar

### LLM
- **NUNCA usar Groq para tool calling** — incompatible con Zod 4 (additionalProperties error)
- Groq SÍ se puede usar para transcripción de voz (Whisper) — solo eso
- Modelo por defecto: `claude-haiku-4-5-20251001`
- Proveedor por defecto: `anthropic`
- AI SDK v6 usa `stopWhen: stepCountIs(n)` — NO `maxSteps`
- AI SDK v6 usa `inputSchema: zodSchema(z.object({...}))` — NO `parameters`

### Supabase
- **SIEMPRE usar `createSupabaseClientForUser()`** con `SUPABASE_SERVICE_ROLE_KEY`
- **NUNCA usar anon key** para operaciones del agente
- **SIEMPRE filtrar por `owner_id`** en queries de clients, tasks, opportunities
- Campos opcionales: usar `null` no `''` (hay UNIQUE constraints en email)

### Base de datos — constraints críticos
```
calendar_events.status → solo: 'programado' | 'realizado' | 'cancelado'
calendar_events.type   → solo: 'reunion' | 'llamada' | 'propuesta' | 'recordatorio' | 'vencimiento'
profiles.role          → solo: 'admin' | 'user'
clients.email          → UNIQUE (usar null si vacío, nunca '')
```

### Fechas
- Timezone siempre: `Europe/Madrid`
- Formato ISO con timezone: `2026-05-12T10:00:00+02:00`
- El system prompt del agente inyecta fecha actual + próximos 7 días

## Estructura de archivos clave
```
src/lib/agent/
  runner.ts       — Orquestador LLM, system prompt con fecha inyectada
  tools.ts        — 14 tools CRM (inputSchema: zodSchema)
  normalizer.ts   — Mapeo español→inglés, fechas relativas
  memory.ts       — Historial conversación (MAX 2 mensajes)
  actions.ts      — getAgentConfig() desde Supabase

src/lib/llm/
  llmClient.ts    — Cliente multi-proveedor (stopWhen: stepCountIs)
  adapters/       — groq, openai, anthropic, vertex, ollama

src/lib/telegram/
  handler.ts      — sendTelegramMessage(), sendMessageWithButtons()
  auth.ts         — authorizeTelegramUser(), linkTelegramUser()
  notifications.ts — getUnreadNotificationsForTelegram()

src/lib/supabase/
  client.ts       — createSupabaseClientForUser() — SIEMPRE usar este

src/app/api/
  telegram/webhook/route.ts     — Webhook principal del bot
  cron/daily-summary/route.ts   — Cron 8:00 Madrid (resumen diario)
  webhooks/supabase/route.ts    — Notificaciones tiempo real → Telegram
  auth/google/route.ts          — OAuth Google Calendar
  equipo/route.ts               — API de equipo
```

## Modelo de datos
```sql
clients         — owner_id → profiles.id, email UNIQUE nullable
opportunities   — owner_id → profiles.id
activities      — client_id, opportunity_id, origin: web|system|telegram
tasks           — assigned_to → profiles.id, due_date, status: pendiente|completada
calendar_events — owner_id → profiles.id, status/type con CHECK constraints
documents       — linked to Google Drive
profiles        — id, name, email, role: admin|user, active
telegram_users  — telegram_user_id (bigint), user_id → profiles.id, active
agent_config    — user_id → profiles.id, model, temperature, instructions
google_tokens   — refresh_token para Google Calendar/Drive
```

## Usuarios del sistema
| Rol | Email | UUID |
|-----|-------|------|
| admin | yuriescu78@gmail.com | `f30de3ec-50ec-4a5b-8194-0d2fbdf2e6d8` |
| user | lutisco@gmail.com | `ef17e72a-4aef-4371-9720-e8d4cfc64f59` |

## Variables de entorno (Vercel)
```
ANTHROPIC_API_KEY        — Claude Haiku/Sonnet
OPENAI_API_KEY           — GPT-4o (opcional)
GROQ_API_KEY             — Solo para Whisper, NO tool calling
TELEGRAM_BOT_TOKEN       — @ElitorBot
NEXT_PUBLIC_SUPABASE_URL — https://rmajfovafnydcwmeyjub.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY — Para operaciones del agente
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
CRON_SECRET              — Protección endpoint cron
SUPABASE_WEBHOOK_SECRET  — Protección webhook Supabase→Vercel
LLM_MODEL                — claude-haiku-4-5-20251001
LLM_PROVIDER             — anthropic
```

## Notificaciones Telegram
Dos sistemas activos:
1. **Tiempo real** — Supabase webhook → `/api/webhooks/supabase` → Telegram
   - Dispara en: INSERT clients/tasks/calendar_events/opportunities, UPDATE tasks/calendar_events/opportunities
   - Anti-loop: ignora registros con `origin = 'telegram'`
2. **Cron diario** — Vercel cron 8:00 UTC → `/api/cron/daily-summary`
   - Envía: tareas vencidas, tareas hoy, reuniones hoy, clientes sin actividad +7 días
   - Protegido con `Authorization: Bearer <CRON_SECRET>`

## Compatibilidad de dependencias
```
Zod 4 + AI SDK v6 + Anthropic → ✅ COMPATIBLE
Zod 4 + AI SDK v6 + OpenAI    → ✅ COMPATIBLE
Zod 4 + AI SDK v6 + Groq      → ❌ INCOMPATIBLE para tool calling
```

## Patrones de código

### Tool correcto (AI SDK v6)
```typescript
import { tool, zodSchema } from 'ai';
import { z } from 'zod';

my_tool: tool({
  description: 'Descripción clara',
  inputSchema: zodSchema(z.object({
    field: z.string().describe('descripción del campo'),
  })),
  execute: async (rawArgs: any) => {
    const args = normalizeToolParams('my_tool', rawArgs);
    const supabase = createSupabaseClientForUser(ctx.crmUserId);
    const { data, error } = await supabase
      .from('table')
      .select('...')
      .eq('owner_id', ctx.crmUserId);  // SIEMPRE filtrar por owner
    if (error) return { error: error.message };
    return { data };
  },
}),
```

### LLM call correcto (AI SDK v6)
```typescript
import { generateText, stepCountIs } from 'ai';

const result = await generateText({
  model,
  system: systemPrompt,
  messages,
  tools,
  stopWhen: stepCountIs(3),  // NO maxSteps
  temperature: 0.2,
});
```

## Pendientes conocidos
- [ ] Soft delete (`deleted_at`) en clients, tasks, opportunities, calendar_events
- [ ] Tests Playwright — ajustar selectores a la UI real
- [ ] Evaluador bot (`eval-bot.ts`) — dataset 45 casos
- [ ] Notificaciones proactivas avanzadas (clientes sin actividad configurable)
- [ ] Lucho (lutisco@gmail.com) — verificar acceso completo y vincular cuenta Telegram
- [ ] Auditar otras páginas (tareas, pipeline, calendario, dashboard) — mismo bug potencial: queries sin `owner_id` + errores Supabase swallados silenciosamente
- [x] /clientes mostraba 0 clientes — resuelto: `owner_id` filter + `useAuth()` + `from('profiles')` (commit 06c993d, 8/5/2026)
- [x] Selector de modelo LLM en UI de ajustes del agente — implementado y activo para el bot Telegram

## Archivos y carpetas — NO tocar sin permiso explícito

### NUNCA modificar
```
next.config.ts              — Configuración Next.js, rompe el build si se toca
tsconfig.json               — Configuración TypeScript
tsconfig.build.json         — Build config
vercel.json                 — Solo tocar para añadir crons, nunca otras secciones
package.json                — Solo tocar para añadir dependencias si se piden
package-lock.json           — NUNCA tocar manualmente
.env.local                  — Variables de entorno locales, nunca commitear
src/lib/supabase/client.ts  — Cliente Supabase, ya está correcto
```

### NO refactorizar sin avisar primero
```
src/lib/telegram/auth.ts         — Lógica de vinculación, funciona correctamente
src/lib/telegram/handler.ts      — Envío de mensajes, no cambiar la firma
src/lib/google/                  — OAuth Google, no tocar
src/lib/llm/adapters/            — Adaptadores LLM, no modificar
src/app/(auth)/                  — Páginas de autenticación
```

### Carpetas de UI — solo tocar si se pide explícitamente
```
src/app/(dashboard)/             — Páginas del CRM (clientes, pipeline, etc.)
src/components/                  — Componentes UI
public/                          — Assets estáticos
```

### Siempre hacer antes de cualquier push
1. `npm run build` — verificar que compila sin errores TypeScript
2. Revisar que no hay `console.log` de debug en producción
3. Confirmar que los cambios son en los archivos correctos

## Flujo de trabajo recomendado
1. Crear rama: `git checkout -b feature/nombre`
2. Hacer cambios
3. `npm run build` — verificar
4. `git push origin feature/nombre`
5. Avisar al usuario para que revise y mergee a main

## Preguntar siempre antes de
- Cambiar el schema de Supabase (tablas, columnas, constraints)
- Modificar el system prompt del agente (`runner.ts`)
- Cambiar el modelo LLM por defecto
- Tocar cualquier archivo de autenticación
- Instalar nuevas dependencias
- Hacer cambios que afecten a más de 5 archivos a la vez
