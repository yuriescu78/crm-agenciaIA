/**
 * Agent Runner
 * Processes user messages through the LLM with tool-calling capabilities.
 * This is the main entry point for the Telegram bot's AI logic.
 */

import { llmClient } from '@/lib/llm/llmClient';
import { buildCrmTools } from './tools';
import { loadConversationHistory, saveMessage } from './memory';
import { getAgentConfig } from './actions';
import type { ToolContext } from '@/lib/llm/types';

const DEFAULT_SYSTEM_PROMPT = `Eres ElitorBot, el Copiloto Comercial y Asistente Ejecutivo IA del sistema ELITOR.IA CRM. 
Tu misión es gestionar la cartera de clientes, tareas, reuniones y oportunidades de ventas del usuario a través de Telegram, operando con la máxima eficiencia, proactividad y precisión.

### 💼 ROL Y TONO
- Eres un asistente de alto nivel: resolutivo, profesional y directo, pero con un trato cercano (usa "tú").
- Responde siempre en español de forma hiper-concisa.
- Formatea tus respuestas para lectura rápida en móvil (usa emojis elegantes, **negritas** para datos clave y listas con viñetas).
- NUNCA muestres IDs técnicos de la base de datos (ejemplo: 6dac2d32-f6df...). Si necesitas referenciar un objeto, usa su nombre o título.
- **IMPORTANTE**: Ignora el formato de mensajes anteriores si contenían IDs. Ese formato está obsoleto. Usa solo nombres legibles a partir de ahora.

### 🛠 MANEJO DE CONVERSACIÓN
1. **Saludos y "¿Qué pasa?":** Si el usuario te saluda o pregunta qué está pasando, llama a la herramienta get_daily_summary para darle un briefing ejecutivo (tareas para hoy, reuniones, etc.) de forma motivadora.
2. **Acción Directa:** Si el usuario pide "Añade a Carlos de Acme Corp", no preguntes más. Llama a create_client y confirma: "✅ Cliente añadido."
3. **Inferencia Inteligente:** Si falta información menor, asume un valor lógico (Prioridad Media, Contacto Inicial) para no frenar el flujo.
4. **Confirmaciones:** SOLO pide confirmación antes de borrar registros.

### 📈 VALOR AÑADIDO
- Destaca siempre lo urgente ("Ojo, tienes 2 tareas de alta prioridad hoy").
- Si una búsqueda no da resultados, ofrece soluciones (ej: "¿Quieres que cree este cliente ahora?").`;

export async function processUserMessage(
  userText: string,
  ctx: ToolContext
): Promise<string> {
  try {
    // 1. Obtener configuración e historial en paralelo para reducir latencia
    // Si es un saludo, ignoramos el historial para forzar el nuevo formato y romper bucles de IDs feos.
    const shouldIgnoreHistory = userText.toLowerCase().trim() === 'hola' || userText.toLowerCase().includes('que pasa');
    
    const [agentConfig, history] = await Promise.all([
      getAgentConfig(ctx.crmUserId),
      shouldIgnoreHistory ? Promise.resolve([]) : loadConversationHistory(ctx.telegramId, 10)
    ]);

    const systemPrompt = agentConfig?.instructions 
      ? `${DEFAULT_SYSTEM_PROMPT}\n\n### INSTRUCCIONES PERSONALIZADAS:\n${agentConfig.instructions}`
      : DEFAULT_SYSTEM_PROMPT;
    const model = agentConfig?.model || 'groq-llama-3-70b';
    const temperature = agentConfig?.temperature ?? 0.7;

    // 2. Construir tools con el contexto del usuario
    const tools = buildCrmTools(ctx);

    // 4. Llamar al LLM con tool-calling automático
    const result = await llmClient.chat({
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: userText },
      ],
      tools,
      maxSteps: 5,
      temperature,
      modelIdentifier: model,
    });

    // 4. Guardar en historial
    await saveMessage(ctx.telegramId, 'user', userText);
    await saveMessage(ctx.telegramId, 'assistant', result.text);

    return result.text || 'No he podido generar una respuesta. ¿Puedes reformular tu pregunta?';
  } catch (error) {
    console.error('Error processing user message:', error);

    // Provide a user-friendly error message, but include the raw error for debugging
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return '⚠️ Error de configuración: el servicio de IA no está disponible en este momento. Contacta al administrador.';
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return '⏳ El servicio está temporalmente saturado. Inténtalo de nuevo en unos segundos.';
      }
      return `❌ Error técnico del sistema: ${error.message}\n\n(Por favor, haz captura de este error para el desarrollador)`;
    }

    return `❌ Ha ocurrido un error desconocido procesando tu mensaje.`;
  }
}
