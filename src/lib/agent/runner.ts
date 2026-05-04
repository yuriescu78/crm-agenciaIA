/**
 * Agent Runner
 * Processes user messages through the LLM with tool-calling capabilities.
 * This is the main entry point for the Telegram bot's AI logic.
 */

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
- Tras ejecutar tools, redacta una respuesta natural y concisa para el usuario.
- Formatea las respuestas de forma legible usando emojis y estructura clara.
- Cuando listes datos, usa formato de lista con viñetas.
- Las fechas deben mostrarse en formato legible en español.
- Si una operación falla, informa al usuario del error de forma clara.`;

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
