# 아키텍처 문서

## 시스템 개요

Web Fact Checker는 Chrome Extension Manifest V3 기반으로, 세 가지 메인 컴포넌트가 동작합니다:

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Browser                         │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Content    │    │  Background  │    │    Popup     │  │
│  │   Script     │◄──►│  Service     │◄──►│    UI        │  │
│  │              │    │  Worker      │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│    [페이지 DOM]        [LLM API]          [사용자 입력]    │
│    [readability]      [캐싱]             [설정 관리]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름

```
사용자 → Popup → Background → Content (본문 추출) → Background (LLM API) → Popup (결과 표시)
                  │                                         │
                  └──── 캐시 확인/저장 (chrome.storage) ────┘
```

## 디렉토리 구조

```
src/
├── background.ts                    # Service Worker 진입점
├── background/
│   ├── message-handler.ts           # content↔background 메시지 라우팅
│   ├── fact-checker.ts              # LLM API 호출 오케스트레이션
│   └── cache-manager.ts             # chrome.storage.local 캐싱 로직
│
├── content.ts                       # Content Script 진입점
├── content/
│   ├── text-extractor.ts            # readability 기반 본문 추출
│   ├── selection-listener.ts        # 사용자 텍스트 선택 감지 (확장성용)
│   └── injector.ts                  # 콘텐츠 스크립트 초기화
│
├── popup/
│   ├── index.html                   # 팝업 HTML (pico.css 로드)
│   ├── main.ts                      # 팝업 진입점
│   ├── ui/
│   │   ├── result-view.ts           # 팩트체크 결과 렌더링
│   │   ├── loading-state.ts         # 로딩/에러 상태 표시
│   │   ├── history-view.ts          # 분석 히스토리 목록
│   │   ├── export.ts                # 결과 내보내기
│   │   └── settings-view.ts         # API 키 설정 UI
│   └── styles/
│       └── popup.css                # pico css + 커스텀 스타일
│
├── providers/
│   ├── types.ts                     # Provider 인터페이스 정의
│   ├── openai.ts                    # OpenAI API 구현
│   ├── anthropic.ts                 # Anthropic Claude API 구현
│   └── factory.ts                   # Provider 팩토리
│
├── types/
│   ├── messages.ts                  # background↔content↔popup 메시지 타입
│   ├── fact-check.ts                # 팩트체크 결과 도메인 타입
│   └── settings.ts                  # 설정 도메인 타입
│
└── utils/
    ├── storage.ts                   # chrome.storage 래퍼
    └── text.ts                      # 텍스트 전처리 유틸리티
```

## 컴포넌트별 역할

### Content Script (`content.ts`, `content/`)

| 파일 | 역할 |
|------|------|
| `content.ts` | 진입점. DOMContentLoaded 후 `text-extractor` 호출 |
| `text-extractor.ts` | `@mozilla/readability`로 페이지 본문 영역 탐지 및 텍스트 추출 |
| `selection-listener.ts` | (확장성预留) 사용자 텍스트 선택 감지 |
| `injector.ts` | 콘텐츠 스크립트 초기화 로직 |

**동작 방식:**
1. 페이지 로드 시 `text-extractor`가 DOM을 분석
2. `readability` 알고리즘으로 `<article>`, `<main>`, 본문 영역 자동 탐지
3. 추출된 텍스트를 `background`에 전송

### Background Service Worker (`background.ts`, `background/`)

| 파일 | 역할 |
|------|------|
| `background.ts` | 진입점. 메시지 리스너 등록 |
| `message-handler.ts` | content/popup에서 온 메시지 라우팅 및 처리 |
| `fact-checker.ts` | LLM API 호출 오케스트레이션. Provider 선택, API 호출, 결과 가공 |
| `cache-manager.ts` | `chrome.storage.local` 기반 캐시 관리. 텍스트 해시를 키로 사용 |

**동작 방식:**
1. Content에서 받은 텍스트의 해시를 계산
2. 캐시에서 기존 결과 확인 (7일 유효)
3. 캐시 미스 시 설정된 Provider로 API 호출
4. 결과를 캐시에 저장하고 popup에 전달

### Popup UI (`popup/`)

| 파일 | 역할 |
|------|------|
| `main.ts` | 진입점. 상태 관리, 메시지 라우팅 |
| `ui/result-view.ts` | 팩트체크 결과 렌더링 (점수, 주장별 분석) |
| `ui/loading-state.ts` | 로딩 스피너, 에러 메시지 표시 |
| `ui/history-view.ts` | 이전 분석 결과 목록 표시 |
| `ui/export.ts` | 결과를 JSON/텍스트로 내보내기 |
| `ui/settings-view.ts` | API 키 입력/관리 UI |
| `styles/popup.css` | pico.css + 커스텀 스타일 |

**상태 머신:**
```
IDLE → LOADING → SUCCESS/ERROR
  ↑                 │
  └─────────────────┘
```

### Provider (`providers/`)

| 파일 | 역할 |
|------|------|
| `types.ts` | `LLMProvider` 인터페이스 정의 |
| `openai.ts` | OpenAI API 구현체 |
| `anthropic.ts` | Anthropic Claude API 구현체 |
| `factory.ts` | Provider 팩토리. 설정에 따라 적절한 인스턴스 생성 |

**확장 방법:** `LLMProvider` 인터페이스를 구현하고 factory에 등록하면 새 Provider 추가 가능.

## 메시지 프로토콜

Chrome Extension의 컴포넌트 간 통신은 `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`를 사용합니다.

### Content → Background

```typescript
// 페이지 본문 요청
{ type: 'EXTRACT_PAGE_CONTENT' }

// 텍스트 분석 요청
{ type: 'ANALYZE_TEXT'; payload: { text: string } }
```

### Background → Content

```typescript
// 추출된 페이지 내용 반환
{ type: 'PAGE_CONTENT'; payload: { title: string; content: string; url: string } }

// 분석 결과 반환
{ type: 'ANALYSIS_RESULT'; payload: AnalysisResponse }

// 분석 에러
{ type: 'ANALYSIS_ERROR'; payload: { message: string } }
```

### Popup → Background

```typescript
// 분석 요청
{ type: 'REQUEST_ANALYSIS' }

// 설정 조회
{ type: 'GET_SETTINGS' }

// 설정 저장
{ type: 'SAVE_SETTINGS'; payload: Settings }

// 히스토리 조회
{ type: 'GET_HISTORY' }

// 히스토리 상세 조회
{ type: 'GET_HISTORY_DETAIL'; payload: { id: string } }

// 결과 내보내기
{ type: 'EXPORT_RESULT'; payload: { format: 'json' | 'text'; id: string } }
```

### Background → Popup

```typescript
// 분석 진행 상황
{ type: 'ANALYSIS_PROGRESS'; payload: { status: string } }

// 분석 완료
{ type: 'ANALYSIS_COMPLETE'; payload: AnalysisResponse }

// 설정 데이터
{ type: 'SETTINGS_DATA'; payload: Settings }

// 히스토리 데이터
{ type: 'HISTORY_DATA'; payload: HistoryEntry[] }

// 내보내기 데이터
{ type: 'EXPORT_DATA'; payload: string }

// 에러
{ type: 'ERROR'; payload: { message: string } }
```

## 핵심 타입 정의

```typescript
// === Provider 인터페이스 ===
interface LLMProvider {
  readonly name: string
  analyze(request: AnalysisRequest): Promise<AnalysisResponse>
}

interface AnalysisRequest {
  text: string
  language: 'ko' | 'en'
}

interface AnalysisResponse {
  claims: ClaimResult[]
  overallScore: number       // 0-100 신뢰도
  summary: string
  provider: string
  timestamp: number
}

interface ClaimResult {
  text: string               // 원문에서 추출된 주장
  verdict: 'true' | 'false' | 'mixed' | 'unverifiable'
  confidence: number         // 0-1
  reasoning: string          // 판정 근거
  sources: Source[]          // 참조 출처
}

interface Source {
  title: string
  url?: string
  reliability: number        // 0-1 출처 신뢰도
}

// === 설정 타입 ===
interface Settings {
  provider: 'openai' | 'anthropic'
  apiKey: string
  model: string
  language: 'ko' | 'en'
}

interface HistoryEntry {
  id: string
  url: string
  title: string
  timestamp: number
  result: AnalysisResponse
}
```

## 보안 고려사항

| 항목 | 설계 |
|------|------|
| **API 키 관리** | `chrome.storage.local`에 저장. popup 설정 페이지에서 입력/삭제. Content Script에 절대 노출 안 함. |
| **CSP** | Manifest V3 기본 CSP 유지 (`script-src 'self'`). 외부 스크립트 로드 없음. |
| **권한 최소화** | `activeTab`, `scripting`, `<all_urls>` 유지. 추가 권한 불필요. |
| **HTTPS** | 모든 LLM API 호출은 HTTPS 사용. HTTP 요청 차단. |
| **데이터 로컬 저장** | 분석 결과는 로컬에만 저장. 외부 서버로 전송하지 않음 (Provider API 호출 제외). |

## 확장성

### Provider 추가

1. `providers/` 디렉토리에 새 파일 생성
2. `LLMProvider` 인터페이스 구현
3. `factory.ts`에 등록
4. `types/settings.ts`에 설정 옵션 추가

### 기능 추가

- **새 분석 모드**: `providers/types.ts`에 새 요청/응답 타입 추가
- **새 UI 뷰**: `popup/ui/`에 새 뷰 컴포넌트 추가
- **새 유틸리티**: `utils/`에 새 유틸리티 함수 추가

## 의존성

### 개발 의존성

| 패키지 | 용도 |
|--------|------|
| `@crxjs/vite-plugin` | Chrome Extension 빌드 |
| `@types/chrome` | Chrome API 타입 정의 |
| `typescript` | TypeScript 컴파일러 |
| `vite` | 빌드 도구 |

### 런타임 의존성 (추가 예정)

| 패키지 | 용도 |
|--------|------|
| `@mozilla/readability` | 페이지 본문 추출 |
| `pico.css` | 경량 CSS 프레임워크 |

## 빌드 및 개발

```bash
# 개발 모드 (HMR)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

빌드 결과물은 `dist/` 폴더에 생성됩니다. `@crxjs/vite-plugin`이 manifest.json을 기반으로 확장 프로그램을 번들링합니다.
