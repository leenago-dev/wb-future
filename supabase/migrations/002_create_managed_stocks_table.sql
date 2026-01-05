-- managed_stocks 테이블 생성
CREATE TABLE IF NOT EXISTS managed_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_managed_stocks_enabled ON managed_stocks(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_managed_stocks_symbol ON managed_stocks(symbol);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_managed_stocks_updated_at
  BEFORE UPDATE ON managed_stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE managed_stocks ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 사용자가 읽을 수 있음 (공개 데이터)
CREATE POLICY "Allow public read access to managed_stocks"
  ON managed_stocks
  FOR SELECT
  USING (true);

-- 쓰기 정책: anon key로 INSERT/UPDATE/DELETE 허용
-- 실제 보안은 프론트엔드 인증으로 보호됨
CREATE POLICY "Allow anon insert to managed_stocks"
  ON managed_stocks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anon update to managed_stocks"
  ON managed_stocks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to managed_stocks"
  ON managed_stocks
  FOR DELETE
  USING (true);

