/**
 * 애플리케이션 전역 설정 값
 */

// 환율 설정
export const EXCHANGE_RATE = {
  DEFAULT_USD_KRW: 1450, // 기본 USD/KRW 환율 (API 실패 시 사용)
  INITIAL_USD_KRW: 1450, // 초기 환율 (로딩 전 기본값)
} as const;

// 캐시 설정
export const CACHE = {
  TTL_MS: 300 * 1000, // 5분 (밀리초)
} as const;

// 로컬스토리지 키
export const STORAGE_KEYS = {
  ASSETS: 'wealth_dash_assets',
  PROFILE: 'wealth_dash_profile',
  QUOTE_CACHE: 'wealth-dash-quote-cache',
  EXCHANGE_RATE_CACHE: 'wealth-dash-exchange-rate-cache-v2', // v2: exchange_rates 테이블 사용
} as const;

// 사용자 설정
export const USER = {
  DEFAULT_USER_ID: 'leena-husband-uuid',
  DEFAULT_ANNUAL_INCOME: 0, // 기본 연소득 (6천만원)
} as const;

// 환율 API 설정
export const EXCHANGE_RATE_API = {
  SYMBOL: 'USD/KRW', // exchange_rates 테이블의 환율 심볼
  PAIR: 'USDKRW', // 환율 페어 코드
} as const;

// 히스토리 데이터 설정
export const HISTORY = {
  MONTHS_COUNT: 6, // 표시할 히스토리 개월 수
  MARKET_VARIANCE_FACTOR: 0.015, // 월별 시장 변동 계수
} as const;

// DSR 설정
export const DSR = {
  BANK_LIMIT_PERCENTAGE: 40, // 금융권 DSR 임계값 (2025.12. 기준 40%)
  FORMULA_TITLE: 'DSR 산정 공식',
  FORMULA: 'DSR = (모든 대출의 연간 원리금 상환액) ÷ (연 소득) × 100',
  REPAYMENT_METHOD_TITLE: '상환 방식별 산정 (금융권 기준)',
  REPAYMENT_METHODS: [
    { type: '만기일시', formula: '(원금 / 대출기간) + 연간 이자' },
    { type: '원리금균등', formula: '연간 총 원리금 상환액' },
  ] as const,
  EXCLUDED_TARGETS_TITLE: '주요 제외 대상 (DSR 미반영)',
  EXCLUDED_TARGETS: [
    '전세자금대출',
    '보금자리론/특례보금자리론',
    '신생아 특례 구입·전세자금',
    '분양주택 중도금대출',
    '이주비 대출 / 추가분담금 중도금',
    '서민금융상품 (새희망홀씨 등)',
    '300만원 이하 소액 신용대출',
    '보험계약대출 / 예적금 담보대출',
    '할부·리스 및 현금서비스 등',
  ] as const,
} as const;

// 소유자별 표시 이름
export const OWNER_LABELS = {
  Total: '합계',
  Leena: '밤이',
  Husband: '웡이',
  Common: '공통',
} as const;

// 소유자 필터 옵션 (표시 순서) - 타입 값 사용
export const OWNER_FILTER_OPTIONS = ['Total', 'Husband', 'Leena', 'Common'] as const;

// 소유자 폼 옵션 (Total 제외, 폼에서 사용) - 타입 값 사용
export const OWNER_FORM_OPTIONS = ['Husband', 'Leena', 'Common'] as const;

// 기본 소유자 - 타입 값 사용
export const DEFAULT_OWNER = 'Leena' as const;

// 사이드바 사용자 이름 표시
export const SIDEBAR_USER_NAME = '웡밤이' as const;

// 국가 목록
export const COUNTRIES = ['한국', '미국', '중국', '일본', '기타'] as const;

// 대출 종류 옵션
export const LOAN_TYPES = ['신용대출', '주택담보대출', '마이너스통장'] as const;

// 상환 방식 옵션
export const REPAYMENT_TYPES = ['만기일시상환', '원리금균등분할상환'] as const;

// 사이드바 메뉴 아이템 설정
export const SIDEBAR_MENU_ITEMS = [
  { id: 'dashboard', label: '종합 대시보드' },
  { id: 'real-estate', label: '부동산 분석' },
  { id: 'pension', label: '퇴직연금 분석' },
  { id: 'stock', label: '주식 분석' },
  { id: 'crypto', label: '가상자산 분석' },
] as const;
