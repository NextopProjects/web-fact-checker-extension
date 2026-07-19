# 도메인 모델

## 유비쿼터스 언어 (Ubiquitous Language)

이 섹션은 Web Fact Checker 프로젝트에서 사용하는 핵심 용어와 그 정의를 정의합니다. 모든 코드, 문서, 의사소통에서 이 용어들을 일관되게 사용해야 합니다.

| 용어 | 정의 | 예시 |
|------|------|------|
| **팩트체크 (Fact Check)** | 웹 페이지의 주장을 분석하여 진위 여부를 검증하는 행위 | "이 기사의 팩트체크를 실행합니다" |
| **주장 (Claim)** | 페이지에서 추출된 특정 사실적 진술. 단일 문장 또는 구절 형태 | "서울은 한국의 수도이다", "지구는 태양을 365일에 한 번 돈다" |
| **진위 판정 (Verdict)** | 주장에 대한 LLM의 판단 결과 | `true`, `false`, `mixed`, `unverifiable` |
| **신뢰도 점수 (Credibility Score)** | 전체 페이지 또는 개별 주장의 신뢰도를 0-100 범위로 나타내는 수치 | "이 기사의 신뢰도는 72점입니다" |
| **근거 (Reasoning)** | 진위 판정에 대한 LLM의 논리적 근거 설명 | "해당 주장은 국립중앙도서관 자료와 일치합니다" |
| **참조 출처 (Source)** | 근거에서 인용된 외부 자료 또는 정보원 | "국립중앙도서관 디지털 아카이브" |
| **텍스트 추출 (Text Extraction)** | 웹 페이지에서 본문 영역을 자동으로 분리하여 텍스트로 변환하는 행위 | "기사 본문을 추출합니다" |
| **분석 파이프라인 (Analysis Pipeline)** | 텍스트를 분석하여 팩트체크 결과를 생성하는 일련의 처리 과정 | "분석 파이프라인이 시작되었습니다" |
| **Provider** | LLM API 제공자. `LLMProvider` 인터페이스를 구현하는 클래스 | "OpenAI Provider를 사용합니다" |
| **캐시 (Cache)** | 이전 분석 결과를 로컬에 저장한 것. 동일 텍스트 재분석 시 API 호출 방지 | "캐시에서 결과를 반환합니다" |
| **해시 (Hash)** | 텍스트의 고유 식별자. SHA-256 등으로 생성. 캐시 키로 사용 | "텍스트 해시를 계산합니다" |

## 엔티티 (Entities)

엔티티는 고유한 식별자를 가지며, 시간에 따라 상태가 변경될 수 있는 도메인 객체입니다.

### AnalysisResult (분석 결과)

분석 파이프라인의 최종 출력물. 고유 ID를 가지며, 분석 완료 후 변경되지 않습니다.

```typescript
interface AnalysisResult {
  id: string                    // 고유 식별자 (UUID)
  url: string                   // 분석 대상 페이지 URL
  title: string                 // 페이지 제목
  text: string                  // 추출된 본문 텍스트
  textHash: string              // 텍스트 해시 (캐시 키)
  claims: ClaimResult[]         // 추출된 주장 목록
  overallScore: number          // 전체 신뢰도 점수 (0-100)
  summary: string               // 분석 요약
  provider: string              // 사용된 Provider 이름
  model: string                 // 사용된 모델 이름
  timestamp: number             // 분석 시각 (Unix timestamp)
  language: 'ko' | 'en'         // 분석 언어
}
```

**생성 조건:**
- 사용자가 "분석 시작" 버튼을 클릭한 후
- Content Script에서 본문 추출이 완료된 후
- LLM API 호출 및 응답 파싱이 완료된 후

**식별 규칙:**
- `id`: UUID v4 형식
- `textHash`: SHA-256 해시 (캐시 조회용)

### ClaimResult (주장 결과)

개별 주장에 대한 분석 결과. `AnalysisResult`에 포함됩니다.

```typescript
interface ClaimResult {
  id: string                    // 고유 식별자
  text: string                  // 원문에서 추출된 주장 텍스트
  startIndex: number            // 원문에서의 시작 위치
  endIndex: number              // 원문에서의 끝 위치
  verdict: Verdict              // 진위 판정
  confidence: number            // 판정 신뢰도 (0-1)
  reasoning: string             // 판정 근거
  sources: Source[]             // 참조 출처 목록
}
```

**생성 조건:**
- LLM API 응답에서 파싱된 후

**식별 규칙:**
- `id`: UUID v4 형식
- `text`: 원문에서 직접 추출된 텍스트 (변경 불가)

## 값 객체 (Value Objects)

값 객체는 고유 식별자가 없으며, 값에 의해 동등성이 결정되는 불변 객체입니다.

### Verdict (진위 판정)

```typescript
type Verdict = 'true' | 'false' | 'mixed' | 'unverifiable'
```

| 값 | 정의 | 예시 |
|----|------|------|
| `true` | 주장이 사실로 확인됨 | "서울은 한국의 수도이다" → true |
| `false` | 주장이 사실이 아닌 것으로 확인됨 | "지구는 평평하다" → false |
| `mixed` | 주장이 일부 사실이고 일부 거짓임 | "일본은 세계 최대 경제대국이다" → mixed (과거엔 사실, 현재는 아님) |
| `unverifiable` | 주장의 진위를 판단할 수 없음 | "이 제품은 최고다" → unverifiable (주관적 표현) |

### Source (참조 출처)

```typescript
interface Source {
  title: string                 // 출처 제목
  url?: string                  // 출처 URL (선택사항)
  reliability: number           // 출처 신뢰도 (0-1)
  type: SourceType              // 출처 유형
}

type SourceType = 'academic' | 'government' | 'news' | 'reference' | 'other'
```

**출처 유형별 신뢰도 기준:**
- `academic`: 학술 논문, 연구 기관 (기본 신뢰도: 0.9)
- `government`: 정부 기관, 공식 발표 (기본 신뢰도: 0.85)
- `news`: 뉴스 매체 (기본 신뢰도: 0.7)
- `reference`: 백과사전, 사전 (기본 신뢰도: 0.8)
- `other`: 기타 (기본 신뢰도: 0.5)

### Settings (설정)

```typescript
interface Settings {
  provider: ProviderType        // 사용할 Provider
  apiKey: string                // API 키
  model: string                 // 모델 이름
  language: 'ko' | 'en'         // 분석 언어
  cacheTTL: number              // 캐시 유효 기간 (밀리초)
}

type ProviderType = 'openai' | 'anthropic'
```

### TextExtractionResult (텍스트 추출 결과)

```typescript
interface TextExtractionResult {
  title: string                 // 페이지 제목
  content: string               // 추출된 본문 텍스트
  url: string                   // 페이지 URL
  excerpt: string               // 요약 (선택사항)
  byline?: string               // 저자 (선택사항)
  siteName?: string             // 사이트 이름 (선택UAGE)
  length: number                // 텍스트 길이
}
```

## 도메인 이벤트 (Domain Events)

도메인 이벤트는 시스템에서 발생하는 중요한 상태 변화를 나타냅니다.

### AnalysisRequested (분석 요청됨)

사용자가 팩트체크를 요청했을 때 발생합니다.

```typescript
interface AnalysisRequested {
  type: 'AnalysisRequested'
  url: string
  timestamp: number
}
```

### TextExtracted (텍스트 추출됨)

Content Script에서 본문 추출이 완료되었을 때 발생합니다.

```typescript
interface TextExtracted {
  type: 'TextExtracted'
  url: string
  textLength: number
  timestamp: number
}
```

### AnalysisStarted (분석 시작됨)

LLM API 호출이 시작되었을 때 발생합니다.

```typescript
interface AnalysisStarted {
  type: 'AnalysisStarted'
  provider: string
  model: string
  timestamp: number
}
```

### AnalysisCompleted (분석 완료됨)

분석 파이프라인이 성공적으로 완료되었을 때 발생합니다.

```typescript
interface AnalysisCompleted {
  type: 'AnalysisCompleted'
  resultId: string
  overallScore: number
  claimCount: number
  timestamp: number
}
```

### AnalysisFailed (분석 실패됨)

분석 파이프라인이 실패했을 때 발생합니다.

```typescript
interface AnalysisFailed {
  type: 'AnalysisFailed'
  error: string
  provider: string
  timestamp: number
}
```

### CacheHit (캐시 히트)

캐시에서 기존 분석 결과를 찾았을 때 발생합니다.

```typescript
interface CacheHit {
  type: 'CacheHit'
  textHash: string
  resultId: string
  timestamp: number
}
```

### CacheMiss (캐시 미스)

캐시에서 기존 분석 결과를 찾지 못했을 때 발생합니다.

```typescript
interface CacheMiss {
  type: 'CacheMiss'
  textHash: string
  timestamp: number
}
```

## 엔티티 관계 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                        AnalysisResult                           │
│                                                                 │
│  id: string (PK)                                                │
│  url: string                                                    │
│  title: string                                                  │
│  text: string                                                   │
│  textHash: string                                               │
│  overallScore: number                                           │
│  summary: string                                                │
│  provider: string                                               │
│  model: string                                                  │
│  timestamp: number                                              │
│  language: 'ko' | 'en'                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Contains                                 │   │
│  │                                                          │   │
│  │  1:N  ClaimResult[]                                      │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ has
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ClaimResult                              │
│                                                                 │
│  id: string (PK)                                                │
│  text: string                                                   │
│  startIndex: number                                             │
│  endIndex: number                                               │
│  verdict: Verdict (值)                                          │
│  confidence: number                                             │
│  reasoning: string                                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Contains                                 │   │
│  │                                                          │   │
│  │  1:N  Source[]                                            │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ has
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Source                                 │
│                                                                 │
│  title: string                                                  │
│  url?: string                                                   │
│  reliability: number                                            │
│  type: SourceType (值)                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 상태 전이

### AnalysisResult 상태

```
[생성] ──► [분석 중] ──► [완료]
              │
              ▼
          [실패]
```

### 캐시 상태

```
[캐시 미스] ──► [API 호출] ──► [캐시 저장] ──► [캐시 히트]
```
