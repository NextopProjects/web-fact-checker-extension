/**
 * 로딩 상태 렌더링
 */

/**
 * 로딩 스피너 HTML 생성
 * @param message 표시할 메시지
 * @returns HTML 문자열
 */
export function renderLoading(message = '분석 중...'): string {
  return `
    <div class="loading">
      <div class="spinner"></div>
      <div class="loading-text">${escapeHtml(message)}</div>
    </div>
  `
}

/**
 * 에러 메시지 HTML 생성
 * @param message 에러 메시지
 * @returns HTML 문자열
 */
export function renderError(message: string): string {
  return `
    <div class="error">
      <p>${escapeHtml(message)}</p>
    </div>
  `
}

/**
 * 빈 상태 HTML 생성
 * @param message 표시할 메시지
 * @returns HTML 문자열
 */
export function renderEmpty(message = '분석할 페이지가 없습니다'): string {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">📄</div>
      <p>${escapeHtml(message)}</p>
    </div>
  `
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
