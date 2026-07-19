/**
 * chrome.storage.local 래퍼
 * 캐시 및 설정 저장소 관리
 */

/** 스토리지 키 접두사 */
const KEY_PREFIX = 'wfc_'

/**
 * 스토리지 키 생성
 * @param key 원본 키
 * @returns 접두사가 추가된 키
 */
function prefixedKey(key: string): string {
  return `${KEY_PREFIX}${key}`
}

/**
 * 스토리지에서 값 조회
 * @param key 조회할 키
 * @param defaultValue 기본값 (조회 실패 시 반환)
 * @returns 저장된 값 또는 기본값
 */
export async function storageGet<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const prefixed = prefixedKey(key)
    const result = await chrome.storage.local.get(prefixed)
    const value = result[prefixed]
    console.log(`[Storage] 조회: ${prefixed}`, value !== undefined ? value : '(기본값)')
    return value !== undefined ? (value as T) : defaultValue
  } catch (error) {
    console.error(`[Storage] 조회 실패: ${key}`, error)
    return defaultValue
  }
}

/**
 * 스토리지에 값 저장
 * @param key 저장할 키
 * @param value 저장할 값
 */
export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    const prefixed = prefixedKey(key)
    console.log(`[Storage] 저장 중: ${prefixed}`, value)
    await chrome.storage.local.set({ [prefixed]: value })
    console.log(`[Storage] 저장 완료: ${prefixed}`)
  } catch (error) {
    console.error(`[Storage] 저장 실패: ${key}`, error)
  }
}

/**
 * 스토리지에서 값 삭제
 * @param key 삭제할 키
 */
export async function storageRemove(key: string): Promise<void> {
  try {
    await chrome.storage.local.remove(prefixedKey(key))
  } catch {
    console.warn(`[Storage] 삭제 실패: ${key}`)
  }
}

/**
 * 스토리지 전체 삭제
 */
export async function storageClear(): Promise<void> {
  try {
    const all = await chrome.storage.local.get(null)
    const keysToRemove = Object.keys(all).filter((k) => k.startsWith(KEY_PREFIX))
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove)
    }
  } catch {
    console.warn('[Storage] 전체 삭제 실패')
  }
}

/**
 * 스토리지 사용량 조회
 * @returns 사용된 바이트 수
 */
export async function storageGetBytesInUse(): Promise<number> {
  try {
    return await chrome.storage.local.getBytesInUse(null)
  } catch {
    return 0
  }
}
