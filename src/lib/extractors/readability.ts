import { Readability } from '@mozilla/readability'
import type { ExtractedContent } from '../../types/index.ts'

const NEWS_SELECTORS = [
  'article',
  '[class*="article"]',
  '[class*="content"]',
  '[class*="story"]',
  '[class*="post"]',
  '[role="article"]',
  'main',
]

export function extractContent(): ExtractedContent {
  const url = window.location.href
  const domain = window.location.hostname
  const title = document.title || ''

  const readabilityResult = tryReadability()
  if (readabilityResult) {
    return { title: readabilityResult.title || title, body: readabilityResult.body, url, domain }
  }

  const heuristicResult = tryHeuristicExtraction()
  if (heuristicResult) {
    return { title, body: heuristicResult, url, domain }
  }

  return { title, body: '', url, domain }
}

function tryReadability(): { title: string; body: string } | null {
  try {
    const docClone = document.cloneNode(true) as Document
    const reader = new Readability(docClone)
    const article = reader.parse()
    if (article && article.textContent && article.textContent.length > 100) {
      return { title: article.title || '', body: article.textContent.trim() }
    }
  } catch {
    // Readability failed, fallback to heuristic
  }
  return null
}

function tryHeuristicExtraction(): string | null {
  for (const selector of NEWS_SELECTORS) {
    const elements = document.querySelectorAll(selector)
    for (const el of elements) {
      const text = el.textContent?.trim() ?? ''
      if (text.length > 200) {
        return text
      }
    }
  }

  const bodyText = document.body?.textContent?.trim() ?? ''
  if (bodyText.length > 500) {
    return bodyText
  }

  return null
}
