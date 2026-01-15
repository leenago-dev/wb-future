'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { quoteCache } from '@/services/quoteCache';
import { cn } from '@/lib/utils';

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
    <Card className="p-6 rounded-3xl">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="flex items-center gap-2">
          📈 주식 조회하기
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="예: AAPL, TSLA"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="rounded-xl font-bold"
          />
          <Button
            onClick={fetchStockPrice}
            disabled={loading || !ticker}
            className="font-bold text-sm rounded-xl"
          >
            {loading ? '...' : '조회'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
            <p className="text-destructive text-sm font-medium">{error}</p>
          </div>
        )}

        {stockData && (
          <div className="mt-4 p-4 bg-gradient-to-br from-muted to-muted/50 border rounded-xl">
            <p className="text-sm text-muted-foreground mb-2 font-medium">{stockData.name}</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-foreground">
                {stockData.price.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-muted-foreground font-medium">{stockData.currency}</span>
            </div>
            <div className="flex items-center gap-2">
              <p className={cn('text-sm font-bold', stockData.changePercent >= 0 ? 'text-destructive' : 'text-primary')}>
                {stockData.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stockData.changePercent).toFixed(2)}%
              </p>
              <span className="text-xs text-muted-foreground">({stockData.symbol})</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
