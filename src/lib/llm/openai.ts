import type { LLMAdapter, AnalyzeOptions, LLMResponse } from '../../types/fact-check.ts'
import type { Verdict } from '../../types/index.ts'
import { SYSTEM_PROMPT, buildFactCheckPrompt } from './prompts.ts'

interface OpenAIConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}

export class OpenAIAdapter implements LLMAdapter {
  name = 'openai'
  private config: OpenAIConfig

  constructor(config: OpenAIConfig) {
    this.config = config
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey
  }

  async analyze(text: string, options?: AnalyzeOptions): Promise<LLMResponse> {
    const apiKey = this.config.apiKey
    if (!apiKey) throw new Error('OpenAI API 키가 설정되지 않았습니다.')

    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1'
    const model = this.config.model || 'gpt-4o-mini'

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildFactCheckPrompt(text, options?.language) },
        ],
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API 오류: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content ?? ''

    return this.parseResponse(rawContent, model)
  }

  private parseResponse(raw: string, model: string): LLMResponse {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('LLM 응답에서 JSON을 파싱할 수 없습니다.')
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      claim?: string
      verdict?: string
      confidence?: number
      explanation?: string
      sources?: string[]
    }

    const validVerdicts: Verdict[] = ['true', 'false', 'mixed', 'unverifiable', 'misleading']
    const verdict = validVerdicts.includes(parsed.verdict as Verdict)
      ? (parsed.verdict as Verdict)
      : 'unverifiable'

    return {
      claim: parsed.claim || '',
      verdict,
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
      explanation: parsed.explanation || '',
      sources: parsed.sources,
      rawResponse: raw,
      model,
    }
  }
}
