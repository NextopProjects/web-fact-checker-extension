import { createLLMAdapter } from './lib/llm/index.ts'
import { getSettings, updateSettings, addHistoryItem } from './lib/storage/index.ts'
import { getCachedResult, setCachedResult } from './lib/cache/index.ts'
import { hashText } from './lib/utils/hash.ts'
import type { PopupMessage, ContentMessage } from './types/messages.ts'
import type { FactCheckResult, ExtractedContent } from './types/index.ts'
import type { AppSettings } from './types/settings.ts'

let cachedSettings: AppSettings | null = null

async function getOrCreateSettings(): Promise<AppSettings> {
  if (!cachedSettings) {
    cachedSettings = await getSettings()
  }
  return cachedSettings
}

chrome.runtime.onMessage.addListener(
  (message: PopupMessage, _sender, sendResponse) => {
    handleMessage(message, _sender)
      .then(sendResponse)
      .catch((err) => {
        if (message.type === 'START_FACT_CHECK') {
          sendResponse({ type: 'FACT_CHECK_ERROR', payload: { error: String(err) } })
        }
      })
    return true
  },
)

async function handleMessage(
  message: PopupMessage,
  _sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  switch (message.type) {
    case 'START_FACT_CHECK': {
      const settings = await getOrCreateSettings()
      const adapter = createLLMAdapter(settings)

      if (!(await adapter.isAvailable())) {
        return {
          type: 'FACT_CHECK_ERROR',
          payload: { error: `${settings.selectedLLM} API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.` },
        }
      }

      const textHash = await hashText(message.payload.text)
      const cached = await getCachedResult(textHash)

      if (cached) {
        return { type: 'FACT_CHECK_COMPLETE', payload: cached }
      }

      try {
        const response = await adapter.analyze(message.payload.text, {
          language: settings.language,
          maxTokens: 2000,
        })

        const result: FactCheckResult = {
          id: crypto.randomUUID(),
          claim: response.claim,
          verdict: response.verdict,
          confidence: response.confidence,
          explanation: response.explanation,
          sources: response.sources,
          timestamp: Date.now(),
          url: message.payload.url,
          model: response.model,
        }

        await setCachedResult(textHash, result, settings.cacheExpiryHours)
        await addHistoryItem(result)

        return { type: 'FACT_CHECK_COMPLETE', payload: result }
      } catch (err) {
        return {
          type: 'FACT_CHECK_ERROR',
          payload: { error: String(err) },
        }
      }
    }

    case 'GET_HISTORY': {
      const { getHistory } = await import('./lib/storage/history.ts')
      const history = await getHistory(message.page ?? 1, message.limit ?? 20)
      return { type: 'HISTORY_RESULT', payload: history }
    }

    case 'GET_SETTINGS': {
      const settings = await getOrCreateSettings()
      return { type: 'SETTINGS_RESULT', payload: settings }
    }

    case 'UPDATE_SETTINGS': {
      cachedSettings = await updateSettings(message.payload)
      return { type: 'SETTINGS_RESULT', payload: cachedSettings }
    }

    case 'GET_DASHBOARD_STATS': {
      const { getAllHistory } = await import('./lib/storage/history.ts')
      const allHistory = await getAllHistory()

      const verdictCounts: Record<string, number> = {
        true: 0,
        false: 0,
        mixed: 0,
        unverifiable: 0,
        misleading: 0,
      }
      let totalConfidence = 0

      for (const item of allHistory) {
        verdictCounts[item.verdict] = (verdictCounts[item.verdict] || 0) + 1
        totalConfidence += item.confidence
      }

      return {
        type: 'DASHBOARD_STATS',
        payload: {
          totalChecks: allHistory.length,
          verdictCounts: verdictCounts as Record<FactCheckResult['verdict'], number>,
          averageConfidence: allHistory.length > 0 ? totalConfidence / allHistory.length : 0,
          recentChecks: allHistory.slice(0, 10),
        },
      }
    }

    case 'DELETE_HISTORY_ITEM': {
      const { deleteHistoryItem } = await import('./lib/storage/history.ts')
      await deleteHistoryItem(message.payload.id)
      return { success: true }
    }

    case 'CLEAR_HISTORY': {
      const { clearHistory } = await import('./lib/storage/history.ts')
      await clearHistory()
      return { success: true }
    }

    default:
      return { error: 'Unknown message type' }
  }
}

async function getExtractedContent(tabId: number): Promise<ExtractedContent | null> {
  return new Promise((resolve) => {
    const msg: ContentMessage = { type: 'EXTRACT_CONTENT' }
    chrome.tabs.sendMessage(tabId, msg, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null)
      } else {
        resolve(response as ExtractedContent)
      }
    })
  })
}

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await getExtractedContent(tab.id)
  }
})
