/**
 * Readability 기반 본문 추출
 * 분석 파이프라인 문서: docs/domains/analysis-pipeline.md 참조
 */

import { Readability } from '@mozilla/readability'
import type { TextExtractionResult } from '../types/fact-check'

/**
 * 현재 페이지에서 본문 텍스트 추출
 * @returns 추출된 텍스트 결과
 */
export function extractPageContent(): TextExtractionResult {
  const url = window.location.href
  const title = document.title || ''

  // 1. DOM 복제 (Readability가 원본 DOM을 수정할 수 있으므로)
  const docClone = document.cloneNode(true) as Document

  // 2. Readability로 본문 파싱 시도
  try {
    const reader = new Readability(docClone)
    const article = reader.parse()

    if (article && article.textContent && article.textContent.trim().length > 0) {
      return {
        title: article.title || title,
        content: article.textContent.trim(),
        url,
        excerpt: article.excerpt || undefined,
        byline: article.byline || undefined,
        siteName: article.siteName || undefined,
        length: article.textContent.trim().length,
      }
    }
  } catch (error) {
    console.warn('[TextExtractor] Readability 파싱 실패, 폴백 사용:', error)
  }

  // 3. Readability 실패 시 본문 영역 탐지하여 폴백
  return extractFallback()
}

/**
 * Readability 실패 시 폴백 추출
 * <article>, <main>, <section> 등 본문 영역 탐지
 */
function extractFallback(): TextExtractionResult {
  const url = window.location.href
  const title = document.title || ''

  // 본문 후보 영역 탐지
  const selectors = ['article', 'main', '[role="main"]', '.content', '.post', '.entry']

  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (element) {
      const text = extractTextFromElement(element)
      if (text.length > 100) {
        return {
          title,
          content: text,
          url,
          length: text.length,
        }
      }
    }
  }

  // 최후의 수단: body 텍스트 사용
  const bodyText = document.body?.innerText || ''
  return {
    title,
    content: bodyText,
    url,
    length: bodyText.length,
  }
}

/**
 * DOM 요소에서 텍스트 추출
 * 스크립트, 스타일 등 불필요한 요소 제외
 * @param element 텍스트를 추출할 요소
 * @returns 추출된 텍스트
 */
function extractTextFromElement(element: Element): string {
  // 제외할 태그 목록
  const excludedTags = new Set([
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'IFRAME',
    'OBJECT',
    'EMBED',
    'NAV',
    'FOOTER',
    'HEADER',
    'ASIDE',
  ])

  const texts: string[] = []

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text && text.length > 0) {
        texts.push(text)
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      if (!excludedTags.has(el.tagName)) {
        for (const child of Array.from(el.childNodes)) {
          walk(child)
        }
      }
    }
  }

  walk(element)
  return texts.join(' ').replace(/\s+/g, ' ').trim()
}
