import type { AppSettings } from '../../types/settings.ts'
import type { LLMProvider } from '../../types/fact-check.ts'

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  openai: 'OpenAI',
  claude: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
}

export function renderSettingsPanel(container: HTMLElement): void {
  container.innerHTML = '<div class="loading-spinner">설정을 불러오는 중...</div>'
  loadSettings(container)
}

async function loadSettings(container: HTMLElement): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
    const settings: AppSettings = response.payload

    container.innerHTML = `
      <form class="settings-form">
        <label>
          LLM_PROVIDER
          <select id="setting-llm">
            ${Object.entries(PROVIDER_LABELS)
              .map(
                ([key, label]) =>
                  `<option value="${key}" ${settings.selectedLLM === key ? 'selected' : ''}>${label}</option>`,
              )
              .join('')}
          </select>
        </label>

        <label>
          OpenAI API 키
          <input type="password" id="setting-openai-key" placeholder="sk-..." value="${escapeAttr(settings.apiKeys.openai || '')}" />
        </label>

        <label>
          Claude API 키
          <input type="password" id="setting-claude-key" placeholder="sk-ant-..." value="${escapeAttr(settings.apiKeys.claude || '')}" />
        </label>

        <label>
          Gemini API 키
          <input type="password" id="setting-gemini-key" placeholder="AIza..." value="${escapeAttr(settings.apiKeys.gemini || '')}" />
        </label>

        <label>
          캐시 만료 (시간)
          <input type="number" id="setting-cache-expiry" min="1" max="720" value="${settings.cacheExpiryHours}" />
        </label>

        <label>
          최대 텍스트 길이
          <input type="number" id="setting-max-text" min="1000" max="30000" step="1000" value="${settings.maxTextLength}" />
        </label>

        <label style="display:flex;align-items:center;gap:0.5rem;">
          <input type="checkbox" id="setting-auto-extract" ${settings.autoExtract ? 'checked' : ''} />
          자동 본문 추출
        </label>

        <button type="submit" class="btn-primary-custom">설정 저장</button>
      </form>
    `

    container.querySelector('form')?.addEventListener('submit', (e) => {
      e.preventDefault()
      saveSettings(container)
    })
  } catch {
    container.innerHTML = '<div class="error-message">설정을 불러올 수 없습니다.</div>'
  }
}

async function saveSettings(container: HTMLElement): Promise<void> {
  const getVal = (id: string) => (container.querySelector(`#${id}`) as HTMLInputElement)?.value ?? ''
  const getChecked = (id: string) => (container.querySelector(`#${id}`) as HTMLInputElement)?.checked ?? false

  const partial: Partial<AppSettings> = {
    selectedLLM: getVal('setting-llm') as LLMProvider,
    apiKeys: {
      openai: getVal('setting-openai-key') || undefined,
      claude: getVal('setting-claude-key') || undefined,
      gemini: getVal('setting-gemini-key') || undefined,
    },
    cacheExpiryHours: parseInt(getVal('setting-cache-expiry'), 10) || 24,
    maxTextLength: parseInt(getVal('setting-max-text'), 10) || 8000,
    autoExtract: getChecked('setting-auto-extract'),
  }

  try {
    await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', payload: partial })
    const msg = document.createElement('div')
    msg.className = 'result-card'
    msg.style.cssText = 'text-align:center;color:#2ecc71;font-weight:600;'
    msg.textContent = '설정이 저장되었습니다.'
    container.appendChild(msg)
    setTimeout(() => msg.remove(), 2000)
  } catch {
    const msg = document.createElement('div')
    msg.className = 'error-message'
    msg.textContent = '설정 저장에 실패했습니다.'
    container.appendChild(msg)
    setTimeout(() => msg.remove(), 3000)
  }
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
