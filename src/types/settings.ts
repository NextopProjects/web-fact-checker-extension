import type { LLMProvider } from './fact-check.ts'

export interface AppSettings {
  selectedLLM: LLMProvider
  apiKeys: {
    openai?: string
    claude?: string
    gemini?: string
  }
  language: string
  cacheExpiryHours: number
  autoExtract: boolean
  targetDomains: string[]
  maxTextLength: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  selectedLLM: 'openai',
  apiKeys: {},
  language: 'ko',
  cacheExpiryHours: 24,
  autoExtract: false,
  targetDomains: [],
  maxTextLength: 8000,
}
