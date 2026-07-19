/**
 * Provider 인터페이스 정의
 * 아키텍처 문서: docs/architecture.md 참조
 */

import type { AnalysisRequest, AnalysisResponse } from '../types/fact-check'

/** LLM Provider 인터페이스 */
export interface LLMProvider {
  /** Provider 이름 */
  readonly name: string

  /** 분석 요청 실행 */
  analyze(request: AnalysisRequest): Promise<AnalysisResponse>
}
