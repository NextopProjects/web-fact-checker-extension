import type { FactCheckResult, ExtractedContent, DashboardStats } from './index.ts'
import type { AppSettings } from './settings.ts'

export type ContentMessage =
  | { type: 'EXTRACT_CONTENT' }
  | { type: 'CONTENT_EXTRACTED'; payload: ExtractedContent }

export type PopupMessage =
  | { type: 'START_FACT_CHECK'; payload: { text: string; url: string } }
  | { type: 'FACT_CHECK_COMPLETE'; payload: FactCheckResult }
  | { type: 'FACT_CHECK_ERROR'; payload: { error: string } }
  | { type: 'FACT_CHECK_PROGRESS'; payload: { status: string } }
  | { type: 'GET_HISTORY'; page?: number; limit?: number }
  | { type: 'HISTORY_RESULT'; payload: FactCheckResult[] }
  | { type: 'GET_SETTINGS' }
  | { type: 'SETTINGS_RESULT'; payload: AppSettings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'GET_DASHBOARD_STATS' }
  | { type: 'DASHBOARD_STATS'; payload: DashboardStats }
  | { type: 'DELETE_HISTORY_ITEM'; payload: { id: string } }
  | { type: 'CLEAR_HISTORY' }

export type Message = ContentMessage | PopupMessage
