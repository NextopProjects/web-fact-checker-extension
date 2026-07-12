import type { CacheEntry } from '../../types/cache.ts'
import type { FactCheckResult } from '../../types/index.ts'

const CACHE_KEY = 'fact_check_cache'

export async function getCachedResult(textHash: string): Promise<FactCheckResult | null> {
  const cache = await getCache()
  const entry = cache[textHash]

  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    delete cache[textHash]
    await saveCache(cache)
    return null
  }

  return entry.result
}

export async function setCachedResult(
  textHash: string,
  result: FactCheckResult,
  expiryHours: number,
): Promise<void> {
  const cache = await getCache()
  cache[textHash] = {
    textHash,
    result,
    cachedAt: Date.now(),
    expiresAt: Date.now() + expiryHours * 60 * 60 * 1000,
  }
  await saveCache(cache)
}

export async function clearExpiredCache(): Promise<void> {
  const cache = await getCache()
  const now = Date.now()
  let changed = false

  for (const key of Object.keys(cache)) {
    if (now > cache[key].expiresAt) {
      delete cache[key]
      changed = true
    }
  }

  if (changed) {
    await saveCache(cache)
  }
}

export async function clearAllCache(): Promise<void> {
  await chrome.storage.local.remove(CACHE_KEY)
}

async function getCache(): Promise<Record<string, CacheEntry>> {
  const result = await chrome.storage.local.get(CACHE_KEY)
  return (result[CACHE_KEY] as Record<string, CacheEntry>) || {}
}

async function saveCache(cache: Record<string, CacheEntry>): Promise<void> {
  await chrome.storage.local.set({ [CACHE_KEY]: cache })
}
