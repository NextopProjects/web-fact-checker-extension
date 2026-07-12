import type { FactCheckResult } from './index.ts'

export interface CacheEntry {
  textHash: string
  result: FactCheckResult
  cachedAt: number
  expiresAt: number
}
