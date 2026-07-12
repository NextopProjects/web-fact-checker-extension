import type { AppSettings } from '../../types/settings.ts'
import { DEFAULT_SETTINGS } from '../../types/settings.ts'

const SETTINGS_KEY = 'app_settings'

export async function getSettings(): Promise<AppSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY)
  const stored = result[SETTINGS_KEY] as Partial<AppSettings> | undefined

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    apiKeys: {
      ...DEFAULT_SETTINGS.apiKeys,
      ...stored?.apiKeys,
    },
  }
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings()
  const updated: AppSettings = {
    ...current,
    ...partial,
    apiKeys: {
      ...current.apiKeys,
      ...partial.apiKeys,
    },
  }
  await chrome.storage.local.set({ [SETTINGS_KEY]: updated })
  return updated
}

export async function resetSettings(): Promise<AppSettings> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS })
  return DEFAULT_SETTINGS
}
