/**
 * 콘텐츠 스크립트 초기화
 */

import { extractPageContent } from './text-extractor'
import type { TextExtractionResult } from '../types/fact-check'

/**
 * 콘텐츠 스크립트 초기화
 * DOM 준비 후 텍스트 추출기 등록
 */
export function initContentScript(): void {
  console.log('[Content] 콘텐츠 스크립트 초기화')

  // Background에서 텍스트 추출 요청 시 처리
  chrome.runtime.onMessage.addListener(
    (
      message: { type: string },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: TextExtractionResult | { error: string }) => void,
    ) => {
      if (message.type === 'EXTRACT_PAGE_CONTENT') {
        console.log('[Content] 텍스트 추출 요청 수신')

        try {
          const result = extractPageContent()
          console.log(`[Content] 텍스트 추출 완료: ${result.length}자`)
          sendResponse(result)
        } catch (error) {
          console.error('[Content] 텍스트 추출 실패:', error)
          sendResponse({ error: '텍스트 추출에 실패했습니다' })
        }

        // true를 반환하여 비동기 응답을 알림
        return true
      }
      return false
    },
  )
}
