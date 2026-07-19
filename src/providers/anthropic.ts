/**
 * Anthropic Claude API 구현체
 * Claude 모델을 사용한 팩트체크 분석
 */

import type { LLMProvider } from './types'
import type { AnalysisRequest, AnalysisResponse } from '../types/fact-check'
import type { ClaimResult } from '../types/fact-check'

/** Anthropic API 응답 타입 */
interface AnthropicResponse {
  content: Array<{
    type: string
    text: string
  }>
}

/** LLM 응답에서 파싱할 JSON 구조 */
interface LLMClaimsResponse {
  claims: Array<{
    text: string
    verdict: 'true' | 'false' | 'mixed' | 'unverifiable'
    confidence: number
    reasoning: string
    sources: Array<{
      title: string
      url?: string
      reliability: number
      type: 'academic' | 'government' | 'news' | 'reference' | 'other'
    }>
  }>
  overallScore: number
  summary: string
}

/**
 * 팩트체크 프롬프트 생성
 */
function buildPrompt(text: string): string {
  return `당신은 팩트체크 전문가입니다. 다음 텍스트에서 주요 주장을 추출하고 각 주장의 진위를 판단해주세요.

텍스트:
${text}

다음 형식의 JSON으로 응답해주세요 (다른 텍스트 없이 JSON만 출력):
{
  "claims": [
    {
      "text": "추출된 주장",
      "verdict": "true|false|mixed|unverifiable",
      "confidence": 0.0-1.0,
      "reasoning": "판정 근거",
      "sources": [
        {
          "title": "출처 제목",
          "url": "출처 URL (선택사항)",
          "reliability": 0.0-1.0,
          "type": "academic|government|news|reference|other"
        }
      ]
    }
  ],
  "overallScore": 0-100,
  "summary": "전체 요약"
}

판정 기준:
- true: 복수의 신뢰할 수 있는 출처에서 확인된 사실
- false: 신뢰할 수 있는 출처에서 반박된 사실
- mixed: 일부 사실이고 일부 거짓인 경우
- unverifiable: 주관적 표현이거나 검증 불가능한 내용`
}

/**
 * JSON 응답 파싱
 */
function parseResponse(content: string): LLMClaimsResponse {
  // JSON 블록 추출 (마크다운 코드 블록 처리)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim()

  try {
    return JSON.parse(jsonStr) as LLMClaimsResponse
  } catch {
    throw new Error('JSON 응답 파싱 실패')
  }
}

/**
 * ClaimResult에 ID 추가
 */
function addIdsToClaims(claims: LLMClaimsResponse['claims']): ClaimResult[] {
  return claims.map((claim, index) => ({
    id: `claim-${Date.now()}-${index}`,
    text: claim.text,
    startIndex: 0,
    endIndex: claim.text.length,
    verdict: claim.verdict,
    confidence: Math.max(0, Math.min(1, claim.confidence)),
    reasoning: claim.reasoning,
    sources: claim.sources.map((source) => ({
      title: source.title,
      url: source.url,
      reliability: Math.max(0, Math.min(1, source.reliability)),
      type: source.type,
    })),
  }))
}

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic'

  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    const prompt = buildPrompt(request.text)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Anthropic API 에러: ${response.status} - ${JSON.stringify(errorData)}`,
      )
    }

    const data = (await response.json()) as AnthropicResponse
    const content = data.content[0]?.text

    if (!content) {
      throw new Error('Anthropic API 응답이 비어있습니다')
    }

    const parsed = parseResponse(content)

    return {
      claims: addIdsToClaims(parsed.claims),
      overallScore: Math.max(0, Math.min(100, parsed.overallScore)),
      summary: parsed.summary,
      provider: this.name,
      timestamp: Date.now(),
    }
  }
}
