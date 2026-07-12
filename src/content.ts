import { extractPageContent } from './lib/extractors/index.ts'
import type { ContentMessage } from './types/messages.ts'

chrome.runtime.onMessage.addListener(
  (message: ContentMessage, _sender, sendResponse) => {
    if (message.type === 'EXTRACT_CONTENT') {
      const content = extractPageContent()
      sendResponse(content)
    }
    return true
  },
)
