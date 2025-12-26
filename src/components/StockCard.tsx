'use client';

import { useState } from 'react';
import { quoteCache } from '@/services/quoteCache';

interface StockData {
  symbol: string;
  price: number;
  currency: string;
  name: string;
  changePercent: number;
}

export default function StockCard() {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStockPrice = async () => {
    if (!ticker) return;

    setLoading(true);
    setError('');
    setStockData(null);

    try {
      const data = await quoteCache.getQuote(ticker);
      setStockData({
        symbol: data.symbol,
        price: data.price,
        currency: data.currency || 'USD',
        name: data.name || ticker,
        changePercent: data.changePercent || 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchStockPrice();
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border shadow-sm">
      <h2 className="text-base font-black text-gray-800 mb-4 flex items-center gap-2">
        📈 주식 조회하기
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="예: AAPL, TSLA"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          className="border border-gray-200 p-2.5 rounded-xl w-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={fetchStockPrice}
          disabled={loading || !ticker}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors active:scale-95"
        >
          {loading ? '...' : '조회'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {stockData && (
        <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-600 mb-2 font-medium">{stockData.name}</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-gray-900">
              {stockData.price.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-gray-600 font-medium">{stockData.currency}</span>
          </div>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold ${stockData.changePercent >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {stockData.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stockData.changePercent).toFixed(2)}%
            </p>
            <span className="text-xs text-gray-500">({stockData.symbol})</span>
          </div>
        </div>
      )}
    </div>
  );
}
