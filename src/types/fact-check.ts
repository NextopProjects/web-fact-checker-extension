/**
 * 팩트체크 결과 관련 타입 정의
 * 도메인 모델: domain-model.md 참조
 */

/** 진위 판정 유형 */
export type Verdict = 'true' | 'false' | 'mixed' | 'unverifiable'

/** 출처 유형 */
export type SourceType = 'academic' | 'government' | 'news' | 'reference' | 'other'

/** 참조 출처 */
export interface Source {
  /** 출처 제목 */
  title: string
  /** 출처 URL (선택사항) */
  url?: string
  /** 출처 신뢰도 (0-1) */
  reliability: number
  /** 출처 유형 */
  type: SourceType
}

/** 개별 주장 분석 결과 */
export interface ClaimResult {
  /** 고유 식별자 */
  id: string
  /** 원문에서 추출된 주장 텍스트 */
  text: string
  /** 원문에서의 시작 위치 */
  startIndex: number
  /** 원문에서의 끝 위치 */
  endIndex: number
  /** 진위 판정 */
  verdict: Verdict
  /** 판정 신뢰도 (0-1) */
  confidence: number
  /** 판정 근거 */
  reasoning: string
  /** 참조 출처 목록 */
  sources: Source[]
}

/** 분석 결과 (최종 출력물) */
export interface AnalysisResult {
  /** 고유 식별자 (UUID) */
  id: string
  /** 분석 대상 페이지 URL */
  url: string
  /** 페이지 제목 */
  title: string
  /** 추출된 본문 텍스트 */
  text: string
  /** 텍스트 해시 (캐시 키) */
  textHash: string
  /** 추출된 주장 목록 */
  claims: ClaimResult[]
  /** 전체 신뢰도 점수 (0-100) */
  overallScore: number
  /** 분석 요약 */
  summary: string
  /** 사용된 Provider 이름 */
  provider: string
  /** 사용된 모델 이름 */
  model: string
  /** 분석 시각 (Unix timestamp) */
  timestamp: number
  /** 분석 언어 */
  language: 'ko' | 'en'
}

/** 텍스트 추출 결과 */
export interface TextExtractionResult {
  /** 페이지 제목 */
  title: string
  /** 추출된 본문 텍스트 */
  content: string
  /** 페이지 URL */
  url: string
  /** 요약 (선택사항) */
  excerpt?: string
  /** 저자 (선택사항) */
  byline?: string
  /** 사이트 이름 (선택사항) */
  siteName?: string
  /** 텍스트 길이 */
  length: number
}

/** 분석 요청 */
export interface AnalysisRequest {
  /** 분석할 텍스트 */
  text: string
  /** 분석 언어 */
  language: 'ko' | 'en'
}

/** 분석 응답 (Provider로부터 받은 원시 응답) */
export interface AnalysisResponse {
  /** 추출된 주장 목록 */
  claims: ClaimResult[]
  /** 전체 신뢰도 점수 (0-100) */
  overallScore: number
  /** 분석 요약 */
  summary: string
  /** Provider 이름 */
  provider: string
  /** 분석 시각 */
  timestamp: number
}
