import type { FactCheckResult, Verdict } from '../../types/index.ts'

const VERDICT_LABELS: Record<Verdict, string> = {
  true: '사실',
  false: '거짓',
  mixed: '부분적 사실',
  unverifiable: '검증 불가',
  misleading: '오해의 소지',
}

export function renderFactCheckPanel(container: HTMLElement): void {
  container.innerHTML = `
    <div class="text-preview" id="text-preview">분석할 텍스트를 로드 중...</div>
    <button class="btn-primary-custom" id="btn-fact-check" role="button">팩트체크 시작</button>
    <div id="result-area"></div>
  `

  const btn = container.querySelector('#btn-fact-check') as HTMLButtonElement
  const resultArea = container.querySelector('#result-area') as HTMLElement
  const textPreview = container.querySelector('#text-preview') as HTMLElement

  loadCurrentTabContent(textPreview)

  btn.addEventListener('click', () => startFactCheck(btn, resultArea))
}

async function loadCurrentTabContent(previewEl: HTMLElement): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) {
      previewEl.textContent = '활성 탭을 찾을 수 없습니다.'
      return
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CONTENT' })
    if (response && response.body) {
      const preview = response.body.substring(0, 150) + (response.body.length > 150 ? '...' : '')
      previewEl.textContent = preview
      previewEl.dataset.fullText = response.body
      previewEl.dataset.url = response.url || ''
    } else {
      previewEl.textContent = '본문을 추출할 수 없습니다.'
    }
  } catch {
    previewEl.textContent = '페이지에서 본문을 추출할 수 없습니다.'
  }
}

async function startFactCheck(
  btn: HTMLButtonElement,
  resultArea: HTMLElement,
): Promise<void> {
  const previewEl = document.querySelector('#text-preview') as HTMLElement
  const text = previewEl.dataset.fullText
  const url = previewEl.dataset.url || window.location.href

  if (!text) {
    resultArea.innerHTML = '<div class="error-message">분석할 텍스트가 없습니다.</div>'
    return
  }

  btn.disabled = true
  btn.textContent = '분석 중...'
  resultArea.innerHTML = '<div class="loading-spinner">LLM이 팩트체크를 수행하고 있습니다...</div>'

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'START_FACT_CHECK',
      payload: { text, url },
    })

    if (response.type === 'FACT_CHECK_COMPLETE') {
      resultArea.innerHTML = renderResultCard(response.payload)
    } else if (response.type === 'FACT_CHECK_ERROR') {
      resultArea.innerHTML = `<div class="error-message">${escapeHtml(response.payload.error)}</div>`
    }
  } catch (err) {
    resultArea.innerHTML = `<div class="error-message">오류가 발생했습니다: ${escapeHtml(String(err))}</div>`
  } finally {
    btn.disabled = false
    btn.textContent = '팩트체크 시작'
  }
}

export function renderResultCard(result: FactCheckResult): string {
  const verdictLabel = VERDICT_LABELS[result.verdict] || result.verdict
  const confidence = (result.confidence * 100).toFixed(0)
  const date = new Date(result.timestamp).toLocaleString('ko-KR')

  const sourcesHtml = result.sources?.length
    ? `<div class="sources">${result.sources.map((s) => `<a class="source-link" href="${escapeHtml(s)}" target="_blank">${escapeHtml(s)}</a>`).join('<br>')}</div>`
    : ''

  return `
    <div class="result-card">
      <div class="verdict verdict-${result.verdict}">${verdictLabel}</div>
      <div class="confidence">신뢰도: ${confidence}% | ${result.model} | ${date}</div>
      <div class="explanation">${escapeHtml(result.explanation)}</div>
      ${sourcesHtml}
    </div>
  `
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
