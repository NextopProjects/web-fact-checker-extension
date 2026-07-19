/**
 * 설정 관련 타입 정의
 */

/** Provider 유형 */
export type ProviderType = 'openai' | 'anthropic' | 'gemini'

/** 설정 */
export interface Settings {
  /** 사용할 Provider */
  provider: ProviderType
  /** API 키 */
  apiKey: string
  /** 모델 이름 */
  model: string
  /** 분석 언어 */
  language: 'ko' | 'en'
  /** 캐시 유효 기간 (밀리초, 기본: 7일) */
  cacheTTL: number
}

/** 분석 히스토리 항목 */
export interface HistoryEntry {
  /** 고유 식별자 */
  id: string
  /** 분석 대상 페이지 URL */
  url: string
  /** 페이지 제목 */
  title: string
  /** 분석 시각 (Unix timestamp) */
  timestamp: number
  /** 분석 결과 */
  result: AnalysisResponse
}

/** 기본 설정값 */
export const DEFAULT_SETTINGS: Settings = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  language: 'ko',
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7일
}

// AnalysisResponse을 settings.ts에서 가져오기 위해 재정의
// 실제 타입은 fact-check.ts에서 정의됨
import type { AnalysisResponse } from './fact-check'
