/**
 * Provider 팩토리
 * 설정에 따라 적절한 Provider 인스턴스 생성
 */

import type { LLMProvider } from './types'
import type { Settings } from '../types/settings'
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { GeminiProvider } from './gemini'

/**
 * Provider 인스턴스 생성
 * @param settings 설정
 * @returns LLMProvider 인스턴스
 * @throws 지원하지 않는 Provider인 경우
 */
export function createProvider(settings: Settings): LLMProvider {
  if (!settings.apiKey) {
    throw new Error('API 키를 설정해주세요')
  }

  switch (settings.provider) {
    case 'openai':
      return new OpenAIProvider(settings.apiKey, settings.model)
    case 'anthropic':
      return new AnthropicProvider(settings.apiKey, settings.model)
    case 'gemini':
      return new GeminiProvider(settings.apiKey, settings.model)
    default:
      throw new Error(`지원하지 않는 Provider: ${settings.provider}`)
  }
}
