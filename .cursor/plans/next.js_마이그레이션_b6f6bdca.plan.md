---
name: Next.js 마이그레이션
overview: Vite + React 프로젝트를 Next.js App Router로 마이그레이션하고, 각 뷰(대시보드, 부동산, 퇴직연금, 가상자산)를 별도 라우트로 분리합니다. Tailwind CSS는 npm 패키지로 설치합니다.
todos:
  - id: setup-nextjs
    content: Next.js 설정 파일 생성 (next.config.js, tsconfig.json 업데이트, package.json 수정)
    status: completed
  - id: setup-tailwind
    content: Tailwind CSS 설정 (tailwind.config.js, postcss.config.js, globals.css 생성)
    status: completed
  - id: create-app-structure
    content: app/ 디렉토리 구조 생성 (layout.tsx, page.tsx, 각 뷰별 page.tsx)
    status: completed
    dependencies:
      - setup-nextjs
  - id: update-sidebar
    content: Sidebar 컴포넌트를 Next.js Link와 usePathname으로 수정
    status: completed
    dependencies:
      - create-app-structure
  - id: split-app-logic
    content: App.tsx 로직을 각 페이지 컴포넌트로 분리 및 "use client" 추가
    status: completed
    dependencies:
      - create-app-structure
  - id: update-components
    content: 모든 컴포넌트에 "use client" 지시어 추가 (필요한 경우)
    status: completed
    dependencies:
      - split-app-logic
  - id: cleanup-vite
    content: Vite 관련 파일 삭제 (vite.config.ts, index.html, src/index.tsx, src/App.tsx)
    status: completed
    dependencies:
      - split-app-logic
  - id: setup-env
    content: 환경 변수 설정 (.env.local 생성 및 .gitignore 확인)
    status: completed
---

# Next

.js 마이그레이션 계획

## 목표

- Vite 기반 React 앱을 Next.js App Router로 변환
- 단일 페이지 앱을 다중 페이지 라우팅 구조로 변경
- Tailwind CSS를 CDN에서 npm 패키지로 전환
- 기존 기능 및 컴포넌트 유지

## 주요 변경사항

### 1. 프로젝트 설정 파일

#### package.json 업데이트

- Vite 관련 의존성 제거 (`vite`, `@vitejs/plugin-react`)
- Next.js 의존성 추가 (`next`, `react`, `react-dom`)
- Tailwind CSS 관련 패키지 추가 (`tailwindcss`, `postcss`, `autoprefixer`)
- 스크립트 변경: `dev`, `build`, `preview` → Next.js 명령어로

#### next.config.js 생성

- TypeScript 설정
- 환경 변수 설정 (GEMINI_API_KEY)
- 경로 별칭 설정 (`@/*`)

#### tsconfig.json 업데이트

- Next.js 권장 설정으로 변경
- `moduleResolution: "bundler"` → `"node"` 또는 `"bundler"`
- Next.js 타입 추가

#### tailwind.config.js 생성

- content 경로 설정 (`app/**/*`, `components/**/*`)
- 테마 커스터마이징 (필요시)

#### postcss.config.js 생성

- Tailwind CSS 및 Autoprefixer 플러그인 설정

### 2. 프로젝트 구조 변경

#### 디렉토리 구조

```javascript
app/
  layout.tsx          # 루트 레이아웃 (Sidebar 포함)
  page.tsx            # 대시보드 (/)
  real-estate/
    page.tsx          # 부동산 분석 (/real-estate)
  pension/
    page.tsx          # 퇴직연금 분석 (/pension)
  crypto/
    page.tsx          # 가상자산 분석 (/crypto)
  globals.css         # Tailwind CSS 임포트
components/           # 기존 컴포넌트 유지
services/             # 기존 서비스 유지
types.ts              # 기존 타입 유지
```



#### app/layout.tsx

- HTML 구조 및 메타데이터
- Sidebar 컴포넌트 통합
- 클라이언트 컴포넌트로 분리 필요 (상태 관리)

#### app/page.tsx

- 기존 `App.tsx`의 대시보드 로직 이동
- `currentView: 'dashboard'` 상태 관리
- 클라이언트 컴포넌트로 설정

#### app/real-estate/page.tsx

- 부동산 분석 뷰 로직
- `currentView: 'real-estate'` 상태 관리

#### app/pension/page.tsx

- 퇴직연금 분석 뷰 로직
- `currentView: 'pension'` 상태 관리

#### app/crypto/page.tsx

- 가상자산 분석 뷰 로직
- `currentView: 'crypto'` 상태 관리

### 3. 컴포넌트 수정

#### 모든 컴포넌트에 "use client" 추가

- `App.tsx` → 각 페이지 컴포넌트로 분리
- `Sidebar.tsx`: Next.js Link 컴포넌트 사용
- 나머지 컴포넌트: 상태/이벤트 핸들러 사용 시 "use client" 추가

#### Sidebar.tsx 수정

- `onViewChange` 대신 Next.js `useRouter` 및 `Link` 사용
- 현재 경로에 따라 활성 상태 표시 (`usePathname`)

### 4. 스타일링

#### app/globals.css 생성

- Tailwind CSS 디렉티브 임포트
- 기존 커스텀 스타일 유지

#### index.html 제거

- Next.js는 자동으로 HTML 생성

### 5. 환경 변수

#### .env.local 생성

- `GEMINI_API_KEY` 설정
- `.gitignore`에 추가 확인

### 6. 삭제할 파일

- `vite.config.ts`
- `index.html`
- `src/index.tsx`
- `src/App.tsx` (로직은 각 페이지로 분리)

### 7. 공통 로직 처리

#### hooks/ 또는 lib/ 디렉토리 생성 (선택사항)

- 자산 로딩 로직
- 통계 계산 로직
- 히스토리 데이터 생성 로직
- 각 페이지에서 재사용

## 구현 순서

1. Next.js 설정 파일 생성 및 package.json 업데이트
2. Tailwind CSS 설정
3. app/ 디렉토리 구조 생성
4. layout.tsx 및 globals.css 생성
5. Sidebar 컴포넌트를 Next.js Link로 수정
6. App.tsx 로직을 각 페이지로 분리
7. 모든 컴포넌트에 "use client" 추가
8. 기존 Vite 관련 파일 삭제
9. 환경 변수 설정
10. 테스트 및 검증

## 주의사항

- localStorage는 클라이언트 사이드에서만 동작하므로 모든 관련 로직은 클라이언트 컴포넌트에 있어야 함
- Google Gemini API 호출도 클라이언트 사이드에서 수행되므로 "use client" 필요