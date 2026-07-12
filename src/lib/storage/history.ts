import type { FactCheckResult } from '../../types/index.ts'

const HISTORY_KEY = 'fact_check_history'
const MAX_HISTORY = 200

export async function getHistory(page = 1, limit = 20): Promise<FactCheckResult[]> {
  const all = await getAllHistory()
  const start = (page - 1) * limit
  return all.slice(start, start + limit)
}

export async function getAllHistory(): Promise<FactCheckResult[]> {
  const result = await chrome.storage.local.get(HISTORY_KEY)
  return ((result[HISTORY_KEY] as FactCheckResult[]) || []).sort(
    (a, b) => b.timestamp - a.timestamp,
  )
}

export async function addHistoryItem(item: FactCheckResult): Promise<void> {
  const history = await getAllHistory()
  history.unshift(item)

  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY
  }

  await chrome.storage.local.set({ [HISTORY_KEY]: history })
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const history = await getAllHistory()
  const filtered = history.filter((item) => item.id !== id)
  await chrome.storage.local.set({ [HISTORY_KEY]: filtered })
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(HISTORY_KEY)
}

export async function getHistoryCount(): Promise<number> {
  const history = await getAllHistory()
  return history.length
}
