# Handoff: CRM ELITOR.IA + Bot Telegram
*Última actualización: 8 mayo 2026*

## Contexto del proyecto
CRM propio para agencia de IA, desarrollado en Next.js 16 + Supabase + TypeScript.
URL producción: https://crm.elitorsoluciones.es
Repo: https://github.com/yuriescu78/crm-agenciaIA.git (privado)

## Stack técnico
- **Frontend/Backend:** Next.js 16.2.4 con App Router, TypeScript, Tailwind, shadcn/ui
- **Base de datos:** Supabase Postgres (proyecto: rmajfovafnydcwmeyjub)
- **LLM:** AI SDK v6 (`ai@^6.0.174`), Zod v4 (`zod@^4.4.2`)
- **Proveedor LLM:** Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) — default y recomendado
- **Bot Telegram:** @ElitorBot, webhook en `/api/telegram/webhook`
- **Deploy:** Vercel (production branch: main)

## Archivos clave del agente
```
src/lib/agent/
  runner.ts       — Orquestador principal (inyecta fecha actual + próximos 7 días)
  tools.ts        — 14 tools del CRM (inputSchema: zodSchema — AI SDK v6)
  normalizer.ts   — Mapeo español→inglés de campos, fechas relativas
  memory.ts       — Historial de conversación (MAX 2 mensajes)
  actions.ts      — getAgentConfig() desde Supabase

src/lib/llm/
  llmClient.ts    — Cliente LLM multi-proveedor (stopWhen: stepCountIs)
  adapters/       — groq.ts, openai.ts, anthropic.ts, vertex.ts, ollama.ts

src/app/api/
  telegram/webhook/route.ts     — Webhook principal
  cron/daily-summary/route.ts   — Resumen diario 8:00 Madrid
  webhooks/supabase/route.ts    — Notificaciones tiempo real
```

## Estado actual — qué funciona
- ✅ Login y autenticación de usuarios
- ✅ Módulo de Clientes (listado filtrado por owner_id, crear, editar, eliminar)
- ✅ Pipeline Kanban de oportunidades
- ✅ Módulo de Tareas
- ✅ Calendario con sync Google Calendar
- ✅ Módulo de Documentos con Google Drive
- ✅ Dashboard básico con notificaciones
- ✅ Bot Telegram — saludos y resumen del día
- ✅ Bot Telegram — listar, crear, buscar clientes
- ✅ Bot Telegram — crear y listar tareas
- ✅ Bot Telegram — crear eventos con fechas relativas ("el lunes a las 10")
- ✅ Bot Telegram — listar pipeline
- ✅ Notificaciones Telegram en tiempo real (crear cliente/tarea/evento desde web)
- ✅ Cron diario 8:00 — resumen de tareas vencidas, agenda, clientes sin actividad
- ✅ Perfil de Lucho (lutisco@gmail.com) creado en profiles + agent_config
- ✅ Tabla agent_config creada con configuración por usuario

## Problemas resueltos (historial)

### ✅ Build fallaba por `maxSteps` en llmClient.ts
**Fix:** `maxSteps: n` → `stopWhen: stepCountIs(n)` (AI SDK v6)

### ✅ tools.ts usaba API incorrecta del AI SDK v6
**Fix:** `parameters: z.object()` → `inputSchema: zodSchema(z.object())`

### ✅ Modelo Groq incompatible con Zod 4
**Fix:** DEFAULT_MODEL cambiado de `groq-llama-3-8b` a `claude-haiku-4-5-20251001`

### ✅ Bot no sabía la fecha actual
**Fix:** runner.ts inyecta `FECHA ACTUAL` + `PRÓXIMOS DÍAS` en el system prompt

### ✅ Creación de clientes fallaba silenciosamente
**Causas resueltas:**
- Tabla `agent_config` no existía → creada
- `email: ''` violaba UNIQUE constraint → cambiado a `null`
- `clients_name_unique` constraint eliminado (no tiene sentido en CRM)
- Email vacío `''` en registros existentes → actualizado a `NULL`

### ✅ list_clients no mostraba clientes recién creados
**Fix:** Añadido `.eq('owner_id', ctx.crmUserId)` en list_clients y search_clients

### ✅ Clientes de Lucho con owner_id incorrecto
**Fix:** UPDATE clients SET owner_id = UUID_YURI WHERE owner_id = UUID_LUCHO

### ✅ Notificaciones Telegram no llegaban
**Causas resueltas:**
- Columnas `telegram_users` son `telegram_user_id` y `user_id` (no telegram_id/crm_user_id)
- Archivos route.ts tenían nombres incorrectos (daily-summary-route.ts en vez de route.ts)

### ✅ Calendario — creación de eventos fallaba
**Fix:** Normalización de status/type a minúsculas sin tildes en tools.ts

## Compatibilidad de dependencias
```
Zod 4 + AI SDK v6 + Anthropic/OpenAI → ✅ COMPATIBLE
Zod 4 + AI SDK v6 + Groq             → ❌ INCOMPATIBLE para tool calling
Groq Whisper                          → ✅ OK para transcripción de voz
```

## Base de datos — notas importantes
- `clients.email` → UNIQUE nullable (usar null, nunca '')
- `clients_name_unique` → constraint ELIMINADO
- `calendar_events.status` → CHECK: 'programado'|'realizado'|'cancelado'
- `calendar_events.type` → CHECK: 'reunion'|'llamada'|'propuesta'|'recordatorio'|'vencimiento'
- `profiles.role` → CHECK: 'admin'|'user'
- `telegram_users` → columnas: `telegram_user_id`, `user_id`, `active`
- `agent_config` → creada el 8/5/2026, una fila por usuario

## Usuarios del sistema
| Rol | Email | UUID |
|-----|-------|------|
| admin | yuriescu78@gmail.com | f30de3ec-50ec-4a5b-8194-0d2fbdf2e6d8 |
| user | lutisco@gmail.com | ef17e72a-4aef-4371-9720-e8d4cfc64f59 |

## Variables de entorno en Vercel
```
ANTHROPIC_API_KEY=sk-ant-...       ✅
LLM_MODEL=claude-haiku-4-5-20251001 ✅
LLM_PROVIDER=anthropic              ✅
GROQ_API_KEY=...                    ✅ (solo Whisper)
OPENAI_API_KEY=...                  ✅
TELEGRAM_BOT_TOKEN=...              ✅
NEXT_PUBLIC_SUPABASE_URL=...        ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   ✅
SUPABASE_SERVICE_ROLE_KEY=...       ✅
GOOGLE_CLIENT_ID=...                ✅
GOOGLE_CLIENT_SECRET=...            ✅
GOOGLE_REDIRECT_URI=...             ✅
CRON_SECRET=...                     ✅ (añadido 8/5/2026)
SUPABASE_WEBHOOK_SECRET=...         ✅ (añadido 8/5/2026)
```

## Sistema de notificaciones Telegram
### Tiempo real (Supabase Webhooks → /api/webhooks/supabase)
- clients INSERT → "Nuevo cliente creado"
- tasks INSERT → "Nueva tarea creada"
- tasks UPDATE (pendiente→completada) → "Tarea completada"
- calendar_events INSERT → "Evento agendado"
- calendar_events UPDATE → "Evento realizado/cancelado"
- opportunities INSERT → "Nueva oportunidad"
- opportunities UPDATE (cambio de etapa) → "Oportunidad actualizada"

### Cron diario (Vercel Cron → /api/cron/daily-summary)
- Schedule: `0 6 * * *` (8:00 Madrid en verano)
- Contenido: tareas vencidas, tareas hoy, reuniones hoy, clientes sin actividad +7 días
- Test: `curl -H "Authorization: Bearer <CRON_SECRET>" https://crm.elitorsoluciones.es/api/cron/daily-summary`

## Comandos útiles
```bash
# Build local
npm run build

# Forzar redeploy en Vercel
git commit --allow-empty -m "force redeploy" && git push

# Test cron manual
curl -H "Authorization: Bearer <CRON_SECRET>" https://crm.elitorsoluciones.es/api/cron/daily-summary

# Ver logs en tiempo real
# Vercel Dashboard → proyecto → Logs → Live
```

## Pendientes
- [ ] Soft delete con campo `deleted_at` (clients, tasks, opportunities, calendar_events)
- [ ] Tests Playwright — ajustar selectores a la UI real del CRM
- [ ] Evaluador bot (`eval-bot.ts`) — ejecutar dataset de 45 casos
- [x] Selector de Claude Haiku en la UI de ajustes del agente — **implementado y activo**
- [ ] Notificaciones avanzadas configurables (días sin actividad ajustable)
- [ ] Lucho — verificar acceso completo y vincular Telegram
