import type { DashboardStats, Verdict } from '../../types/index.ts'

const VERDICT_LABELS: Record<Verdict, string> = {
  true: '사실',
  false: '거짓',
  mixed: '부분적 사실',
  unverifiable: '검증 불가',
  misleading: '오해의 소지',
}

const VERDICT_COLORS: Record<Verdict, string> = {
  true: '#2ecc71',
  false: '#e74c3c',
  mixed: '#f39c12',
  unverifiable: '#95a5a6',
  misleading: '#e67e22',
}

export function renderDashboardPanel(container: HTMLElement): void {
  container.innerHTML = '<div class="loading-spinner">통계를 불러오는 중...</div>'
  loadStats(container)
}

async function loadStats(container: HTMLElement): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_DASHBOARD_STATS' })
    const stats: DashboardStats = response.payload

    if (stats.totalChecks === 0) {
      container.innerHTML = '<div class="empty-state">아직 팩트체크 기록이 없습니다.</div>'
      return
    }

    const avgConfidence = (stats.averageConfidence * 100).toFixed(0)

    const barChartHtml = Object.entries(stats.verdictCounts)
      .map(([verdict, count]) => {
        const pct = stats.totalChecks > 0 ? (count / stats.totalChecks) * 100 : 0
        const v = verdict as Verdict
        return `
          <div class="dashboard-stat">
            <span class="verdict-${v}">${VERDICT_LABELS[v]}</span>
            <span>${count}건 (${pct.toFixed(0)}%)</span>
          </div>
          <div style="background:#eee;border-radius:4px;height:8px;margin-bottom:0.5rem;">
            <div style="background:${VERDICT_COLORS[v]};height:100%;width:${pct}%;border-radius:4px;"></div>
          </div>
        `
      })
      .join('')

    container.innerHTML = `
      <div style="margin-bottom:1rem;">
        <div class="dashboard-stat">
          <span>총 팩트체크</span>
          <strong>${stats.totalChecks}건</strong>
        </div>
        <div class="dashboard-stat">
          <span>평균 신뢰도</span>
          <strong>${avgConfidence}%</strong>
        </div>
      </div>
      <h2 style="font-size:0.9rem;margin-bottom:0.5rem;">판정 분포</h2>
      ${barChartHtml}
    `
  } catch {
    container.innerHTML = '<div class="error-message">통계를 불러올 수 없습니다.</div>'
  }
}
