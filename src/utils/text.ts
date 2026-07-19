/**
 * 텍스트 처리 유틸리티
 * 해시 생성, 텍스트 전처리
 */

/** 최대 텍스트 길이 */
const MAX_TEXT_LENGTH = 10_000

/** 최소 텍스트 길이 (분석에 충분하지 않은 텍스트) */
const MIN_TEXT_LENGTH = 100

/**
 * 텍스트의 SHA-256 해시 생성
 * @param text 해시할 텍스트
 * @returns 16진수 해시 문자열
 */
export async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 텍스트 전처리
 * - 최대 길이로 잘라냄
 * - 다중 공백을 단일 공백으로 변환
 * - 앞뒤 공백 제거
 * @param text 전처리할 텍스트
 * @returns 전처리된 텍스트
 */
export function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // 다중 공백 → 단일 공백
    .trim() // 앞뒤 공백 제거
    .slice(0, MAX_TEXT_LENGTH) // 최대 길이로 잘라냄
}

/**
 * 텍스트가 분석 가능한지 확인
 * @param text 확인할 텍스트
 * @returns 분석 가능 여부
 */
export function isAnalyzable(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length >= MIN_TEXT_LENGTH
}

/**
 * 텍스트 길이 검증 에러 메시지 생성
 * @param text 검증할 텍스트
 * @returns 에러 메시지 (유효한 경우 null)
 */
export function validateTextLength(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed.length < MIN_TEXT_LENGTH) {
    return `분석할 텍스트가 부족합니다 (${trimmed.length}자, 최소 ${MIN_TEXT_LENGTH}자 필요)`
  }
  return null
}
