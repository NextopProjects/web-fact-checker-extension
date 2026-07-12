export type Verdict = 'true' | 'false' | 'mixed' | 'unverifiable' | 'misleading'

export interface FactCheckResult {
  id: string
  claim: string
  verdict: Verdict
  confidence: number
  explanation: string
  sources?: string[]
  timestamp: number
  url: string
  model: string
}

export interface ExtractedContent {
  title: string
  body: string
  url: string
  domain: string
}

export interface DashboardStats {
  totalChecks: number
  verdictCounts: Record<Verdict, number>
  averageConfidence: number
  recentChecks: FactCheckResult[]
}
