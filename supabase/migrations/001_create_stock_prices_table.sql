-- stock_prices 테이블 생성
CREATE TABLE IF NOT EXISTS stock_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  close_price NUMERIC(15, 4) NOT NULL,
  currency TEXT,
  name TEXT,
  change_percent NUMERIC(10, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date ON stock_prices(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_prices_date ON stock_prices(date DESC);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_stock_prices_updated_at
  BEFORE UPDATE ON stock_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 사용자가 읽을 수 있음 (공개 데이터)
CREATE POLICY "Allow public read access to stock_prices"
  ON stock_prices
  FOR SELECT
  USING (true);

-- 쓰기 정책: anon key로 INSERT/UPDATE 허용
-- 실제 보안은 Next.js API Route의 CRON_SECRET으로 보호됨
CREATE POLICY "Allow anon insert to stock_prices"
  ON stock_prices
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anon update to stock_prices"
  ON stock_prices
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
