/**
 * 애플리케이션 전역 설정 값
 */

// 환율 설정
export const EXCHANGE_RATE = {
  DEFAULT_USD_KRW: 1450, // 기본 USD/KRW 환율 (API 실패 시 사용)
  INITIAL_USD_KRW: 1300, // 초기 환율 (로딩 전 기본값)
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
  EXCHANGE_RATE_CACHE: 'wealth-dash-exchange-rate-cache',
} as const;

// 사용자 설정
export const USER = {
  DEFAULT_USER_ID: 'leena-husband-uuid',
  DEFAULT_ANNUAL_INCOME: 0, // 기본 연소득 (6천만원)
} as const;

// 환율 API 설정
export const EXCHANGE_RATE_API = {
  SYMBOL: 'USDKRW=X', // Yahoo Finance 환율 티커
  PAIR: 'USDKRW', // 환율 페어 코드
} as const;

// 히스토리 데이터 설정
export const HISTORY = {
  MONTHS_COUNT: 6, // 표시할 히스토리 개월 수
  MARKET_VARIANCE_FACTOR: 0.015, // 월별 시장 변동 계수
} as const;
