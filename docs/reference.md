# 참조 문서

## 문서 색인

| 문서 | 경로 | 설명 |
|------|------|------|
| [README](../README.md) | `../README.md` | 프로젝트 소개, 기능, 설치·사용법 |
| [아키텍처](architecture.md) | `architecture.md` | 시스템 개요, 디렉토리 구조, 메시지 프로토콜, 컴포넌트, 보안 |
| [도메인 문서 인덱스](domains/README.md) | `domains/README.md` | 도메인 문서 목록, 경계 맵 |
| [도메인 모델](domains/domain-model.md) | `domains/domain-model.md` | 유비쿼터스 언어, 엔티티, 값 객체, 도메인 이벤트 |
| [분석 파이프라인](domains/analysis-pipeline.md) | `domains/analysis-pipeline.md` | 분석 흐름, 다이어그램, 재시도·엣지 케이스 |
| [신뢰도 모델](domains/credibility-model.md) | `domains/credibility-model.md` | 신뢰도 판정 기준, 점수 산정, 근거 가중치 |

## 용어집 (Glossary)

| 용어 | 정의 |
|------|------|
| **팩트체크** | 웹 페이지의 주장을 분석하여 진위 여부를 검증하는 행위 |
| **주장 (Claim)** | 페이지에서 추출된 특정 사실적 진술. "서울은 한국의 수도이다"와 같은 단일 문장 또는 구절 |
| **신뢰도 점수** | 전체 페이지 또는 개별 주장의 신뢰도를 0-100 범위로 나타내는 수치 |
| **진위 판정 (Verdict)** | 주장에 대한 LLM의 판단 결과: `true`, `false`, `mixed`, `unverifiable` |
| **Provider** | LLM API 제공자 (OpenAI, Anthropic 등). `LLMProvider` 인터페이스를 구현하는 클래스 |
| **Content Script** | 웹 페이지에 주입되어 DOM에 접근하는 스크립트. 본문 추출 담당 |
| **Background Service Worker** | 확장 프로그램의 백그라운드에서 동작하는 스크립트. API 호출, 캐싱, 메시지 라우팅 담당 |
| **Popup** | 확장 프로그램 아이콘 클릭 시 열리는 UI. 결과 표시, 설정 관리 담당 |
| **캐시** | 이전 분석 결과를 `chrome.storage.local`에 저장한 것. 동일 텍스트 재분석 시 API 호출 방지 |
| **해시** | 텍스트의 고유 식별자. SHA-256 등으로 생성. 캐시 키로 사용 |
| **readability** | 페이지에서 본문 영역을 자동으로 추출하는 알고리즘. `@mozilla/readability` 라이브러리 사용 |
| **도메인 모델** | 팩트체크 도메인의 핵심 개념과 관계를 나타내는 모델 |
| **유비쿼터스 언어** | 프로젝트에서 사용하는 공통 용어 체계 |

## 규약 요약

### 타입 규약

- 모든 타입은 `src/types/` 디렉토리에 정의
- `verbatimModuleSyntax` 활성화 — 타입 전용 가져오기는 `import type` 사용
- `noUnusedLocals`, `noUnusedParameters` 활성화 — 미사용 코드 금지

### 메시지 프로토콜 규약

- 모든 메시지는 `type` 필드를 반드시 포함
- 요청 메시지는 `payload` 필드에 데이터 포함
- 응답 메시지는 `type`으로 구분하여 응답 데이터 포함
- `undefined` 페이로드는 허용하지 않음 (빈 객체 `{}` 사용)

### 파일 구조 규약

- 진입점 파일은 `src/` 루트에 배치 (`background.ts`, `content.ts`)
- 관련 로직은 동일 디렉토리의 하위 파일로 분리
- 컴포넌트는 `ui/` 하위에 배치
- 유틸리티는 `utils/` 하위에 배치

### 네이밍 규약

- 파일명: `kebab-case` (예: `text-extractor.ts`)
- 인터페이스: `PascalCase` (예: `LLMProvider`)
- 타입 별칭: `PascalCase` (예: `AnalysisRequest`)
- 열거형: `PascalCase` (예: `VerdictType`)
- 함수: `camelCase` (예: `extractText`)
- 상수: `UPPER_SNAKE_CASE` (예: `CACHE_TTL`)

### 에러 처리 규약

- API 에러는 `AnalysisError` 타입으로 래핑하여 전달
- 캐시 에러는 조용히 무시하고 API 호출로 폴백
- Content Script 에러는 Background에 에러 메시지 전송
- Popup 에러는 사용자에게 친화적 메시지 표시

### 빌드 규약

- `manifest.json` 직접 수정 금지 — `@crxjs/vite-plugin`이 자동 생성
- `vite.config.ts`를 통해서만 빌드 설정 변경
- TypeScript 소스는 `src/` 디렉토리만 컴파일
- 출력은 `dist/` 디렉토리 (gitignored)
