# MR2S — Metropolitan Ring Road System

무방향 그래프를 입력하고, 경로 탐색 기반 최적화 API를 통해 **방향이 결정된 간선과 점수**를 시각적으로 확인할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- **그래프 입력** — 정점(쉼표 구분)과 간선(줄 단위)을 직접 입력하고 실시간 검증
- **최적화 API** — Small World / Naoto 두 가지 알고리즘 선택 가능
- **그래프 시각화** — React Flow + Dagre 레이아웃으로 무방향 그래프와 최적화된 방향 그래프를 렌더링
- **벤치마크** — 고정 그래프로 두 알고리즘을 각 10회 반복 호출하여 점수·응답 시간·실패 횟수 비교
- **디버그 패널** — 요청/응답 JSON 원문 확인
- **다국어 지원** — 한국어 · English · 日本語
- **다크/라이트 테마** — 로컬 스토리지 기반 테마 유지

## 기술 스택

| 영역 | 기술 |
|------|------|
| UI | React 19, TypeScript ~5.9 |
| 빌드 | Vite 7 |
| 그래프 시각화 | @xyflow/react (React Flow) |
| 그래프 레이아웃 | @dagrejs/dagre |
| 다국어 | i18next, react-i18next |
| 배포 | Vercel |

## 프로젝트 구조

```
src/
├── main.tsx                  # 엔트리포인트
├── App.tsx                   # 전역 상태 · 레이아웃
├── App.css                   # 레이아웃 · 컴포넌트 스타일
├── style.css                 # CSS 변수(테마) · 글로벌 스타일
├── api.ts                    # fetch 기반 API 호출 · 벤치마크 로직
├── types.ts                  # 요청/응답/그래프 타입 정의
├── utils/
│   └── validation.ts         # 입력 파싱 · 검증
├── components/
│   ├── GraphInput.tsx        # 정점·간선 입력 폼
│   ├── GraphVisualization.tsx# React Flow 그래프 렌더링
│   ├── CircleNode.tsx        # 커스텀 노드 컴포넌트
│   ├── ResultPanel.tsx       # 최적화 결과 표시
│   ├── BenchmarkPanel.tsx    # 벤치마크 결과 표시
│   └── DebugPanel.tsx        # 요청/응답 디버그
└── i18n/
    ├── index.ts              # i18next 초기화
    └── locales/
        ├── ko.json
        ├── en.json
        └── ja.json
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 pnpm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속합니다.

### 빌드

```bash
# 타입 체크 후 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## API 프록시 설정

백엔드(`quantum.yunseong.dev`)와의 CORS 문제를 해결하기 위해 프록시를 사용합니다.

| 환경 | 설정 파일 | 동작 |
|------|-----------|------|
| 개발 | `vite.config.ts` | Vite dev server 프록시 — `/api/*` → `https://quantum.yunseong.dev/*` |
| 프로덕션 | `vercel.json` | Vercel rewrites — `/api/*` → `https://quantum.yunseong.dev/*` |

### API 엔드포인트

URL 패턴: `/api/{VERSION}/optimize/{METHOD}`

| 알고리즘 | 프록시 경로 | 실제 경로 |
|----------|------------|-----------|
| Small World | `/api/v1/optimize/small-world` | `https://quantum.yunseong.dev/v1/optimize/small-world` |
| Naoto | `/api/v1/optimize/naoto` | `https://quantum.yunseong.dev/v1/optimize/naoto` |

**요청 형식**

```json
{
  "edges": [
    { "vertices": [1, 2], "weight": 10 },
    { "vertices": [2, 3], "weight": 10 },
    { "vertices": [3, 4], "weight": 15 },
    { "vertices": [4, 5], "weight": 10 },
    { "vertices": [5, 1], "weight": 10 }
  ]
}
```

각 간선은 `vertices` (두 정점)와 `weight` (가중치)로 구성됩니다. UI에서 간선별 가중치를 지정하지 않으면 기본 가중치(default: 10)가 적용됩니다.

**응답 형식**

```json
{
  "edges": [{ "_from": 1, "to": 2 }, { "_from": 3, "to": 2 }],
  "optimized_graph_score": 12,
  "bidirectional_graph_score": 20
}
```

## 라이선스

Private
