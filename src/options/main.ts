import type { AppSettings } from '../types/settings.ts'
import type { LLMProvider } from '../types/fact-check.ts'

const form = document.getElementById('settings-form') as HTMLFormElement
const status = document.getElementById('status') as HTMLElement

async function loadSettings(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
    const settings: AppSettings = response.payload

    ;(document.getElementById('llm-select') as HTMLSelectElement).value = settings.selectedLLM
    ;(document.getElementById('openai-key') as HTMLInputElement).value = settings.apiKeys.openai || ''
    ;(document.getElementById('claude-key') as HTMLInputElement).value = settings.apiKeys.claude || ''
    ;(document.getElementById('gemini-key') as HTMLInputElement).value = settings.apiKeys.gemini || ''
    ;(document.getElementById('cache-expiry') as HTMLInputElement).value = String(settings.cacheExpiryHours)
    ;(document.getElementById('max-text') as HTMLInputElement).value = String(settings.maxTextLength)
    ;(document.getElementById('auto-extract') as HTMLInputElement).checked = settings.autoExtract
  } catch {
    showStatus('설정을 불러올 수 없습니다.', 'error')
  }
}

function getVal(id: string): string {
  return (document.getElementById(id) as HTMLInputElement)?.value ?? ''
}

function getChecked(id: string): boolean {
  return (document.getElementById(id) as HTMLInputElement)?.checked ?? false
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const partial: Partial<AppSettings> = {
    selectedLLM: getVal('llm-select') as LLMProvider,
    apiKeys: {
      openai: getVal('openai-key') || undefined,
      claude: getVal('claude-key') || undefined,
      gemini: getVal('gemini-key') || undefined,
    },
    cacheExpiryHours: parseInt(getVal('cache-expiry'), 10) || 24,
    maxTextLength: parseInt(getVal('max-text'), 10) || 8000,
    autoExtract: getChecked('auto-extract'),
  }

  try {
    await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', payload: partial })
    showStatus('설정이 저장되었습니다.', 'success')
  } catch {
    showStatus('설정 저장에 실패했습니다.', 'error')
  }
})

document.getElementById('btn-reset')?.addEventListener('click', async () => {
  if (confirm('설정을 초기화하시겠습니까?')) {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', payload: {} })
      if (response.payload) {
        await loadSettings()
        showStatus('설정이 초기화되었습니다.', 'success')
      }
    } catch {
      showStatus('초기화에 실패했습니다.', 'error')
    }
  }
})

function showStatus(msg: string, type: 'success' | 'error'): void {
  status.textContent = msg
  status.className = `status ${type}`
  setTimeout(() => {
    status.className = 'status'
  }, 3000)
}

document.addEventListener('DOMContentLoaded', loadSettings)
