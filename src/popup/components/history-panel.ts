import type { FactCheckResult, Verdict } from '../../types/index.ts'
import { renderResultCard } from './fact-check-panel.ts'

const VERDICT_LABELS: Record<Verdict, string> = {
  true: '사실',
  false: '거짓',
  mixed: '부분적 사실',
  unverifiable: '검증 불가',
  misleading: '오해의 소지',
}

export function renderHistoryPanel(container: HTMLElement): void {
  container.innerHTML = `
    <div class="history-controls" style="display:flex;justify-content:space-between;margin-bottom:0.75rem;">
      <button class="outline" id="btn-clear-history" style="font-size:0.75rem;">전체 삭제</button>
      <button class="outline" id="btn-export-json" style="font-size:0.75rem;">JSON 내보내기</button>
      <button class="outline" id="btn-export-md" style="font-size:0.75rem;">Markdown 내보내기</button>
    </div>
    <div id="history-list"></div>
  `

  const listEl = container.querySelector('#history-list') as HTMLElement
  loadHistory(listEl)

  container.querySelector('#btn-clear-history')?.addEventListener('click', async () => {
    if (confirm('전체 이력을 삭제하시겠습니까?')) {
      await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' })
      loadHistory(listEl)
    }
  })

  container.querySelector('#btn-export-json')?.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY', page: 1, limit: 9999 })
    if (response.payload) {
      const { exportAsJSON } = await import('../../lib/utils/export.ts')
      exportAsJSON(response.payload)
    }
  })

  container.querySelector('#btn-export-md')?.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY', page: 1, limit: 9999 })
    if (response.payload) {
      const { exportAsMarkdown } = await import('../../lib/utils/export.ts')
      exportAsMarkdown(response.payload)
    }
  })
}

async function loadHistory(listEl: HTMLElement): Promise<void> {
  listEl.innerHTML = '<div class="loading-spinner">이력을 불러오는 중...</div>'

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY', page: 1, limit: 50 })
    const history: FactCheckResult[] = response.payload || []

    if (history.length === 0) {
      listEl.innerHTML = '<div class="empty-state">팩트체크 이력이 없습니다.</div>'
      return
    }

    listEl.innerHTML = history
      .map(
        (item) => `
        <div class="history-item" data-id="${item.id}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="verdict-${item.verdict}" style="font-weight:600;font-size:0.85rem;">
              ${VERDICT_LABELS[item.verdict]}
            </span>
            <span class="history-meta">${new Date(item.timestamp).toLocaleDateString('ko-KR')}</span>
          </div>
          <div style="font-size:0.8rem;margin-top:0.25rem;">${escapeHtml(item.claim)}</div>
          <div class="history-meta">신뢰도: ${(item.confidence * 100).toFixed(0)}%</div>
        </div>
      `,
      )
      .join('')

    listEl.querySelectorAll('.history-item').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.id
        const item = history.find((h) => h.id === id)
        if (item) {
          showHistoryDetail(listEl, item)
        }
      })
    })
  } catch {
    listEl.innerHTML = '<div class="error-message">이력을 불러올 수 없습니다.</div>'
  }
}

function showHistoryDetail(container: HTMLElement, item: FactCheckResult): void {
  container.innerHTML = `
    <button class="outline" id="btn-back" style="font-size:0.75rem;margin-bottom:0.75rem;">← 목록으로</button>
    ${renderResultCard(item)}
  `
  container.querySelector('#btn-back')?.addEventListener('click', () => {
    loadHistory(container)
  })
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
