/**
 * Content Script 진입점
 * 웹 페이지에 주입되어 본문 추출 담당
 */

import { initContentScript } from './content/injector'

console.log('[Content] Content script loaded')

// DOM 준비 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript)
} else {
  initContentScript()
}
