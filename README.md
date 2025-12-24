# 💰 Wealth Dash - 우리 집 재무제표

> 부부의 자산을 한눈에 파악하고 실시간 데이터를 통해 순자산을 관리하는 개인화된 재무 대시보드

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [프로젝트 구조](#-프로젝트-구조)
- [주요 컴포넌트](#-주요-컴포넌트)
- [데이터 모델](#-데이터-모델)

## 🎯 프로젝트 소개

**Wealth Dash**는 가계의 자산과 부채를 체계적으로 관리하고 시각화하는 개인 재무 관리 대시보드입니다.

### 핵심 가치

- **통합 관리**: 부부의 자산을 하나의 대시보드에서 통합 관리
- **실시간 업데이트**: 주식, 가상자산의 실시간 시세 반영
- **다각도 분석**: 부동산, 퇴직연금, 가상자산 등 카테고리별 심층 분석
- **AI 재무 조언**: Google Gemini AI를 활용한 맞춤형 재무 설계 조언
- **DSR 계산**: 부동산 대출 관련 DSR(총부채원리금상환비율) 자동 계산

## ✨ 주요 기능

### 1. 종합 대시보드
- 총자산, 부채, 순자산 실시간 집계
- 투자 수익률(ROI) 및 수익금 자동 계산
- 소유자별 필터링 (Leena, 남편, 공통)
- 6개월 간 자산 변동 추이 시각화

### 2. 부동산 분석 (DSR)
- 부동산 자산 및 대출 통합 관리
- DSR(총부채원리금상환비율) 자동 계산
- 대출 유형별 분류 (신용대출, 주택담보대출, 마이너스통장)
- 상환 방식별 관리 (만기일시상환, 원리금균등분할상환)

### 3. 퇴직연금 집중 분석
- 국가별 투자 비중 차트
- 종목별 투자 비중 차트
- 수익금 및 수익률 추이 그래프
- 평균 매입가 대비 현재가 비교

### 4. 가상자산 분석
- 실시간 가격 업데이트
- 티커 기반 자동 시세 조회
- 수익률 및 평가손익 계산

### 5. AI 재무 조언
- Google Gemini AI 기반 맞춤형 조언
- 현재 자산 구성 분석
- 카테고리별 최적화 제안

### 6. 차트 및 시각화
- Recharts 기반 인터랙티브 차트
- 자산 배분 파이 차트
- 월별 순자산/총자산 라인 차트
- 자산/부채 흐름 바 차트

## 🛠 기술 스택

### Frontend
- **React 19.2.3** - UI 라이브러리
- **TypeScript 5.8.2** - 타입 안전성
- **Vite 6.2.0** - 빌드 도구
- **Tailwind CSS** - 스타일링 (유틸리티 클래스 기반)

### Data Visualization
- **Recharts 3.6.0** - 차트 라이브러리

### AI Integration
- **@google/genai 1.34.0** - Google Gemini AI

### Development Tools
- **@vitejs/plugin-react** - React Fast Refresh
- **@types/node** - Node.js 타입 정의

## 🚀 시작하기

### 사전 요구사항

- Node.js 18 이상
- pnpm (권장 패키지 매니저)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm run dev

# 프로덕션 빌드
pnpm run build

# 빌드 결과 미리보기
pnpm run preview
```

### 환경 변수 설정

AI 조언 기능을 사용하려면 Google Gemini API 키가 필요합니다:

```bash
# .env 파일 생성
API_KEY=your_google_gemini_api_key
```

## 📁 프로젝트 구조

```
wb-future/
├── src/
│   ├── App.tsx                          # 메인 앱 컴포넌트
│   ├── index.tsx                        # 앱 진입점
│   └── components/
│       ├── AssetForm.tsx                # 자산 추가/수정 폼
│       ├── AssetList.tsx                # 자산 목록 표시
│       ├── AssetLiabilityBarChart.tsx   # 자산/부채 바 차트
│       ├── Charts.tsx                   # 자산 배분 파이 차트
│       ├── DsrCalculator.tsx            # DSR 계산기
│       ├── HistoryChart.tsx             # 순자산 추이 차트
│       ├── ProfitHistoryChart.tsx       # 수익률 추이 차트
│       └── Sidebar.tsx                  # 네비게이션 사이드바
├── services/
│   └── mockApi.ts                       # 로컬 스토리지 기반 API
├── types.ts                             # TypeScript 타입 정의
├── index.html                           # HTML 템플릿
├── vite.config.ts                       # Vite 설정
├── tsconfig.json                        # TypeScript 설정
└── package.json                         # 프로젝트 메타데이터
```

## 🧩 주요 컴포넌트

### App.tsx
- 전체 앱의 상태 관리
- 자산 데이터 로딩 및 실시간 가격 업데이트
- 통계 계산 (총자산, 부채, 순자산, ROI)
- 히스토리 데이터 생성 (6개월 추이)
- AI 조언 생성

### AssetForm.tsx
- 자산/부채 추가 및 수정 폼
- 카테고리별 동적 입력 필드
- 유효성 검증

### Charts.tsx
- 자산 배분 파이 차트
- 카테고리별/국가별/종목별 그룹화 지원

### DsrCalculator.tsx
- 연소득 입력 및 DSR 계산
- 대출별 월 상환액 계산
- DSR 기준 초과 여부 경고

### Sidebar.tsx
- 반응형 네비게이션
- 뷰 전환 (종합 대시보드, 부동산, 퇴직연금, 가상자산)
- 모바일 햄버거 메뉴

## 📊 데이터 모델

### Asset (자산)

```typescript
interface Asset {
  id: string;                    // 고유 ID
  user_id: string;               // 사용자 ID
  owner: 'Leena' | 'Husband' | 'Common';  // 소유자
  category: AssetCategory;       // 카테고리
  name: string;                  // 자산명
  amount: number;                // 금액/수량
  metadata: AssetMetadata;       // 추가 정보
  created_at: string;            // 생성일
  updated_at: string;            // 수정일
  current_price?: number;        // 현재가 (주식/가상자산)
}
```

### AssetCategory (자산 카테고리)

```typescript
enum AssetCategory {
  PENSION = 'PENSION',           // 퇴직연금
  REAL_ESTATE = 'REAL_ESTATE',   // 부동산
  CASH = 'CASH',                 // 현금
  STOCK = 'STOCK',               // 주식
  VIRTUAL_ASSET = 'VIRTUAL_ASSET', // 가상자산
  LOAN = 'LOAN'                  // 대출
}
```

### AssetMetadata (자산 메타데이터)

```typescript
interface AssetMetadata {
  ticker?: string;               // 티커 심볼 (주식/가상자산)
  avg_price?: number;            // 평균 매입가
  address?: string;              // 부동산 주소
  purchase_price?: number;       // 부동산 매입가
  country?: string;              // 투자 국가
  loan_type?: LoanType;          // 대출 유형
  interest_rate?: number;        // 대출 이자율
  repayment_type?: RepaymentType; // 상환 방식
  loan_period?: number;          // 대출 기간 (개월)
  is_dsr_excluded?: boolean;     // DSR 제외 여부
}
```

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: Blue-600 (메인 액션)
- **Success**: Emerald-600 (수익)
- **Danger**: Rose-600 (손실/부채)
- **Background**: Gray-50 (배경)
- **Card**: White (카드 배경)

### 반응형 디자인
- **Mobile**: < 640px (모바일 최적화)
- **Tablet**: 640px ~ 1024px (태블릿 레이아웃)
- **Desktop**: > 1024px (데스크톱 풀 레이아웃)

## 🔒 데이터 저장

현재 버전은 **localStorage**를 사용하여 브라우저에 데이터를 저장합니다.

- 키: `wealth-dash-assets`
- 형식: JSON 배열
- 자동 저장: 자산 추가/수정/삭제 시 즉시 반영

## 🤖 AI 조언 기능

Google Gemini AI를 활용하여:
- 현재 자산 구성 분석
- 부채 비율 평가
- 투자 포트폴리오 조언
- 카테고리별 맞춤 제안

## 📈 향후 계획

- [ ] 백엔드 API 연동 (Supabase/Firebase)
- [ ] 사용자 인증 시스템
- [ ] 다중 사용자 지원
- [ ] 자산 변동 알림
- [ ] 목표 설정 및 추적
- [ ] 월별 리포트 생성
- [ ] 데이터 내보내기 (CSV/PDF)
- [ ] 다크 모드 지원

## 📝 라이선스

이 프로젝트는 개인 사용을 위한 프로젝트입니다.

## 👥 개발자

**Leena** - 개인 재무 관리 솔루션

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
