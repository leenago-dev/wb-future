import { AssetCategory } from '@/types';
import { quoteCache } from './quoteCache';

/**
 * 가상자산 가격 조회 (모의 데이터)
 */
export const fetchCryptoPrice = async (ticker: string): Promise<number> => {
  const mockPrices: Record<string, number> = {
    'BTC': 95000000 + (Math.random() * 1000000),
    'ETH': 3500000 + (Math.random() * 50000),
  };

  await new Promise(resolve => setTimeout(resolve, 500));
  return mockPrices[ticker] || 10000 + (Math.random() * 1000);
};

/**
 * 주식 가격 조회 (실제 API 사용)
 */
export const fetchStockPrice = async (ticker: string): Promise<number> => {
  try {
    const quote = await quoteCache.getQuote(ticker);
    return quote.price;
  } catch (error) {
    console.error('주식 가격 조회 오류:', error);
    throw error;
  }
};

/**
 * 카테고리에 따라 적절한 가격 조회 함수 호출
 */
export const fetchCurrentPrice = async (ticker: string, category?: AssetCategory): Promise<number> => {
  // 주식/퇴직연금의 경우 실제 API 사용
  if (category === AssetCategory.STOCK || category === AssetCategory.PENSION) {
    return fetchStockPrice(ticker);
  }

  // 가상자산의 경우 모의 데이터 사용
  if (category === AssetCategory.VIRTUAL_ASSET) {
    return fetchCryptoPrice(ticker);
  }

  return 0;
};
