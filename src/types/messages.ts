/**
 * 컴포넌트 간 메시지 프로토콜 타입 정의
 * 아키텍처 문서: docs/architecture.md 참조
 */

import type { AnalysisResponse, TextExtractionResult } from './fact-check'
import type { Settings, HistoryEntry } from './settings'

// ============================================================
// Content → Background 메시지
// ============================================================

/** Content → Background 요청 메시지 */
export type ContentMessage =
  | { type: 'EXTRACT_PAGE_CONTENT' }
  | { type: 'PAGE_CONTENT'; payload: TextExtractionResult }

// ============================================================
// Background → Content 메시지
// ============================================================

/** Background → Content 응답 메시지 */
export type BackgroundToContentMessage =
  | { type: 'EXTRACT_PAGE_CONTENT' }
  | { type: 'ANALYSIS_RESULT'; payload: AnalysisResponse }
  | { type: 'ANALYSIS_ERROR'; payload: { message: string } }

// ============================================================
// Popup → Background 메시지
// ============================================================

/** Popup → Background 요청 메시지 */
export type PopupMessage =
  | { type: 'REQUEST_ANALYSIS' }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; payload: Settings }
  | { type: 'GET_HISTORY' }
  | { type: 'GET_HISTORY_DETAIL'; payload: { id: string } }
  | { type: 'EXPORT_RESULT'; payload: { format: 'json' | 'text'; id: string } }

// ============================================================
// Background → Popup 메시지
// ============================================================

/** Background → Popup 응답 메시지 */
export type PopupResponse =
  | { type: 'ANALYSIS_PROGRESS'; payload: { status: string } }
  | { type: 'ANALYSIS_COMPLETE'; payload: AnalysisResponse }
  | { type: 'SETTINGS_DATA'; payload: Settings }
  | { type: 'HISTORY_DATA'; payload: HistoryEntry[] }
  | { type: 'HISTORY_DETAIL_DATA'; payload: HistoryEntry | null }
  | { type: 'EXPORT_DATA'; payload: string }
  | { type: 'ERROR'; payload: { message: string } }
