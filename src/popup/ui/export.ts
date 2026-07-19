/**
 * 결과 내보내기
 */

import type { HistoryEntry } from '../../types/settings'

/**
 * JSON 형식으로 내보내기
 * @param entry 내보낼 항목
 * @returns JSON 문자열
 */
export function exportAsJson(entry: HistoryEntry): string {
  return JSON.stringify(entry, null, 2)
}

/**
 * 텍스트 형식으로 내보내기
 * @param entry 내보낼 항목
 * @returns 텍스트 문자열
 */
export function exportAsText(entry: HistoryEntry): string {
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
    lines.push(
      `   판정: ${getVerdictLabel(claim.verdict)} (신뢰도: ${(claim.confidence * 100).toFixed(0)}%)`,
    )
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

/**
 * 파일 다운로드 트리거
 * @param content 파일 내용
 * @param filename 파일 이름
 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'

  document.body.appendChild(a)
  a.click()

  // 정리
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
