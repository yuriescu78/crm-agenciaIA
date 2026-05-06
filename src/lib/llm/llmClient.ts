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

function resolveModel(overrideIdentifier?: string): LanguageModel {
  let provider = (process.env.LLM_PROVIDER ?? 'groq') as LlmProvider;
  let modelName = process.env.LLM_MODEL ?? 'llama-3.3-70b-versatile';

  if (overrideIdentifier) {
    if (overrideIdentifier.startsWith('groq-')) {
      provider = 'groq';
      // Mapear los selectores del UI a modelos reales de Groq
      // Llama 3.1 70B es más estable y rápido que 3.3 para esta integración
      modelName = overrideIdentifier.includes('70b') ? 'llama-3.1-70b-versatile' : 'llama-3.1-8b-instant';
    } else if (overrideIdentifier.startsWith('gpt-')) {
      provider = 'openai';
      modelName = overrideIdentifier;
    }
  }

  const factory = ADAPTERS[provider];
  if (!factory) {
    throw new Error(`Proveedor LLM no soportado: ${provider}`);
  }

  return factory(modelName);
}

export interface ChatOptions {
  system?: string;
  messages: ModelMessage[];
  tools?: Record<string, any>;
  maxSteps?: number;
  temperature?: number;
  modelIdentifier?: string;
}

export const llmClient = {
  /**
   * Genera una respuesta completa (no streaming).
   * Soporta tool-calling automático: si pasas `tools`, el SDK ejecuta
   * el bucle internamente hasta que el modelo responda con texto final.
   */
  async chat(options: ChatOptions) {
    const model = resolveModel(options.modelIdentifier);

    const result = await generateText({
      model,
      system: options.system,
      messages: options.messages,
      tools: options.tools,
      stopWhen: stepCountIs(options.maxSteps ?? 5),
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
    const model = resolveModel(options.modelIdentifier);

    return streamText({
      model,
      system: options.system,
      messages: options.messages,
      tools: options.tools,
      stopWhen: stepCountIs(options.maxSteps ?? 5),
      temperature: options.temperature ?? 0.7,
    });
  },
};
