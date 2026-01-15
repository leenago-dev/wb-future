import { CACHE, STORAGE_KEYS } from '@/config/app';

interface QuoteData {
  symbol: string;
  price: number;
  currency?: string;
  name?: string;
  changePercent?: number;
}

interface CachedQuote {
  data: QuoteData;
  timestamp: number;
}

interface CacheStorage {
  [symbol: string]: CachedQuote;
}

class QuoteCache {
  private readonly STORAGE_KEY = STORAGE_KEYS.QUOTE_CACHE;
  private readonly TTL = CACHE.TTL_MS;
  private pendingRequests = new Map<string, Promise<QuoteData>>();

  constructor() {
    this._pruneCache();
  }

  async getQuote(symbol: string, forceRefresh = false): Promise<QuoteData> {
    if (!symbol) {
      throw new Error('티커를 입력해주세요.');
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!forceRefresh) {
      const cached = this._getFromStorage(normalizedSymbol);
      if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < this.TTL) {
          return cached.data;
        }
      }
    }

    if (this.pendingRequests.has(normalizedSymbol)) {
      return this.pendingRequests.get(normalizedSymbol)!;
    }

    const request = this._fetchQuote(normalizedSymbol);
    this.pendingRequests.set(normalizedSymbol, request);

    try {
      const quote = await request;
      this._saveToStorage(normalizedSymbol, quote);
      this._pruneCache();
      return quote;
    } catch (error) {
      throw error;
    } finally {
      this.pendingRequests.delete(normalizedSymbol);
    }
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.warn('로컬 스토리지 캐시 삭제 실패:', error);
    }
  }

  private _fetchQuote(symbol: string): Promise<QuoteData> {
    return fetch(`/api/quote?symbol=${symbol}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || '주식 정보를 가져오는 중 오류가 발생했습니다.');
          });
        }
        return res.json();
      })
      .then((data: QuoteData) => {
        if (!data || !data.price) {
          throw new Error('가격 정보를 찾을 수 없습니다.');
        }
        return data;
      });
  }

  private _getFromStorage(symbol: string): CachedQuote | undefined {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return undefined;
      }

      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return undefined;
      }

      const cache: CacheStorage = JSON.parse(stored);
      return cache[symbol];
    } catch (error) {
      console.warn('로컬 스토리지에서 캐시 읽기 실패:', error);
      return undefined;
    }
  }

  private _saveToStorage(symbol: string, data: QuoteData): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      const cache: CacheStorage = stored ? JSON.parse(stored) : {};

      cache[symbol] = {
        data,
        timestamp: Date.now(),
      };

      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('로컬 스토리지에 캐시 저장 실패:', error);
    }
  }

  private _loadFromStorage(): CacheStorage {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return {};
      }

      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return {};
      }

      return JSON.parse(stored) as CacheStorage;
    } catch (error) {
      console.warn('로컬 스토리지에서 캐시 로드 실패:', error);
      return {};
    }
  }

  private _pruneCache(): void {
    try {
      const now = Date.now();
      const cache = this._loadFromStorage();
      let hasChanges = false;

      Object.keys(cache).forEach((symbol) => {
        if (now - cache[symbol].timestamp > this.TTL) {
          delete cache[symbol];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
        }
      }
    } catch (error) {
      console.warn('캐시 정리 실패:', error);
    }
  }
}

export const quoteCache = new QuoteCache();
export type { QuoteData };
