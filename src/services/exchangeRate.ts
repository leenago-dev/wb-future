import { EXCHANGE_RATE, CACHE, STORAGE_KEYS, EXCHANGE_RATE_API } from '@/config/app';

interface ExchangeRateData {
  rate: number;
  timestamp: number;
}

interface CachedRate {
  data: ExchangeRateData;
  timestamp: number;
}

interface RateCacheStorage {
  [pair: string]: CachedRate;
}

class ExchangeRateCache {
  private readonly STORAGE_KEY = STORAGE_KEYS.EXCHANGE_RATE_CACHE;
  private readonly TTL = CACHE.TTL_MS;
  private pendingRequests = new Map<string, Promise<number>>();
  private readonly DEFAULT_RATE = EXCHANGE_RATE.DEFAULT_USD_KRW;

  constructor() {
    this._pruneCache();
  }

  async getUsdKrwRate(forceRefresh = false): Promise<number> {
    const pair = EXCHANGE_RATE_API.PAIR;

    if (!forceRefresh) {
      const cached = this._getFromStorage(pair);
      if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < this.TTL) {
          return cached.data.rate;
        }
      }
    }

    if (this.pendingRequests.has(pair)) {
      return this.pendingRequests.get(pair)!;
    }

    const request = this._fetchExchangeRate();
    this.pendingRequests.set(pair, request);

    try {
      const rate = await request;
      this._saveToStorage(pair, rate);
      this._pruneCache();
      return rate;
    } catch (error) {
      console.warn('환율 조회 실패, 기본값 사용:', error);
      return this.DEFAULT_RATE;
    } finally {
      this.pendingRequests.delete(pair);
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

  private _fetchExchangeRate(): Promise<number> {
    return fetch(`/api/quote?symbol=${EXCHANGE_RATE_API.SYMBOL}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('환율 정보를 가져오는 중 오류가 발생했습니다.');
        }
        return res.json();
      })
      .then((data: { price: number }) => {
        if (!data || !data.price) {
          throw new Error('환율 정보를 찾을 수 없습니다.');
        }
        return data.price;
      });
  }

  private _getFromStorage(pair: string): CachedRate | undefined {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return undefined;
      }

      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return undefined;
      }

      const cache: RateCacheStorage = JSON.parse(stored);
      return cache[pair];
    } catch (error) {
      console.warn('로컬 스토리지에서 캐시 읽기 실패:', error);
      return undefined;
    }
  }

  private _saveToStorage(pair: string, rate: number): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      const cache: RateCacheStorage = stored ? JSON.parse(stored) : {};

      cache[pair] = {
        data: {
          rate,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      };

      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('로컬 스토리지에 캐시 저장 실패:', error);
    }
  }

  private _loadFromStorage(): RateCacheStorage {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return {};
      }

      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return {};
      }

      return JSON.parse(stored) as RateCacheStorage;
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

      Object.keys(cache).forEach((pair) => {
        if (now - cache[pair].timestamp > this.TTL) {
          delete cache[pair];
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

export const exchangeRateCache = new ExchangeRateCache();
