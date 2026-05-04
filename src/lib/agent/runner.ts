/**
 * Agent Runner
 * Processes user messages through the LLM with tool-calling capabilities.
 * This is the main entry point for the Telegram bot's AI logic.
 */

import { llmClient } from '@/lib/llm/llmClient';
import { buildCrmTools } from './tools';
import { loadConversationHistory, saveMessage } from './memory';
import type { ToolContext } from '@/lib/llm/types';

const SYSTEM_PROMPT = `Eres el asistente experto del NexusCRM por Telegram. Tu objetivo es ser extremadamente útil y proactivo.

Reglas de Comportamiento:
- Proactividad: Si el usuario te pide ver clientes, tareas u oportunidades de forma general (ej: "muéstrame mis clientes"), NO preguntes por detalles. USA la herramienta correspondiente inmediatamente y muestra los resultados. Solo pregunta si la petición es totalmente ambigua.
- Tono: Profesional, ejecutivo y eficiente. Responde siempre en español.
- Herramientas: Confía en tus tools. Si el usuario te pide algo que una tool puede hacer, úsala.
- Confirmación: Pide confirmación solo para acciones destructivas (borrar). Para crear o actualizar, informa de lo que vas a hacer o confirma una vez hecho.
- Formato: Usa emojis, negritas y listas para que la lectura en móvil sea perfecta.
- Errores: Si una tool no devuelve datos, informa con naturalidad (ej: "Aún no tienes clientes registrados").`;

export async function processUserMessage(
  userText: string,
  ctx: ToolContext
): Promise<string> {
  try {
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

    return result.text || 'No he podido generar una respuesta. ¿Puedes reformular tu pregunta?';
  } catch (error) {
    console.error('Error processing user message:', error);

    // Provide a user-friendly error message
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return '⚠️ Error de configuración: el servicio de IA no está disponible en este momento. Contacta al administrador.';
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return '⏳ El servicio está temporalmente saturado. Inténtalo de nuevo en unos segundos.';
      }
    }

    return '❌ Ha ocurrido un error procesando tu mensaje. Inténtalo de nuevo o contacta al administrador.';
  }
}
