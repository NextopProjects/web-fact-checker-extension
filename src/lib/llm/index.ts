import type { LLMAdapter, LLMProvider } from '../../types/fact-check.ts'
import type { AppSettings } from '../../types/settings.ts'
import { OpenAIAdapter } from './openai.ts'
import { ClaudeAdapter } from './claude.ts'
import { GeminiAdapter } from './gemini.ts'

export function createLLMAdapter(settings: AppSettings): LLMAdapter {
  switch (settings.selectedLLM) {
    case 'openai':
      return new OpenAIAdapter({ apiKey: settings.apiKeys.openai ?? '' })
    case 'claude':
      return new ClaudeAdapter({ apiKey: settings.apiKeys.claude ?? '' })
    case 'gemini':
      return new GeminiAdapter({ apiKey: settings.apiKeys.gemini ?? '' })
    default:
      return new OpenAIAdapter({ apiKey: settings.apiKeys.openai ?? '' })
  }
}

export function getAdapterForProvider(provider: LLMProvider, apiKey: string): LLMAdapter {
  switch (provider) {
    case 'openai':
      return new OpenAIAdapter({ apiKey })
    case 'claude':
      return new ClaudeAdapter({ apiKey })
    case 'gemini':
      return new GeminiAdapter({ apiKey })
  }
}

export type { LLMAdapter }
