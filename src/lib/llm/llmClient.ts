import { generateText, streamText, stepCountIs } from 'ai';
import type { ModelMessage, Tool, LanguageModel } from 'ai';

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
  messages: ModelMessage[];
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
