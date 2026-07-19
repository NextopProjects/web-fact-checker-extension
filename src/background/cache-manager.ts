/**
 * 캐시 관리자
 * chrome.storage.local 기반 분석 결과 캐싱
 */

import { storageGet, storageSet } from '../utils/storage'
import { hashText } from '../utils/text'
import type { AnalysisResult } from '../types/fact-check'
import type { Settings } from '../types/settings'

/** 캐시 키 접두사 */
const CACHE_PREFIX = 'cache_'

/** 캐시 엔트리 타입 */
interface CacheEntry {
  result: AnalysisResult
  timestamp: number
}

/**
 * 캐시 키 생성
 * @param text 해시할 텍스트
 * @returns 캐시 키
 */
async function getCacheKey(text: string): Promise<string> {
  const hash = await hashText(text)
  return `${CACHE_PREFIX}${hash}`
}

/**
 * 캐시에서 결과 조회
 * @param text 원본 텍스트
 * @param cacheTTL 캐시 유효 기간 (밀리초)
 * @returns 캐시된 결과 (없거나 만료된 경우 null)
 */
export async function getCachedResult(
  text: string,
  cacheTTL: number,
): Promise<AnalysisResult | null> {
  try {
    const key = await getCacheKey(text)
    const entry = await storageGet<CacheEntry | null>(key, null)

    if (!entry) {
      return null
    }

    // 만료 확인
    const now = Date.now()
    if (now - entry.timestamp > cacheTTL) {
      console.log('[CacheManager] 캐시 만료:', key)
      return null
    }

    console.log('[CacheManager] 캐시 히트:', key)
    return entry.result
  } catch (error) {
    console.warn('[CacheManager] 캐시 조회 실패:', error)
    return null
  }
}

/**
 * 캐시에 결과 저장
 * @param text 원본 텍스트
 * @param result 분석 결과
 */
export async function setCachedResult(
  text: string,
  result: AnalysisResult,
): Promise<void> {
  try {
    const key = await getCacheKey(text)
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
    }
    await storageSet(key, entry)
    console.log('[CacheManager] 캐시 저장:', key)
  } catch (error) {
    console.warn('[CacheManager] 캐시 저장 실패:', error)
  }
}

/**
 * 캐시에서 결과 삭제
 * @param text 원본 텍스트
 */
export async function removeCachedResult(text: string): Promise<void> {
  try {
    const key = await getCacheKey(text)
    await storageSet(key, null)
    console.log('[CacheManager] 캐시 삭제:', key)
  } catch (error) {
    console.warn('[CacheManager] 캐시 삭제 실패:', error)
  }
}

/**
 * 기본 캐시 TTL 조회
 * @param settings 설정
 * @returns 캐시 유효 기간 (밀리초)
 */
export function getDefaultCacheTTL(settings: Settings): number {
  return settings.cacheTTL || 7 * 24 * 60 * 60 * 1000 // 기본 7일
}
