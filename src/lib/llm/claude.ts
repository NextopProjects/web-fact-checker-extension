import type { LLMAdapter, AnalyzeOptions, LLMResponse } from '../../types/fact-check.ts'
import type { Verdict } from '../../types/index.ts'
import { SYSTEM_PROMPT, buildFactCheckPrompt } from './prompts.ts'

interface ClaudeConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}

export class ClaudeAdapter implements LLMAdapter {
  name = 'claude'
  private config: ClaudeConfig

  constructor(config: ClaudeConfig) {
    this.config = config
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey
  }

  async analyze(text: string, options?: AnalyzeOptions): Promise<LLMResponse> {
    const apiKey = this.config.apiKey
    if (!apiKey) throw new Error('Claude API 키가 설정되지 않았습니다.')

    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com/v1'
    const model = this.config.model || 'claude-3-5-haiku-20241022'

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens ?? 2000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildFactCheckPrompt(text, options?.language) },
        ],
        temperature: options?.temperature ?? 0.3,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API 오류: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const rawContent = data.content?.[0]?.text ?? ''

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
