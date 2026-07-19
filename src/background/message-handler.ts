/**
 * 메시지 핸들러
 * Popup/Content에서 온 메시지 라우팅 및 처리
 */

import { runAnalysis } from './fact-checker'
import { storageGet, storageSet } from '../utils/storage'
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
 * Popup 메시지 처리
 * @param message Popup에서 온 메시지
 * @param sendResponse 응답 콜백
 * @param sendToPopup Popup에 메시지 보내는 콜백
 */
export function handlePopupMessage(
  message: { type: string; payload?: unknown },
  sendResponse: (response: unknown) => void,
  sendToPopup: (message: { type: string; payload?: unknown }) => void,
): boolean {
  switch (message.type) {
    case 'REQUEST_ANALYSIS':
      // 분석 요청 처리 (비동기)
      handleRequestAnalysis(sendToPopup)
      return true // 비동기 응답

    case 'GET_SETTINGS':
      // 설정 조회
      handleGetSettings(sendResponse)
      return true

    case 'SAVE_SETTINGS':
      // 설정 저장
      handleSaveSettings(message.payload as Settings, sendResponse)
      return true

    case 'GET_HISTORY':
      // 히스토리 조회
      handleGetHistory(sendResponse)
      return true

    case 'GET_HISTORY_DETAIL':
      // 히스토리 상세 조회
      handleGetHistoryDetail(
        (message.payload as { id: string }).id,
        sendResponse,
      )
      return true

    case 'EXPORT_RESULT':
      // 결과 내보내기
      handleExportResult(
        message.payload as { format: string; id: string },
        sendResponse,
      )
      return true

    default:
      console.warn('[MessageHandler] 알 수 없는 메시지:', message.type)
      return false
  }
}

/**
 * 분석 요청 처리
 */
async function handleRequestAnalysis(
  sendToPopup: (message: { type: string; payload?: unknown }) => void,
): Promise<void> {
  try {
    // 활성 탭 조회
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })

    if (!tab?.id) {
      sendToPopup({
        type: 'ERROR',
        payload: { message: '분석할 페이지가 없습니다' },
      })
      return
    }

    // 분석 실행
    await runAnalysis(tab.id, sendToPopup)
  } catch (error) {
    console.error('[MessageHandler] 분석 요청 처리 실패:', error)
    sendToPopup({
      type: 'ERROR',
      payload: {
        message:
          error instanceof Error ? error.message : '분석 요청 처리에 실패했습니다',
      },
    })
  }
}

/**
 * 설정 조회 처리
 */
async function handleGetSettings(
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    const settings = await storageGet<Settings>('settings', DEFAULT_SETTINGS)
    sendResponse({ type: 'SETTINGS_DATA', payload: settings })
  } catch (error) {
    console.error('[MessageHandler] 설정 조회 실패:', error)
    sendResponse({
      type: 'ERROR',
      payload: { message: '설정을 조회할 수 없습니다' },
    })
  }
}

/**
 * 설정 저장 처리
 */
async function handleSaveSettings(
  settings: Settings,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    console.log('[MessageHandler] 설정 저장 시작:', settings)
    await storageSet('settings', settings)
    console.log('[MessageHandler] 설정 저장 완료')
    sendResponse({ type: 'SETTINGS_DATA', payload: settings })
  } catch (error) {
    console.error('[MessageHandler] 설정 저장 실패:', error)
    sendResponse({
      type: 'ERROR',
      payload: { message: '설정을 저장할 수 없습니다' },
    })
  }
}

/**
 * 히스토리 조회 처리
 */
async function handleGetHistory(
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    const history = await storageGet<HistoryEntry[]>(HISTORY_KEY, [])
    sendResponse({ type: 'HISTORY_DATA', payload: history })
  } catch (error) {
    console.error('[MessageHandler] 히스토리 조회 실패:', error)
    sendResponse({
      type: 'ERROR',
      payload: { message: '히스토리를 조회할 수 없습니다' },
    })
  }
}

/**
 * 히스토리 상세 조회 처리
 */
async function handleGetHistoryDetail(
  id: string,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    const history = await storageGet<HistoryEntry[]>(HISTORY_KEY, [])
    const entry = history.find((e) => e.id === id) || null
    sendResponse({ type: 'HISTORY_DETAIL_DATA', payload: entry })
  } catch (error) {
    console.error('[MessageHandler] 히스토리 상세 조회 실패:', error)
    sendResponse({
      type: 'ERROR',
      payload: { message: '히스토리를 조회할 수 없습니다' },
    })
  }
}

/**
 * 결과 내보내기 처리
 */
function handleExportResult(
  payload: { format: string; id: string },
  sendResponse: (response: unknown) => void,
): void {
  try {
    const { format, id } = payload

    // 히스토리에서 해당 항목 조회
    storageGet<HistoryEntry[]>(HISTORY_KEY, []).then((history) => {
      const entry = history.find((e) => e.id === id)
      if (!entry) {
        sendResponse({
          type: 'ERROR',
          payload: { message: '내보낼 항목을 찾을 수 없습니다' },
        })
        return
      }

      let exportData: string

      if (format === 'json') {
        exportData = JSON.stringify(entry, null, 2)
      } else {
        // 텍스트 형식
        exportData = formatAsText(entry)
      }

      sendResponse({ type: 'EXPORT_DATA', payload: exportData })
    })
  } catch (error) {
    console.error('[MessageHandler] 내보내기 처리 실패:', error)
    sendResponse({
      type: 'ERROR',
      payload: { message: '내보내기를 처리할 수 없습니다' },
    })
  }
}

/**
 * 텍스트 형식으로 포맷팅
 */
function formatAsText(entry: HistoryEntry): string {
  const lines: string[] = [
    `팩트체크 결과`,
    `============`,
    ``,
    `URL: ${entry.url}`,
    `제목: ${entry.title}`,
    `분석 시각: ${new Date(entry.timestamp).toLocaleString('ko-KR')}`,
    ``,
    `전체 신뢰도: ${entry.result.overallScore}/100`,
    ``,
    `요약:`,
    entry.result.summary,
    ``,
    `주장 분석:`,
  ]

  entry.result.claims.forEach((claim, index) => {
    lines.push(``)
    lines.push(`${index + 1}. ${claim.text}`)
    lines.push(`   판정: ${claim.verdict} (신뢰도: ${(claim.confidence * 100).toFixed(0)}%)`)
    lines.push(`   근거: ${claim.reasoning}`)
    if (claim.sources.length > 0) {
      lines.push(`   출처:`)
      claim.sources.forEach((source) => {
        lines.push(`     - ${source.title} (${source.type})`)
      })
    }
  })

  return lines.join('\n')
}
