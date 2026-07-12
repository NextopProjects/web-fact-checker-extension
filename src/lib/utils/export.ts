import type { FactCheckResult } from '../../types/index.ts'

export function exportAsJSON(results: FactCheckResult[]): void {
  const data = JSON.stringify(results, null, 2)
  downloadFile(data, 'fact-check-results.json', 'application/json')
}

export function exportAsMarkdown(results: FactCheckResult[]): void {
  const lines = results.map((r) => {
    const verdictKo = verdictToKorean(r.verdict)
    const date = new Date(r.timestamp).toLocaleString('ko-KR')
    return [
      `## ${verdictKo} — ${date}`,
      `**주장**: ${r.claim}`,
      `**신뢰도**: ${(r.confidence * 100).toFixed(0)}%`,
      `**설명**: ${r.explanation}`,
      `**출처**: ${r.url}`,
      r.sources?.length ? `**참고 자료**: ${r.sources.join(', ')}` : '',
      `---`,
    ]
      .filter(Boolean)
      .join('\n')
  })

  const content = `# 팩트체크 결과\n\n${lines.join('\n\n')}`
  downloadFile(content, 'fact-check-results.md', 'text/markdown')
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function verdictToKorean(verdict: string): string {
  const map: Record<string, string> = {
    true: '사실',
    false: '거짓',
    mixed: '부분적 사실',
    unverifiable: '검증 불가',
    misleading: '오해의 소지',
  }
  return map[verdict] || verdict
}
