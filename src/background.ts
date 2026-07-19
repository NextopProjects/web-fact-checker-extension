/**
 * Background Service Worker 진입점
 * 메시지 리스너 등록 및 초기화
 */

import { handlePopupMessage } from './background/message-handler'

console.log('[Background] Service worker started')

/**
 * Popup에 메시지 보내기
 * 팝업이 열려있을 때만 전송 가능
 */
function sendToPopup(message: { type: string; payload?: unknown }): void {
  chrome.runtime.sendMessage(message).catch(() => {
    // 팝업이 닫혀있을 수 있으므로 무시
    console.log('[Background] Popup에 메시지 전송 실패 (팝업이 닫혀있을 수 있음)')
  })
}

/**
 * 메시지 리스너 등록
 */
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; payload?: unknown },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    console.log('[Background] 메시지 수신:', message.type, 'from:', sender.id)

    // Popup에서 온 메시지 처리
    if (sender.id === chrome.runtime.id) {
      return handlePopupMessage(message, sendResponse, sendToPopup)
    }

    return false
  },
)

/**
 * 설치/업데이트 시 처리
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] 설치/업데이트:', details.reason)

  if (details.reason === 'install') {
    console.log('[Background] 확장 프로그램 설치 완료')
  } else if (details.reason === 'update') {
    console.log('[Background] 확장 프로그램 업데이트 완료')
  }
})
