/**
 * 분석 히스토리 렌더링
 */

import type { HistoryEntry } from '../../types/settings'

/**
 * 히스토리 HTML 생성
 * @param entries 히스토리 항목 목록
 * @returns HTML 문자열
 */
export function renderHistory(entries: HistoryEntry[]): string {
  if (entries.length === 0) {
    return `
      <div class="history">
        <h2>분석 히스토리</h2>
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p>분석 기록이 없습니다</p>
        </div>
      </div>
    `
  }

  return `
    <div class="history">
      <h2>분석 히스토리</h2>
      <ul class="history-list">
        ${entries.map(renderHistoryItem).join('')}
      </ul>
    </div>
  `
}

/**
 * 개별 히스토리 항목 렌더링
 */
function renderHistoryItem(entry: HistoryEntry): string {
  const date = new Date(entry.timestamp).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const score = entry.result.overallScore
  const scoreClass = getScoreClass(score)

  return `
    <li class="history-item" data-id="${entry.id}">
      <div class="history-item-title">${escapeHtml(entry.title || '제목 없음')}</div>
      <div class="history-item-meta">
        <span>${date}</span>
        <span class="${scoreClass}">${score}점</span>
      </div>
    </li>
  `
}

/**
 * 점수 클래스 반환
 */
function getScoreClass(score: number): string {
  if (score >= 70) return 'score-high'
  if (score >= 40) return 'score-medium'
  return 'score-low'
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
