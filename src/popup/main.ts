/**
 * 팝업 메인 스크립트
 * 상태 관리, 메시지 라우팅, UI 전환
 */

import { renderLoading, renderError, renderEmpty } from './ui/loading-state'
import { renderResult } from './ui/result-view'
import { renderSettings, getModelsForProvider } from './ui/settings-view'
import { renderHistory } from './ui/history-view'
import { exportAsJson, exportAsText, downloadFile } from './ui/export'
import type { Settings, ProviderType } from '../types/settings'
import type { HistoryEntry } from '../types/settings'
import type { AnalysisResult } from '../types/fact-check'

/** 앱 상태 타입 */
type AppState = 'idle' | 'loading' | 'result' | 'settings' | 'history' | 'error'

/** 상태 관리 */
let currentState: AppState = 'idle'
let currentResult: AnalysisResult | null = null
let currentSettings: Settings | null = null
let currentHistory: HistoryEntry[] = []

/** DOM 요소 */
const appElement = document.getElementById('app')

/**
 * 초기화
 */
function init(): void {
  console.log('[Popup] 초기화')

  // 이벤트 리스너 등록
  setupEventListeners()

  // 설정 조회 후 렌더링
  sendMessageWithResponse({ type: 'GET_SETTINGS' })
    .then((response) => {
      const res = response as { type: string; payload?: Settings }
      if (res?.payload) {
        currentSettings = res.payload
      }
      render()
    })
    .catch(() => {
      render()
    })

  // 히스토리 조회
  sendMessageWithResponse({ type: 'GET_HISTORY' })
    .then((response) => {
      const res = response as { type: string; payload?: HistoryEntry[] }
      if (res?.payload) {
        currentHistory = res.payload
      }
    })
    .catch(() => {})
}

/**
 * 렌더링
 */
function render(): void {
  if (!appElement) return

  let html = ''

  // 헤더
  html += renderHeader()

  // 현재 상태에 따라 뷰 렌더링
  switch (currentState) {
    case 'idle':
      html += renderIdleView()
      break
    case 'loading':
      html += renderLoading('분석 중...')
      break
    case 'result':
      if (currentResult) {
        html += renderResult(currentResult)
      } else {
        html += renderEmpty()
      }
      break
    case 'settings':
      html += renderSettings(currentSettings || getDefaultSettings())
      break
    case 'history':
      html += renderHistory(currentHistory)
      break
    case 'error':
      html += renderError('에러가 발생했습니다')
      break
  }

  appElement.innerHTML = html

  // 뷰 전환 후 이벤트 리스너 재등록
  attachViewEventListeners()
}

/**
 * 헤더 렌더링
 */
function renderHeader(): string {
  return `
    <div class="header">
      <h1>팩트체크</h1>
      <div class="header-actions">
        <button class="btn-icon" id="btn-home" title="홈">🏠</button>
        <button class="btn-icon" id="btn-history" title="히스토리">📋</button>
        <button class="btn-icon" id="btn-settings" title="설정">⚙️</button>
      </div>
    </div>
  `
}

/**
 * 대기 상태 뷰 렌더링
 */
function renderIdleView(): string {
  return `
    <div class="idle-view">
      <button id="btn-analyze" class="primary" style="width: 100%;">
        분석 시작
      </button>
    </div>
  `
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners(): void {
  // 헤더 버튼 이벤트
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    if (target.id === 'btn-home' || target.closest('#btn-home')) {
      currentState = 'idle'
      currentResult = null
      render()
    } else if (target.id === 'btn-history' || target.closest('#btn-history')) {
      currentState = 'history'
      render()
    } else if (target.id === 'btn-settings' || target.closest('#btn-settings')) {
      currentState = 'settings'
      render()
    } else if (target.id === 'btn-analyze' || target.closest('#btn-analyze')) {
      handleAnalyze()
    }
  })

  // Background에서 온 메시지 수신
  chrome.runtime.onMessage.addListener(
    (message: { type: string; payload?: unknown }) => {
      handleMessage(message)
    },
  )
}

/**
 * 뷰별 이벤트 리스너 등록
 */
function attachViewEventListeners(): void {
  // 분석 시작 버튼
  const analyzeBtn = document.getElementById('btn-analyze')
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', handleAnalyze)
  }

  // 설정 폼
  const settingsForm = document.getElementById('settings-form') as HTMLFormElement
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleSaveSettings)

    // Provider 변경 시 모델 목록 업데이트
    const providerSelect = document.getElementById('provider') as HTMLSelectElement
    const modelSelect = document.getElementById('model') as HTMLSelectElement
    if (providerSelect && modelSelect) {
      providerSelect.addEventListener('change', () => {
        const provider = providerSelect.value as ProviderType
        const models = getModelsForProvider(provider)
        const currentModel = modelSelect.value

        // 모델 목록 업데이트
        modelSelect.innerHTML = models
          .map(
            (model) =>
              `<option value="${model}" ${model === currentModel ? 'selected' : ''}>${model}</option>`,
          )
          .join('')

        // 현재 선택된 모델이 새 목록에 없으면 첫 번째 모델 선택
        if (!models.includes(currentModel)) {
          modelSelect.value = models[0] || ''
        }
      })
    }

    // 취소 버튼
    const cancelBtn = document.getElementById('settings-cancel')
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        currentState = 'idle'
        render()
      })
    }
  }

  // 히스토리 항목 클릭
  const historyItems = document.querySelectorAll('.history-item')
  historyItems.forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id')
      if (id) {
        handleHistoryDetail(id)
      }
    })
  })

  // 내보내기 버튼
  const exportBtns = document.querySelectorAll('.export-btn')
  exportBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const format = btn.getAttribute('data-format') as 'json' | 'text'
      const id = btn.getAttribute('data-id')
      if (format && id) {
        handleExport(format, id)
      }
    })
  })
}

/**
 * 분석 시작 처리
 */
function handleAnalyze(): void {
  currentState = 'loading'
  render()

  sendMessage({ type: 'REQUEST_ANALYSIS' })
}

/**
 * 설정 저장 처리
 */
function handleSaveSettings(e: Event): void {
  e.preventDefault()

  const form = e.target as HTMLFormElement
  const formData = new FormData(form)

  const settings: Settings = {
    provider: formData.get('provider') as Settings['provider'],
    apiKey: formData.get('apiKey') as string,
    model: formData.get('model') as string,
    language: formData.get('language') as Settings['language'],
    cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7일
  }

  // 로컬 상태 즉시 업데이트
  currentSettings = settings

  // 스토리지에 저장 요청 후 응답 대기
  sendMessageWithResponse({ type: 'SAVE_SETTINGS', payload: settings })
    .then(() => {
      // 저장 완료 후 idle로 전환
      currentState = 'idle'
      render()
    })
    .catch((error: Error) => {
      console.error('[Popup] 설정 저장 실패:', error)
      // 에러가 발생해도 idle로 전환
      currentState = 'idle'
      render()
    })
}

/**
 * 히스토리 상세 조회 처리
 */
function handleHistoryDetail(id: string): void {
  sendMessage({ type: 'GET_HISTORY_DETAIL', payload: { id } })
}

/**
 * 내보내기 처리
 */
function handleExport(format: string, id: string): void {
  const entry = currentHistory.find((e) => e.id === id)
  if (!entry) {
    console.error('[Popup] 내보낼 항목을 찾을 수 없습니다:', id)
    return
  }

  let content: string
  let filename: string

  if (format === 'json') {
    content = exportAsJson(entry)
    filename = `factcheck-${entry.id}.json`
  } else {
    content = exportAsText(entry)
    filename = `factcheck-${entry.id}.txt`
  }

  downloadFile(content, filename)
}

/**
 * 메시지 전송
 */
function sendMessage(message: { type: string; payload?: unknown }): void {
  try {
    chrome.runtime.sendMessage(message)
  } catch (error) {
    console.error('[Popup] 메시지 전송 실패:', error)
  }
}

/**
 * 메시지 전송 후 응답 대기
 */
function sendMessageWithResponse(message: { type: string; payload?: unknown }): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Background에서 온 메시지 처리
 */
function handleMessage(message: { type: string; payload?: unknown }): void {
  console.log('[Popup] 메시지 수신:', message.type)

  switch (message.type) {
    case 'ANALYSIS_PROGRESS':
      // 진행 상황 업데이트
      if (message.payload && typeof message.payload === 'object' && 'status' in message.payload) {
        const status = (message.payload as { status: string }).status
        if (appElement) {
          appElement.innerHTML = renderHeader() + renderLoading(status)
        }
      }
      break

    case 'ANALYSIS_COMPLETE':
      // 분석 완료
      if (message.payload) {
        currentResult = message.payload as AnalysisResult
        currentState = 'result'
        render()
      }
      break

    case 'SETTINGS_DATA':
      // 설정 데이터
      if (message.payload) {
        currentSettings = message.payload as Settings
        // 설정 화면이 활성화되어 있으면 재렌더링
        if (currentState === 'settings') {
          render()
        }
      }
      break

    case 'HISTORY_DATA':
      // 히스토리 데이터
      if (message.payload) {
        currentHistory = message.payload as HistoryEntry[]
        // 히스토리 화면이 활성화되어 있으면 재렌더링
        if (currentState === 'history') {
          render()
        }
      }
      break

    case 'HISTORY_DETAIL_DATA':
      // 히스토리 상세 데이터
      if (message.payload) {
        const entry = message.payload as HistoryEntry
        currentResult = entry.result as AnalysisResult
        currentState = 'result'
        render()
      }
      break

    case 'ERROR':
      // 에러
      currentState = 'error'
      if (message.payload && typeof message.payload === 'object' && 'message' in message.payload) {
        const errorMsg = (message.payload as { message: string }).message
        if (appElement) {
          appElement.innerHTML = renderHeader() + renderError(errorMsg)
        }
      } else {
        render()
      }
      break

    default:
      console.log('[Popup] 알 수 없는 메시지:', message.type)
  }
}

/**
 * 기본 설정 반환
 */
function getDefaultSettings(): Settings {
  return {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    language: 'ko',
    cacheTTL: 7 * 24 * 60 * 60 * 1000,
  }
}

// DOM 준비 후 초기화
document.addEventListener('DOMContentLoaded', init)
