/**
 * 팩트체크 결과 렌더링
 */

import type { AnalysisResult, ClaimResult, Source } from '../../types/fact-check'

/**
 * 결과 HTML 생성
 * @param result 분석 결과
 * @returns HTML 문자열
 */
export function renderResult(result: AnalysisResult): string {
  return `
    <div class="result">
      ${renderScoreSection(result.overallScore)}
      ${renderSummary(result.summary)}
      ${renderClaims(result.claims)}
      ${renderExportButtons(result.id)}
    </div>
  `
}

/**
 * 점수 섹션 렌더링
 */
function renderScoreSection(score: number): string {
  const scoreClass = getScoreClass(score)
  const label = getScoreLabel(score)

  return `
    <div class="score-section">
      <div class="score-circle ${scoreClass}">
        ${score}
      </div>
      <div class="score-label">${label}</div>
    </div>
  `
}

/**
 * 요약 렌더링
 */
function renderSummary(summary: string): string {
  return `
    <div class="summary">
      ${escapeHtml(summary)}
    </div>
  `
}

/**
 * 주장 목록 렌더링
 */
function renderClaims(claims: ClaimResult[]): string {
  if (claims.length === 0) {
    return `
      <div class="claims-section">
        <h3>주장 분석</h3>
        <p>추출된 주장이 없습니다.</p>
      </div>
    `
  }

  return `
    <div class="claims-section">
      <h3>주장 분석 (${claims.length}개)</h3>
      ${claims.map(renderClaim).join('')}
    </div>
  `
}

/**
 * 개별 주장 렌더링
 */
function renderClaim(claim: ClaimResult): string {
  const verdictClass = `verdict-${claim.verdict}`
  const verdictLabel = getVerdictLabel(claim.verdict)
  const confidencePercent = Math.round(claim.confidence * 100)

  return `
    <div class="claim-card ${verdictClass}">
      <div class="claim-text">${escapeHtml(claim.text)}</div>
      <div class="claim-meta">
        <span class="verdict-badge ${verdictClass}">${verdictLabel}</span>
        <span>신뢰도: ${confidencePercent}%</span>
      </div>
      <div class="claim-reasoning">
        <strong>근거:</strong> ${escapeHtml(claim.reasoning)}
      </div>
      ${renderSources(claim.sources)}
    </div>
  `
}

/**
 * 출처 목록 렌더링
 */
function renderSources(sources: Source[]): string {
  if (sources.length === 0) {
    return ''
  }

  return `
    <div class="claim-sources">
      <details>
        <summary>출처 (${sources.length}개)</summary>
        <ul>
          ${sources.map(renderSource).join('')}
        </ul>
      </details>
    </div>
  `
}

/**
 * 개별 출처 렌더링
 */
function renderSource(source: Source): string {
  const reliabilityPercent = Math.round(source.reliability * 100)
  const link = source.url
    ? `<a href="${escapeHtml(source.url)}" target="_blank">${escapeHtml(source.title)}</a>`
    : escapeHtml(source.title)

  return `
    <li>
      ${link}
      <span class="source-type">(${escapeHtml(source.type)})</span>
      <span class="source-reliability">신뢰도: ${reliabilityPercent}%</span>
    </li>
  `
}

/**
 * 내보내기 버튼 렌더링
 */
function renderExportButtons(resultId: string): string {
  return `
    <div class="export-buttons">
      <button class="btn-icon export-btn" data-format="json" data-id="${resultId}">
        JSON 내보내기
      </button>
      <button class="btn-icon export-btn" data-format="text" data-id="${resultId}">
        텍스트 내보내기
      </button>
    </div>
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
 * 점수 라벨 반환
 */
function getScoreLabel(score: number): string {
  if (score >= 80) return '매우 높은 신뢰도'
  if (score >= 60) return '높은 신뢰도'
  if (score >= 40) return '보통 신뢰도'
  if (score >= 20) return '낮은 신뢰도'
  return '매우 낮은 신뢰도'
}

/**
 * 진위 판정 라벨 반환
 */
function getVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'true':
      return '사실'
    case 'false':
      return '거짓'
    case 'mixed':
      return '혼합'
    case 'unverifiable':
      return '검증 불가'
    default:
      return verdict
  }
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
