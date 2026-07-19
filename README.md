# Web Fact Checker

Chrome 확장 프로그램을 통한 웹 페이지 팩트체크 도구

## 개요

Web Fact Checker는 웹 페이지의 콘텐츠를 분석하여 정보의 신뢰도를 검증하는 Chrome 확장 프로그램입니다. LLM API를 활용해 사용자가 방문한 페이지의 주요 주장을 추출하고, 각 주장의 진위 여부와 근거를 제공합니다.

### 주요 기능

- **페이지 본문 자동 추출**: readability 알고리즘으로 뉴스, 블로그 등 다양한 페이지에서 본문 영역 자동 탐지
- **LLM 기반 팩트체크**: OpenAI, Anthropic 등 여러 LLM Provider를 통해 주장을 분석하고 신뢰도 점수 산정
- **다중 Provider 지원**: API 키 설정에서 Provider를 전환하여 사용 가능
- **분석 결과 캐싱**: 동일 텍스트 재분석 시 API 호출 없이 로컬 캐시에서 결과 제공
- **결과 내보내기**: 팩트체크 결과를 JSON 또는 텍스트 파일로 저장
- **분석 히스토리**: 이전 분석 결과를 목록으로 관리

## 기술 스택

| 항목 | 기술 |
|------|------|
| 플랫폼 | Chrome Extension (Manifest V3) |
| 언어 | TypeScript (ES2023) |
| 빌드 | Vite + @crxjs/vite-plugin |
| UI | Vanilla TypeScript + pico.css |
| API | OpenAI, Anthropic (Provider 추상화) |
| 저장 | chrome.storage.local |

## 설치 및 실행

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn
- Chrome 브라우저

### 개발 모드

```bash
# 의존성 설치
npm install

# 개발 서버 시작 (HMR 지원)
npm run dev
```

개발 서버 시작 후 Chrome에서 `chrome://extensions`으로 이동하여:
1. "개발자 모드" 활성화
2. "압축되지 않은 확장 프로그램을 로드합니다" 클릭
3. 프로젝트의 `dist/` 폴더 선택

### 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### 프로덕션 설치

1. `npm run build` 실행
2. Chrome에서 `chrome://extensions`으로 이동
3. "개발자 모드" 활성화
4. "압축되지 않은 확장 프로그램을 로드합니다" 클릭
5. `dist/` 폴더 선택

## 사용법

### 1. API 키 설정

1. 확장 프로그램 아이콘 클릭
2. 설정(톱니바퀴) 아이콘 클릭
3. 사용할 Provider 선택 (OpenAI 또는 Anthropic)
4. API 키 입력
5. 저장

### 2. 팩트체크 실행

1. 분석할 웹 페이지 방문
2. 확장 프로그램 아이콘 클릭
3. "분석 시작" 버튼 클릭
4. 분석 완료 후 결과 확인

### 3. 결과 확인

팝업에서 다음 정보를 확인할 수 있습니다:
- **전체 신뢰도 점수** (0-100)
- **주장별 분석**: 각 주장의 진위 여부, 근거, 참고 출처
- **요약**: 페이지 전반의 신뢰도 평가

### 4. 결과 내보내기

결과 하단의 "내보내기" 버튼을 클릭하여 JSON 또는 텍스트 파일로 저장 가능합니다.

## 문서

- [아키텍처 문서](docs/architecture.md) — 시스템 개요, 컴포넌트, 메시지 프로토콜
- [참조 문서](docs/reference.md) — 용어집, 규약 요약
- [도메인 문서](docs/domains/) — 도메인 모델, 분석 파이프라인, 신뢰도 모델

## 라이선스

MIT
