import type { ExtractedContent } from '../../types/index.ts'
import { extractContent as readabilityExtract } from './readability.ts'

export function extractPageContent(): ExtractedContent {
  return readabilityExtract()
}

export { extractContent } from './readability.ts'
