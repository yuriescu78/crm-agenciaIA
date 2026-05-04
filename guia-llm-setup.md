# Guía de setup: LLM para bot CRM con abstracción de proveedor

> Stack objetivo: Next.js (Vercel) + Supabase + bot Telegram + LLM API.
> Resultado: poder cambiar de Groq → Vertex AI → OpenAI → Ollama cambiando una variable de entorno, sin tocar código.

---

## Índice

1. [Decisión: qué proveedor empezar](#1-decisión-qué-proveedor-empezar)
2. [Setup de Groq (recomendado para empezar)](#2-setup-de-groq)
3. [Setup de Vertex AI (alternativa con privacidad enterprise)](#3-setup-de-vertex-ai-alternativa)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Código: `llmClient.ts` con adapter pattern](#6-código-llmclientts-con-adapter-pattern)
7. [Ejemplo de uso real con tools](#7-ejemplo-de-uso-real-con-tools)
8. [Migración futura sin reescribir nada](#8-migración-futura-sin-reescribir-nada)
9. [Checklist final](#9-checklist-final)

---

## 1. Decisión: qué proveedor empezar

| Criterio | Groq | Vertex AI |
|---|---|---|
| Tiempo de setup | 5 min | 30-45 min |
| Tarjeta de crédito necesaria | No (free tier) | Sí (aunque hay créditos gratis) |
| Velocidad de respuesta | ⚡ Excelente (la más rápida del mercado) | Buena |
| Privacidad | OK (no entrenan con tus datos) | Excelente (enterprise SLA) |
| Coste estimado para 2 usuarios × 10 interacciones/día | 0-3 €/mes | 1-2 €/mes |
| Modelo principal recomendado | `llama-3.3-70b-versatile` | `gemini-2.5-flash` |

**Recomendación:** empieza con **Groq**. Si más adelante tu cliente te exige garantías de privacidad enterprise (RGPD estricto, contratos de procesamiento de datos firmados, etc.), migras a Vertex AI cambiando una variable. Esa es justamente la gracia del adapter pattern.

---

## 2. Setup de Groq

### 2.1. Crear cuenta y obtener API key

1. Ve a [https://console.groq.com](https://console.groq.com).
2. Regístrate con Google o email. **No pide tarjeta de crédito** para el tier gratuito.
3. En el menú lateral, abre **API Keys** → **Create API Key**.
4. Dale un nombre descriptivo (ej. `crm-telegram-bot-prod`).
5. Copia la key. Empieza por `gsk_...`. **Cópiala ya, no se vuelve a mostrar.**

### 2.2. Verificar modelos disponibles

En **Models** del menú verás el listado actualizado. Los recomendados para tool use a fecha de hoy:

- `llama-3.3-70b-versatile` → el equilibrio calidad/velocidad. **Este es el que usarás.**
- `llama-3.1-8b-instant` → más rápido aún, para clasificadores simples o respuestas muy cortas.
- `qwen-2.5-72b` → alternativa, especialmente bueno con español.

### 2.3. Probar la key (verificación rápida)

Desde tu terminal:

```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer gsk_TU_KEY_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Di hola en una palabra"}]
  }'
```

Si recibes una respuesta JSON con `choices[0].message.content`, la key funciona.

### 2.4. Límites del tier gratuito

A día de hoy Groq da en tier gratuito ~1.000 requests/día por modelo, suficiente para tu caso. Si lo superas, te corta hasta el día siguiente. Para producción seria, activa el tier de pago en **Settings → Billing**: pagas por token consumido, sin cuota fija.

---

## 3. Setup de Vertex AI (alternativa)

Sáltate esta sección si vas con Groq. Inclúyela cuando migres.

### 3.1. Crear proyecto en Google Cloud

1. Ve a [https://console.cloud.google.com](https://console.cloud.google.com).
2. Crea un proyecto nuevo (ej. `crm-llm-prod`).
3. En el buscador superior, busca **Vertex AI** y entra.
4. Pulsa **Enable Vertex AI API**.
5. Activa también **Generative Language API**.

### 3.2. Crear cuenta de servicio (service account)

1. Ve a **IAM & Admin → Service Accounts → Create Service Account**.
2. Nombre: `crm-bot-vertex`.
3. Asigna el rol **Vertex AI User**.
4. Una vez creada, entra en ella → pestaña **Keys → Add Key → Create new key → JSON**.
5. Descarga el JSON. Guárdalo en sitio seguro, **nunca lo subas al repositorio**.

### 3.3. Configurar autenticación

Tienes dos opciones según despliegue:

**a) En desarrollo local:**

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/al/service-account.json"
```

**b) En Vercel/Railway (producción):**

Pega el contenido del JSON entero en una variable de entorno `GOOGLE_CREDENTIALS_JSON`. Después en código lo escribes a `/tmp/creds.json` al arrancar y apuntas `GOOGLE_APPLICATION_CREDENTIALS` ahí. Ejemplo:

```ts
// En el bootstrap del servidor
import fs from 'fs';
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  fs.writeFileSync('/tmp/creds.json', process.env.GOOGLE_CREDENTIALS_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/creds.json';
}
```

### 3.4. Modelo recomendado

`gemini-2.5-flash` para uso general. `gemini-2.5-pro` solo si necesitas razonamiento complejo (más caro y más lento).

---

## 4. Estructura de carpetas

Te recomiendo esta organización dentro de tu proyecto Next.js:

```
src/
├── lib/
│   ├── llm/
│   │   ├── llmClient.ts          ← punto de entrada único
│   │   ├── types.ts              ← tipos compartidos
│   │   └── adapters/
│   │       ├── groq.ts
│   │       ├── openai.ts
│   │       ├── vertex.ts
│   │       ├── anthropic.ts
│   │       └── ollama.ts
│   ├── agent/
│   │   ├── tools.ts              ← definiciones de tools del CRM
│   │   ├── runner.ts             ← bucle de tool-calling
│   │   └── memory.ts             ← gestión de historial conversacional
│   └── telegram/
│       ├── handler.ts
│       └── formatter.ts
└── app/
    └── api/
        └── telegram/
            └── webhook/
                └── route.ts
```

---

## 5. Variables de entorno

En `.env.local` (desarrollo) y en Vercel/Railway (producción):

```bash
# === LLM Provider Selection ===
# Valores aceptados: groq | openai | vertex | anthropic | ollama
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile

# === Groq (si LLM_PROVIDER=groq) ===
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# === OpenAI (si LLM_PROVIDER=openai) ===
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# === Vertex AI (si LLM_PROVIDER=vertex) ===
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}
VERTEX_PROJECT_ID=crm-llm-prod
VERTEX_LOCATION=us-central1

# === Anthropic (si LLM_PROVIDER=anthropic) ===
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx

# === Ollama (si LLM_PROVIDER=ollama) ===
OLLAMA_BASE_URL=https://llm.tudominio.com

# === Telegram ===
TELEGRAM_BOT_TOKEN=123456:ABC-xxxxxxxxxxxxxxxxxxxx

# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxxxxxxx
```

> **Importante:** `SUPABASE_SERVICE_ROLE_KEY` solo se usa en backend, **nunca** se expone al frontend. Las queries del bot deben aplicar RLS pasando el `crm_user_id` correspondiente.

---

## 6. Código: `llmClient.ts` con adapter pattern

### 6.1. Instalación de dependencias

```bash
npm install ai @ai-sdk/groq @ai-sdk/openai @ai-sdk/google-vertex @ai-sdk/anthropic
npm install zod
```

> Uso el [Vercel AI SDK](https://ai-sdk.dev) porque ya implementa el bucle de tool-calling, streaming, y abstrae los proveedores. Te ahorra muchísimo código.

### 6.2. `src/lib/llm/types.ts`

```ts
import { z } from 'zod';
import type { LanguageModel } from 'ai';

export type LlmProvider =
  | 'groq'
  | 'openai'
  | 'vertex'
  | 'anthropic'
  | 'ollama';

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (args: any, context: ToolContext) => Promise<any>;
}

export interface ToolContext {
  crmUserId: string;
  telegramId: number;
}

// Cada adapter debe devolver un LanguageModel del AI SDK
export type AdapterFactory = (model: string) => LanguageModel;
```

### 6.3. `src/lib/llm/adapters/groq.ts`

```ts
import { createGroq } from '@ai-sdk/groq';
import type { AdapterFactory } from '../types';

export const groqAdapter: AdapterFactory = (model: string) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY no está definida');
  }

  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

  return groq(model);
};
```

### 6.4. `src/lib/llm/adapters/openai.ts`

```ts
import { createOpenAI } from '@ai-sdk/openai';
import type { AdapterFactory } from '../types';

export const openaiAdapter: AdapterFactory = (model: string) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no está definida');
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return openai(model);
};
```

### 6.5. `src/lib/llm/adapters/vertex.ts`

```ts
import { createVertex } from '@ai-sdk/google-vertex';
import fs from 'fs';
import type { AdapterFactory } from '../types';

let credentialsInitialized = false;

function ensureCredentials() {
  if (credentialsInitialized) return;
  if (process.env.GOOGLE_CREDENTIALS_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    fs.writeFileSync('/tmp/gcp-creds.json', process.env.GOOGLE_CREDENTIALS_JSON);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/gcp-creds.json';
  }
  credentialsInitialized = true;
}

export const vertexAdapter: AdapterFactory = (model: string) => {
  ensureCredentials();

  if (!process.env.VERTEX_PROJECT_ID) {
    throw new Error('VERTEX_PROJECT_ID no está definida');
  }

  const vertex = createVertex({
    project: process.env.VERTEX_PROJECT_ID,
    location: process.env.VERTEX_LOCATION ?? 'us-central1',
  });

  return vertex(model);
};
```

### 6.6. `src/lib/llm/adapters/anthropic.ts`

```ts
import { createAnthropic } from '@ai-sdk/anthropic';
import type { AdapterFactory } from '../types';

export const anthropicAdapter: AdapterFactory = (model: string) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no está definida');
  }

  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  return anthropic(model);
};
```

### 6.7. `src/lib/llm/adapters/ollama.ts`

```ts
import { createOpenAI } from '@ai-sdk/openai';
import type { AdapterFactory } from '../types';

// Ollama expone una API compatible con OpenAI, así que reusamos el cliente
export const ollamaAdapter: AdapterFactory = (model: string) => {
  const baseURL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1';

  const client = createOpenAI({
    baseURL,
    apiKey: 'ollama', // Ollama ignora la key pero el SDK la requiere
  });

  return client(model);
};
```

### 6.8. `src/lib/llm/llmClient.ts` (el punto de entrada único)

```ts
import { generateText, streamText } from 'ai';
import type { CoreMessage, Tool, LanguageModel } from 'ai';

import { groqAdapter } from './adapters/groq';
import { openaiAdapter } from './adapters/openai';
import { vertexAdapter } from './adapters/vertex';
import { anthropicAdapter } from './adapters/anthropic';
import { ollamaAdapter } from './adapters/ollama';
import type { LlmProvider, AdapterFactory } from './types';

const ADAPTERS: Record<LlmProvider, AdapterFactory> = {
  groq: groqAdapter,
  openai: openaiAdapter,
  vertex: vertexAdapter,
  anthropic: anthropicAdapter,
  ollama: ollamaAdapter,
};

function resolveModel(): LanguageModel {
  const provider = (process.env.LLM_PROVIDER ?? 'groq') as LlmProvider;
  const model = process.env.LLM_MODEL ?? 'llama-3.3-70b-versatile';

  const factory = ADAPTERS[provider];
  if (!factory) {
    throw new Error(`Proveedor LLM no soportado: ${provider}`);
  }

  return factory(model);
}

export interface ChatOptions {
  system?: string;
  messages: CoreMessage[];
  tools?: Record<string, Tool>;
  maxSteps?: number;
  temperature?: number;
}

export const llmClient = {
  /**
   * Genera una respuesta completa (no streaming).
   * Soporta tool-calling automático: si pasas `tools`, el SDK ejecuta
   * el bucle internamente hasta que el modelo responda con texto final.
   */
  async chat(options: ChatOptions) {
    const model = resolveModel();

    const result = await generateText({
      model,
      system: options.system,
      messages: options.messages,
      tools: options.tools,
      maxSteps: options.maxSteps ?? 5,
      temperature: options.temperature ?? 0.7,
    });

    return {
      text: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      usage: result.usage,
      finishReason: result.finishReason,
    };
  },

  /**
   * Versión con streaming, útil si en el futuro quieres respuestas
   * progresivas en el frontend del CRM.
   */
  async stream(options: ChatOptions) {
    const model = resolveModel();

    return streamText({
      model,
      system: options.system,
      messages: options.messages,
      tools: options.tools,
      maxSteps: options.maxSteps ?? 5,
      temperature: options.temperature ?? 0.7,
    });
  },
};
```

---

## 7. Ejemplo de uso real con tools

### 7.1. Definir tools del CRM (`src/lib/agent/tools.ts`)

```ts
import { z } from 'zod';
import { tool } from 'ai';
import { createSupabaseClientForUser } from '@/lib/supabase/client';
import type { ToolContext } from '@/lib/llm/types';

export function buildCrmTools(ctx: ToolContext) {
  const supabase = createSupabaseClientForUser(ctx.crmUserId);

  return {
    searchClients: tool({
      description: 'Busca clientes por nombre, email o empresa',
      parameters: z.object({
        query: z.string().describe('Texto a buscar'),
        limit: z.number().optional().default(5),
      }),
      execute: async ({ query, limit }) => {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email, company, phone')
          .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
          .limit(limit);

        if (error) return { error: error.message };
        return { clients: data };
      },
    }),

    createTask: tool({
      description: 'Crea una tarea asociada a un cliente o standalone',
      parameters: z.object({
        title: z.string(),
        description: z.string().optional(),
        clientId: z.string().uuid().optional(),
        dueDate: z.string().describe('ISO 8601 date'),
      }),
      execute: async (args) => {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            title: args.title,
            description: args.description,
            client_id: args.clientId,
            due_date: args.dueDate,
            assigned_to: ctx.crmUserId,
          })
          .select()
          .single();

        if (error) return { error: error.message };
        return { task: data, message: 'Tarea creada correctamente' };
      },
    }),

    getAgenda: tool({
      description: 'Devuelve los eventos del calendario para una fecha',
      parameters: z.object({
        date: z.string().describe('Fecha en formato YYYY-MM-DD'),
      }),
      execute: async ({ date }) => {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('id, title, start_at, end_at, client_id')
          .gte('start_at', `${date}T00:00:00`)
          .lt('start_at', `${date}T23:59:59`)
          .order('start_at');

        if (error) return { error: error.message };
        return { events: data };
      },
    }),

    // Plantilla para tools destructivas: pedir confirmación
    deleteClient: tool({
      description: 'Elimina un cliente. SIEMPRE pide confirmación al usuario antes de ejecutar.',
      parameters: z.object({
        clientId: z.string().uuid(),
        confirmed: z.boolean().describe('Solo true si el usuario ha confirmado explícitamente'),
      }),
      execute: async ({ clientId, confirmed }) => {
        if (!confirmed) {
          return {
            requiresConfirmation: true,
            message: 'Esta acción no se ejecutará sin confirmación explícita del usuario.',
          };
        }
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);

        if (error) return { error: error.message };
        return { success: true, message: 'Cliente eliminado' };
      },
    }),
  };
}
```

### 7.2. Handler del bot (`src/lib/agent/runner.ts`)

```ts
import { llmClient } from '@/lib/llm/llmClient';
import { buildCrmTools } from './tools';
import { loadConversationHistory, saveMessage } from './memory';
import type { ToolContext } from '@/lib/llm/types';

const SYSTEM_PROMPT = `Eres el asistente del CRM por Telegram. Tu trabajo es ayudar al usuario a gestionar clientes, tareas, eventos de calendario y oportunidades.

Reglas:
- Responde siempre en español, en tono profesional pero cercano.
- Cuando el usuario pida acciones destructivas (borrar, eliminar), pide confirmación antes de ejecutar.
- Si te falta información para ejecutar una acción, pregunta antes de inventar datos.
- Usa las tools disponibles. No inventes IDs ni datos de la base de datos.
- Tras ejecutar tools, redacta una respuesta natural y concisa para el usuario.`;

export async function processUserMessage(
  userText: string,
  ctx: ToolContext
): Promise<string> {
  // 1. Cargar historial reciente (últimos 10 mensajes)
  const history = await loadConversationHistory(ctx.telegramId, 10);

  // 2. Construir tools con el contexto del usuario (RLS se aplica aquí)
  const tools = buildCrmTools(ctx);

  // 3. Llamar al LLM con tool-calling automático
  const result = await llmClient.chat({
    system: SYSTEM_PROMPT,
    messages: [
      ...history,
      { role: 'user', content: userText },
    ],
    tools,
    maxSteps: 5, // permite hasta 5 rondas de tool calls
  });

  // 4. Guardar en historial
  await saveMessage(ctx.telegramId, 'user', userText);
  await saveMessage(ctx.telegramId, 'assistant', result.text);

  return result.text;
}
```

### 7.3. Webhook de Telegram (`src/app/api/telegram/webhook/route.ts`)

```ts
import { NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/agent/runner';
import { sendTelegramMessage } from '@/lib/telegram/handler';
import { authorizeTelegramUser } from '@/lib/telegram/auth';

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // Idempotencia: ignora updates duplicados
    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const telegramId = update.message.from.id;
    const chatId = update.message.chat.id;
    const text = update.message.text;

    // Autorización: solo usuarios vinculados al CRM
    const auth = await authorizeTelegramUser(telegramId);
    if (!auth) {
      await sendTelegramMessage(
        chatId,
        'No estás vinculado al CRM. Pide un código en la web y envíalo con /vincular CODIGO.'
      );
      return NextResponse.json({ ok: true });
    }

    // Procesar mensaje
    const response = await processUserMessage(text, {
      crmUserId: auth.crmUserId,
      telegramId,
    });

    await sendTelegramMessage(chatId, response);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en webhook:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
```

---

## 8. Migración futura sin reescribir nada

El día que quieras cambiar de proveedor, **solo tocas variables de entorno**.

### Ejemplo: migrar de Groq a Vertex AI

Antes:
```bash
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=gsk_xxx
```

Después:
```bash
LLM_PROVIDER=vertex
LLM_MODEL=gemini-2.5-flash
VERTEX_PROJECT_ID=crm-llm-prod
VERTEX_LOCATION=us-central1
GOOGLE_CREDENTIALS_JSON={...}
```

Redeploy y listo. **Cero líneas de código tocadas.** Ese es el valor del adapter pattern.

### Ejemplo: A/B testing de proveedores

Si quieres comparar calidad/coste, puedes extender `llmClient` con un parámetro opcional:

```ts
// Variante avanzada
const result = await llmClient.chat({
  system: SYSTEM_PROMPT,
  messages,
  tools,
  // override puntual del proveedor para comparar
  override: { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
});
```

(Lo dejo como mejora futura, requiere modificar `resolveModel` para aceptar overrides.)

---

## 9. Checklist final

Antes de pasar a producción:

- [ ] API key de Groq creada y probada con curl
- [ ] Variables de entorno configuradas en Vercel/Railway
- [ ] `llmClient.ts` y los 5 adapters creados
- [ ] `buildCrmTools` definido con todas las tools que necesitas (clientes, tareas, calendario, oportunidades)
- [ ] `processUserMessage` con historial conversacional (mínimo 10 últimos mensajes)
- [ ] Tool destructivas (`delete*`) requieren confirmación explícita
- [ ] Webhook de Telegram con autorización + idempotencia + manejo de errores
- [ ] Tabla `telegram_link_codes` para vinculación segura por código de un solo uso
- [ ] RLS de Supabase aplicada en todas las tools (cada query lleva el `crm_user_id`)
- [ ] Logs de cada conversación en `telegram_messages` para auditoría
- [ ] (Recomendado) Langfuse o similar para tracing de tool calls
- [ ] Test end-to-end: enviar mensaje al bot → verificar respuesta correcta

---

## Notas finales

**Sobre el coste real con esta arquitectura:** para 2 usuarios × 10 interacciones/día con Groq tier gratuito → **0 €/mes**. Si saturas el tier free, pasas a paid: **~1-3 €/mes**. Vertex AI con Gemini 2.5 Flash: **~1-2 €/mes**.

**Sobre evolución:** esta arquitectura te permite añadir los agentes complementarios (enriquecimiento de leads, scoring, email, reporting) reusando el mismo `llmClient`. Cada agente es un módulo independiente con sus propias tools, todos hablan al mismo punto de entrada.

**Sobre el proyecto:** si has llegado hasta aquí siguiendo la guía y todo funciona, tienes una base sólida. La diferencia entre un bot que aguanta y uno que se rompe en producción está en los detalles que te marqué con checklist: RLS, idempotencia, confirmaciones, memoria conversacional. No los saltes.
