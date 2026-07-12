import type { Verdict } from './index.ts'

export interface AnalyzeOptions {
  language?: string
  maxTokens?: number
  temperature?: number
}

export interface LLMResponse {
  claim: string
  verdict: Verdict
  confidence: number
  explanation: string
  sources?: string[]
  rawResponse: string
  model: string
}

export interface LLMAdapter {
  name: string
  analyze(text: string, options?: AnalyzeOptions): Promise<LLMResponse>
  isAvailable(): Promise<boolean>
}

export type LLMProvider = 'openai' | 'claude' | 'gemini'
