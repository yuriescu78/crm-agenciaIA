import { generateText, streamText, stepCountIs } from 'ai';
import type { ModelMessage, LanguageModel } from 'ai';

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

/**
 * Mapeo de identificadores de UI a modelos reales.
 * Cambio v2: por defecto usa 8B (5x más margen en free tier).
 */
const GROQ_MODEL_MAP: Record<string, string> = {
  'groq-llama-3-70b': 'llama-3.3-70b-versatile',
  'groq-llama-3-8b': 'llama-3.1-8b-instant',
};

function resolveModel(overrideIdentifier?: string): LanguageModel {
  let provider = (process.env.LLM_PROVIDER ?? 'anthropic') as LlmProvider;
  let modelName = process.env.LLM_MODEL ?? 'claude-haiku-4-5-20251001';

  if (overrideIdentifier) {
    if (overrideIdentifier.startsWith('groq-')) {
      provider = 'groq';
      modelName = GROQ_MODEL_MAP[overrideIdentifier] || 'llama-3.1-8b-instant';
    } else if (overrideIdentifier.startsWith('gpt-')) {
      provider = 'openai';
      modelName = overrideIdentifier;
    } else if (overrideIdentifier.startsWith('claude-')) {
      provider = 'anthropic';
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
  async chat(options: ChatOptions) {
    const model = resolveModel(options.modelIdentifier);

    const result = await generateText({
      model,
      system: options.system,
      messages: options.messages,
      tools: options.tools,
      stopWhen: stepCountIs(options.maxSteps ?? 3),
      temperature: options.temperature ?? 0.2,
    });

    return {
      text: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      usage: result.usage,
      finishReason: result.finishReason,
    };
  },

  async stream(options: ChatOptions) {
    const model = resolveModel(options.modelIdentifier);

    return streamText({
      model,
      system: options.system,
      messages: options.messages,
      tools: options.tools,
      stopWhen: stepCountIs(options.maxSteps ?? 3),
      temperature: options.temperature ?? 0.2,
    });
  },
};
