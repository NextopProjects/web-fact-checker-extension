import { renderFactCheckPanel } from './components/fact-check-panel.ts'
import { renderHistoryPanel } from './components/history-panel.ts'
import { renderDashboardPanel } from './components/dashboard-panel.ts'
import { renderSettingsPanel } from './components/settings-panel.ts'

type PanelName = 'fact-check' | 'history' | 'dashboard' | 'settings'

const PANEL_RENDERERS: Record<PanelName, (container: HTMLElement) => void> = {
  'fact-check': renderFactCheckPanel,
  history: renderHistoryPanel,
  dashboard: renderDashboardPanel,
  settings: renderSettingsPanel,
}

function initTabs(): void {
  const tabs = document.querySelectorAll('.tab')
  const panels = document.querySelectorAll('.panel')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const panelName = (tab as HTMLElement).dataset.panel as PanelName

      tabs.forEach((t) => t.classList.remove('active'))
      panels.forEach((p) => p.classList.remove('active'))

      tab.classList.add('active')
      const panel = document.getElementById(`panel-${panelName}`)
      if (panel) {
        panel.classList.add('active')
        PANEL_RENDERERS[panelName](panel)
      }
    })
  })

  const firstPanel = document.getElementById('panel-fact-check')
  if (firstPanel) {
    PANEL_RENDERERS['fact-check'](firstPanel)
  }
}

document.addEventListener('DOMContentLoaded', initTabs)
