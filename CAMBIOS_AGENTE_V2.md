# ELITOR.IA CRM — Correcciones al agente de Telegram (v2)

## Resumen de cambios

Se corrigen 4 archivos del agente de Telegram para resolver el error de rate limit
y mejorar la fiabilidad, seguridad y trazabilidad del bot.

---

## Archivos modificados

| Archivo | Cambios principales |
|---------|-------------------|
| `src/lib/agent/runner.ts` | Historial reducido, temperatura bajada, modelo 8B por defecto, errores limpios |
| `src/lib/agent/tools.ts` | Auditoría en todas las tools, soft delete, sanitización de búsquedas |
| `src/app/api/telegram/webhook/route.ts` | Idempotencia por update_id, funciones extraídas, errores nunca expuestos |
| `src/lib/llm/llmClient.ts` | Modelo por defecto cambiado a 8B, mapeo de modelos mejorado |

---

## Detalle de cada cambio

### 1. runner.ts — Consumo de tokens (RESUELVE EL RATE LIMIT)

**Problema:** Cada mensaje consumía ~8.000-20.000 tokens por cargar 10 mensajes de
historial + 5 maxSteps + temperatura 0.7. Con 100K tokens/día, bastaban 5-12 mensajes
para agotar el límite.

**Cambios:**
- `MAX_HISTORY_MESSAGES`: de 10 → 2 (ahorro ~80% de tokens de input)
- `MAX_STEPS`: de 5 → 3 (suficiente para buscar + ejecutar + responder)
- `DEFAULT_TEMPERATURE`: de 0.7 → 0.2 (menos variabilidad = menos tool calls inútiles)
- `DEFAULT_MODEL`: de `groq-llama-3-70b` → `groq-llama-3-8b` (5x más cuota en free tier)
- System prompt compactado: de ~400 tokens a ~250 tokens
- `saveMessage` ya no bloquea la respuesta (fire-and-forget con catch)

**Impacto estimado:** consumo por mensaje baja de ~15.000 a ~2.500 tokens.
Con el 8B (500K tokens/día), podéis enviar ~200 mensajes diarios sin pagar.

### 2. runner.ts — Manejo de errores

**Problema:** El error de Groq se mostraba completo al usuario, incluyendo org ID,
límites exactos, URLs de billing, etc.

**Cambio:** Nueva función `formatUserError()` que:
- Detecta rate limit, auth, timeout y modelo no disponible
- Muestra mensaje limpio en español
- Nunca expone datos técnicos (quedan en console.error para Sentry)

### 3. tools.ts — Auditoría

**Problema:** Ninguna tool registraba actividad. Crear un cliente por Telegram no
dejaba rastro en el historial del CRM.

**Cambio:** Nueva función `logActivity()` que se llama desde cada tool que modifica datos:
- `create_client` → registra "Cliente creado desde Telegram"
- `create_task` → registra "Tarea creada desde Telegram"
- `complete_task` → registra "Tarea completada desde Telegram"
- `create_event` → registra "Reunión agendada desde Telegram"
- `create_opportunity` → registra "Oportunidad creada desde Telegram"
- `update_opportunity_stage` → registra cambio de etapa con valores anterior y nuevo
- `delete_client` → registra eliminación

El logging nunca lanza excepciones (try/catch interno): si falla el log, la acción
principal se completa igualmente.

### 4. tools.ts — Soft delete

**Problema:** `delete_client` borraba en cascada (activities, events, documents, tasks,
opportunities, client). Datos irrecuperables.

**Cambio:** Ahora marca `status = 'Eliminado'` en vez de borrar. Los datos permanecen
en la base de datos y son recuperables.

**Nota:** Si prefieres usar un campo `deleted_at` (timestamp), cambia la línea:
```typescript
.update({ status: 'Eliminado' })
```
por:
```typescript
.update({ deleted_at: new Date().toISOString() })
```
y añade `.is('deleted_at', null)` a las queries de listado.

### 5. tools.ts — Sanitización de búsquedas

**Problema:** El input del usuario se inyectaba directamente en queries ilike:
```typescript
.or(`first_name.ilike.%${query}%,...`)
```
Un input con `%` o `_` podía alterar los resultados.

**Cambio:** Nueva función `sanitizeSearch()` que escapa caracteres especiales de
Postgres antes de usarlos en ilike.

### 6. tools.ts — Mejoras menores

- `list_tasks` ahora filtra por `assigned_to: ctx.crmUserId` (antes mostraba tareas de todos)
- `get_agenda` ahora filtra por `owner_id: ctx.crmUserId`
- `list_opportunities` acepta filtro por etapa (útil para "qué oportunidades hay en negociación")
- `get_daily_summary` incluye contador de tareas vencidas (`overdueTasks`)
- Las tools devuelven objetos limpios (nombre, título) en vez de registros completos con UUIDs

### 7. webhook/route.ts — Idempotencia

**Problema:** Si Telegram reenviaba un webhook (timeout, error de red), el mismo
mensaje se procesaba 2-3 veces. Resultado: clientes o tareas duplicadas.

**Cambio:** Set en memoria de `update_id` ya procesados. Si llega uno repetido,
se ignora. El Set se limpia automáticamente al pasar de 1.000 entradas.

**Limitación:** En memoria = no compartido entre instancias de Vercel. Para producción
con múltiples instancias, migrar a Redis o a una tabla de Supabase.

### 8. webhook/route.ts — Código refactorizado

- Lógica de voz extraída a `transcribeVoice()` (más legible, testeable)
- Lógica de /vincular extraída a `handleLinkCommand()`
- El catch global siempre devuelve 200 a Telegram (evita reintentos infinitos)
- El catch intenta notificar al usuario con mensaje limpio

### 9. llmClient.ts — Modelo por defecto

- Modelo por defecto cambiado de `llama-3.3-70b-versatile` a `llama-3.1-8b-instant`
- Mapeo de modelos centralizado en `GROQ_MODEL_MAP` (fácil de extender)
- Temperatura por defecto: 0.2
- maxSteps por defecto: 3
- Soporte añadido para prefijo `claude-` (por si queréis probar Anthropic)

---

## Cómo aplicar los cambios

1. Reemplaza los 4 archivos con las versiones nuevas
2. En tu `.env`, cambia (o añade):
   ```
   LLM_MODEL=llama-3.1-8b-instant
   ```
3. Despliega a Vercel
4. Prueba con "Hola" en Telegram — debería responder sin error de rate limit
5. Prueba "Crea cliente Test Bot empresa TestCorp" — debe aparecer la actividad en el CRM

---

## Qué hacer si el 8B no es suficiente

Si notas que el modelo 8B falla en mensajes complejos (ambigüedad, múltiples acciones),
cambia `DEFAULT_MODEL` en `runner.ts` a `'groq-llama-3-70b'` y sube al Dev Tier de Groq
(~5€/mes). Con las otras optimizaciones (historial reducido, maxSteps 3, temperatura 0.2),
el 70B consumirá ~5x menos que antes incluso pagando.

---

## Archivo eliminable

`src/lib/agent/interpreter.ts` — Es código muerto. El runner usa tool calling del AI SDK,
no este intérprete con regex. Se puede borrar sin afectar nada.
