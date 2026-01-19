// src/lib/api.ts

// 환경변수에서 백엔드 주소를 가져옴 (없으면 로컬호스트)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface StockName {
  symbol: string;
  name: string | null;
  country: string | null;
  currency: string | null;
  source: string | null;
  is_active: boolean | null;
}

// 종목명 조회 함수 (Cloud Run 백엔드 호출)
export async function getStockName(symbol: string): Promise<StockName | null> {
  const url = `${API_BASE_URL}/stocks-name/${symbol}?fields=name`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // 종목 없음
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to fetch stock name for ${symbol}:`, error.message);
      console.error(`API URL: ${url}`);
    } else {
      console.error("Failed to fetch stock name:", error);
    }
    return null;
  }
}

// 종목 국가 조회 함수 (Cloud Run 백엔드 호출)
export async function getStockCountry(symbol: string): Promise<StockName | null> {
  const url = `${API_BASE_URL}/stocks-name/${symbol}?fields=country`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // 종목 없음
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to fetch stock country for ${symbol}:`, error.message);
      console.error(`API URL: ${url}`);
    } else {
      console.error("Failed to fetch stock country:", error);
    }
    return null;
  }
}

// 종목 통화 조회 함수 (Cloud Run 백엔드 호출)
export async function getStockCurrency(symbol: string): Promise<StockName | null> {
  const url = `${API_BASE_URL}/stocks-name/${symbol}?fields=currency`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // 종목 없음
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to fetch stock currency for ${symbol}:`, error.message);
      console.error(`API URL: ${url}`);
    } else {
      console.error("Failed to fetch stock currency:", error);
    }
    return null;
  }
}
