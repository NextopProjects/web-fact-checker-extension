/**
 * 분석 오케스트레이터
 * 텍스트 분석 파이프라인 관리
 */

import { createProvider } from '../providers/factory'
import { getCachedResult, setCachedResult, getDefaultCacheTTL } from './cache-manager'
import { preprocessText, validateTextLength, hashText } from '../utils/text'
import { storageGet, storageSet } from '../utils/storage'
import type { AnalysisResult, AnalysisResponse } from '../types/fact-check'
import type { Settings } from '../types/settings'
import type { HistoryEntry } from '../types/settings'

/** 기본 설정 */
const DEFAULT_SETTINGS: Settings = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  language: 'ko',
  cacheTTL: 7 * 24 * 60 * 60 * 1000,
}

/** 히스토리 저장소 키 */
const HISTORY_KEY = 'history'

/**
 * 설정 조회
 */
async function getSettings(): Promise<Settings> {
  const settings = await storageGet<Settings>('settings', DEFAULT_SETTINGS)
  console.log('[FactChecker] 설정 조회:', settings)
  return settings
}

/**
 * 히스토리 조회
 */
async function getHistory(): Promise<HistoryEntry[]> {
  return storageGet<HistoryEntry[]>(HISTORY_KEY, [])
}

/**
 * 히스토리에 항목 추가
 */
async function addToHistory(entry: HistoryEntry): Promise<void> {
  const history = await getHistory()
  history.unshift(entry) // 최신 항목을 앞에 추가

  // 최대 50개 항목 유지
  const maxHistory = 50
  if (history.length > maxHistory) {
    history.splice(maxHistory)
  }

  await storageSet(HISTORY_KEY, history)
}

/**
 * 재시도 로직이 포함된 API 호출
 */
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // 재시도하지 않는 에러
      if (isNonRetryableError(lastError)) {
        throw lastError
      }

      // 마지막 시도인 경우
      if (attempt === maxRetries) {
        break
      }

      // 지수 백오프
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 10000)
      console.log(
        `[FactChecker] 재시도 ${attempt + 1}/${maxRetries}: ${delay}ms 대기`,
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('알 수 없는 에러')
}

/**
 * 재시도하지 않는 에러인지 확인
 */
function isNonRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return (
    message.includes('api 키') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('invalid') ||
    message.includes('unauthorized')
  )
}

/**
 * AnalysisResponse를 AnalysisResult로 변환
 */
function toAnalysisResult(
  response: AnalysisResponse,
  url: string,
  title: string,
  text: string,
  textHash: string,
  model: string,
): AnalysisResult {
  return {
    id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    url,
    title,
    text,
    textHash,
    claims: response.claims,
    overallScore: response.overallScore,
    summary: response.summary,
    provider: response.provider,
    model,
    timestamp: response.timestamp,
    language: 'ko',
  }
}

/**
 * 팩트체크 분석 실행
 * @param tabId 활성 탭 ID
 * @param sendToPopup Popup에 결과를 보내는 콜백
 */
export async function runAnalysis(
  tabId: number,
  sendToPopup: (message: { type: string; payload?: unknown }) => void,
): Promise<void> {
  const startTime = Date.now()
  console.log('[FactChecker] 분석 시작')

  try {
    // 1. 설정 조회
    const settings = await getSettings()
    if (!settings.apiKey) {
      sendToPopup({
        type: 'ERROR',
        payload: { message: 'API 키를 설정해주세요' },
      })
      return
    }

    // 2. 활성 탭 정보 조회
    const tab = await chrome.tabs.get(tabId)
    const url = tab.url || ''
    const title = tab.title || ''

    // 3. Content Script에 텍스트 추출 요청
    sendToPopup({
      type: 'ANALYSIS_PROGRESS',
      payload: { status: '텍스트 추출 중...' },
    })

    let textResult: { content: string; title?: string; error?: string }
    try {
      textResult = await chrome.tabs.sendMessage(tabId, {
        type: 'EXTRACT_PAGE_CONTENT',
      })
    } catch {
      sendToPopup({
        type: 'ERROR',
        payload: { message: '페이지에서 텍스트를 추출할 수 없습니다' },
      })
      return
    }

    if ('error' in textResult) {
      sendToPopup({
        type: 'ERROR',
        payload: { message: textResult.error },
      })
      return
    }

    const extractedText = textResult.content
    const extractedTitle = textResult.title || title

    // 4. 텍스트 전처리
    const processedText = preprocessText(extractedText)
    const validationError = validateTextLength(processedText)
    if (validationError) {
      sendToPopup({
        type: 'ERROR',
        payload: { message: validationError },
      })
      return
    }

    // 5. 캐시 확인
    sendToPopup({
      type: 'ANALYSIS_PROGRESS',
      payload: { status: '캐시 확인 중...' },
    })

    const cacheTTL = getDefaultCacheTTL(settings)
    const cachedResult = await getCachedResult(processedText, cacheTTL)

    if (cachedResult) {
      console.log('[FactChecker] 캐시에서 결과 반환')
      sendToPopup({
        type: 'ANALYSIS_COMPLETE',
        payload: cachedResult,
      })
      return
    }

    // 6. LLM API 호출
    sendToPopup({
      type: 'ANALYSIS_PROGRESS',
      payload: { status: 'AI 분석 중...' },
    })

    const provider = createProvider(settings)
    const response = await callWithRetry(() =>
      provider.analyze({
        text: processedText,
        language: settings.language,
      }),
    )

    // 7. 결과 생성
    const textHash = await hashText(processedText)
    const result = toAnalysisResult(
      response,
      url,
      extractedTitle,
      processedText,
      textHash,
      settings.model,
    )

    // 8. 캐시 저장
    await setCachedResult(processedText, result)

    // 9. 히스토리 저장
    await addToHistory({
      id: result.id,
      url,
      title: extractedTitle,
      timestamp: Date.now(),
      result: response,
    })

    // 10. 결과 전송
    const elapsed = Date.now() - startTime
    console.log(`[FactChecker] 분석 완료: ${elapsed}ms`)

    sendToPopup({
      type: 'ANALYSIS_COMPLETE',
      payload: result,
    })
  } catch (error) {
    console.error('[FactChecker] 분석 실패:', error)
    sendToPopup({
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : '분석에 실패했습니다',
      },
    })
  }
}
