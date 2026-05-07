/**
 * Agent Runner (v2 - optimizado)
 * 
 * Cambios respecto a v1:
 * - Historial reducido de 10 a 2 mensajes (ahorro ~80% tokens de input)
 * - maxSteps reducido de 5 a 3 (suficiente para el 99% de acciones CRM)
 * - Temperatura por defecto bajada a 0.2 (más determinista = menos tool calls inútiles)
 * - Modelo por defecto cambiado a 8B (5x más margen en free tier de Groq)
 * - Manejo de errores mejorado: nunca expone datos técnicos al usuario
 * - System prompt compactado (~50% menos tokens)
 */

import { llmClient } from '@/lib/llm/llmClient';
import { buildCrmTools } from './tools';
import { loadConversationHistory, saveMessage } from './memory';
import { getAgentConfig } from './actions';
import type { ToolContext } from '@/lib/llm/types';

const DEFAULT_SYSTEM_PROMPT = `Eres ElitorBot, asistente del CRM ELITOR.IA. Gestionas clientes, tareas, reuniones y oportunidades por Telegram.

REGLAS:
- Responde en español, conciso, optimizado para móvil.
- Usa emojis con moderación y **negritas** para datos clave.
- NUNCA muestres IDs técnicos (UUIDs). Usa nombres y títulos.
- Si el usuario saluda o dice "qué pasa", llama a get_daily_summary.
- Acción directa: si dice "Añade a Carlos de Acme Corp", llama a create_client sin preguntar más.
- Si falta info menor (prioridad, etapa), asume valores por defecto: Prioridad Media, Contacto Inicial.
- SOLO pide confirmación antes de BORRAR registros o marcar oportunidad como ganada/perdida.
- Si una búsqueda no da resultados, ofrece crear el registro.
- Destaca lo urgente: "Ojo, tienes 2 tareas de alta prioridad hoy".
- Si hay varios clientes con nombre similar, lista las opciones y pregunta cuál.`;

// Máximo de mensajes de historial a enviar al LLM.
// Cada mensaje extra cuesta ~500 tokens. Con 2 mensajes cubrimos
// el contexto mínimo para follow-ups ("sí, ese" / "cámbialo a...").
const MAX_HISTORY_MESSAGES = 2;

// Máximo de pasos (tool calls encadenados) por mensaje.
// 1 step = buscar cliente, 2 = buscar + actualizar, 3 = seguro extra.
const MAX_STEPS = 3;

// Temperatura por defecto. 0.2 = respuestas consistentes.
// Solo subir si el modelo se repite demasiado (improbable en tool calling).
const DEFAULT_TEMPERATURE = 0.2;

// Modelo por defecto: 8B es suficiente para tool calling y consume 7x menos.
// El 70B se reserva para cuando el usuario lo configure explícitamente.
const DEFAULT_MODEL = 'groq-llama-3-8b';

export async function processUserMessage(
  userText: string,
  ctx: ToolContext
): Promise<string> {
  try {
    // 1. Config + historial en paralelo
    // Para saludos, no necesitamos historial (evita arrastrar formatos viejos)
    const lowerText = userText.toLowerCase().trim();
    const isGreeting = lowerText === 'hola' || lowerText === 'hey'
      || lowerText.includes('que pasa') || lowerText.includes('qué pasa')
      || lowerText === 'buenos días' || lowerText === 'buenas';

    const [agentConfig, history] = await Promise.all([
      getAgentConfig(ctx.crmUserId),
      isGreeting
        ? Promise.resolve([])
        : loadConversationHistory(ctx.telegramId, MAX_HISTORY_MESSAGES),
    ]);

    // Construir prompt: base + instrucciones personalizadas (si las hay)
    const systemPrompt = agentConfig?.instructions
      ? `${DEFAULT_SYSTEM_PROMPT}\n\nINSTRUCCIONES ADICIONALES:\n${agentConfig.instructions}`
      : DEFAULT_SYSTEM_PROMPT;

    const model = agentConfig?.model || DEFAULT_MODEL;
    const temperature = agentConfig?.temperature ?? DEFAULT_TEMPERATURE;

    // 2. Construir tools
    const tools = buildCrmTools(ctx);

    // 3. Llamar al LLM
    const result = await llmClient.chat({
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: userText },
      ],
      tools,
      maxSteps: MAX_STEPS,
      temperature,
      modelIdentifier: model,
    });

    // 4. Guardar en historial (async, no bloqueante para la respuesta)
    // Usamos Promise.all pero no esperamos si falla — el historial no es crítico
    Promise.all([
      saveMessage(ctx.telegramId, 'user', userText),
      saveMessage(ctx.telegramId, 'assistant', result.text),
    ]).catch((err) => console.error('Error guardando historial:', err));

    return result.text || 'No he podido generar una respuesta. ¿Puedes reformular tu pregunta?';
  } catch (error) {
    console.error('Error processing user message:', error);
    return formatUserError(error);
  }
}

/**
 * Formatea errores para el usuario final.
 * NUNCA expone detalles técnicos (org IDs, límites, stack traces).
 * Los detalles quedan en console.error para Sentry/logs.
 */
function formatUserError(error: unknown): string {
  if (!(error instanceof Error)) {
    return '❌ Ha ocurrido un error inesperado. Inténtalo de nuevo.';
  }

  const msg = error.message.toLowerCase();

  // Rate limit: no reintentar, solo informar
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many')) {
    return '⏳ Servicio saturado temporalmente. Espera un par de minutos e inténtalo de nuevo.';
  }

  // API key mal configurada
  if (msg.includes('api_key') || msg.includes('unauthorized') || msg.includes('401')) {
    return '⚠️ El servicio de IA no está disponible. Contacta al administrador.';
  }

  // Timeout (Vercel o Groq)
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('econnreset')) {
    return '⏱️ La respuesta tardó demasiado. Inténtalo con un mensaje más corto.';
  }

  // Modelo no disponible
  if (msg.includes('model') && (msg.includes('not found') || msg.includes('not available'))) {
    return '⚠️ El modelo de IA configurado no está disponible. Contacta al administrador.';
  }

  // Error genérico: mensaje limpio sin datos técnicos
  return '❌ Ha ocurrido un error procesando tu mensaje. Si persiste, contacta al administrador.';
}
