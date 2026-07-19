/**
 * 설정 UI 렌더링
 */

import type { Settings, ProviderType } from '../../types/settings'

/**
 * 설정 HTML 생성
 * @param settings 현재 설정
 * @returns HTML 문자열
 */
export function renderSettings(settings: Settings): string {
  return `
    <div class="settings">
      <h2>설정</h2>
      <form id="settings-form">
        <label for="provider">Provider</label>
        <select id="provider" name="provider">
          <option value="openai" ${settings.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
          <option value="anthropic" ${settings.provider === 'anthropic' ? 'selected' : ''}>Anthropic</option>
          <option value="gemini" ${settings.provider === 'gemini' ? 'selected' : ''}>Google Gemini</option>
        </select>

        <label for="api-key">API 키</label>
        <input
          type="password"
          id="api-key"
          name="apiKey"
          value="${escapeAttr(settings.apiKey)}"
          placeholder="API 키를 입력하세요"
        />

        <label for="model">모델</label>
        <select id="model" name="model">
          ${renderModelOptions(settings.provider, settings.model)}
        </select>

        <label for="language">분석 언어</label>
        <select id="language" name="language">
          <option value="ko" ${settings.language === 'ko' ? 'selected' : ''}>한국어</option>
          <option value="en" ${settings.language === 'en' ? 'selected' : ''}>영어</option>
        </select>

        <div class="settings-actions">
          <button type="submit" class="primary">저장</button>
          <button type="button" id="settings-cancel">취소</button>
        </div>
      </form>
    </div>
  `
}

/**
 * 모델 옵션 렌더링
 */
function renderModelOptions(provider: ProviderType, selectedModel: string): string {
  const models = getModelsForProvider(provider)
  return models
    .map(
      (model) =>
        `<option value="${model}" ${model === selectedModel ? 'selected' : ''}>${model}</option>`,
    )
    .join('')
}

/**
 * Provider별 모델 목록 반환
 */
export function getModelsForProvider(provider: ProviderType): string[] {
  switch (provider) {
    case 'openai':
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
    case 'anthropic':
      return ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229']
    case 'gemini':
      return ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-1.5-flash', 'gemini-1.5-pro']
    default:
      return []
  }
}

/**
 * HTML 속성 이스케이프
 */
function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
