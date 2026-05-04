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
