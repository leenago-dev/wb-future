
export enum AssetCategory {
  PENSION = 'PENSION',
  REAL_ESTATE = 'REAL_ESTATE',
  CASH = 'CASH',
  STOCK = 'STOCK',
  VIRTUAL_ASSET = 'VIRTUAL_ASSET',
  LOAN = 'LOAN'
}

export type AssetOwner = 'Leena' | 'Husband' | 'Common';

export type LoanType = '신용대출' | '주택담보대출' | '마이너스통장';
export type RepaymentType = '만기일시상환' | '원리금균등분할상환';

export interface AssetMetadata {
  ticker?: string;
  avg_price?: number;
  address?: string;
  purchase_price?: number;
  country?: string; // 투자 국가 (한국, 미국, 중국, 일본, 기타 등)
  // 대출 전용 필드
  loan_type?: LoanType;
  interest_rate?: number;
  repayment_type?: RepaymentType;
  loan_period?: number; // 개월 단위
  is_dsr_excluded?: boolean; // DSR 적용 제외 여부
}

export interface Asset {
  id: string;
  user_id: string;
  owner: AssetOwner;
  category: AssetCategory;
  name: string;
  amount: number; 
  metadata: AssetMetadata;
  created_at: string;
  updated_at: string;
  current_price?: number;
}

export interface DashboardStats {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  totalProfit: number;
  totalRoi: number;
}

export interface HistoryData {
  month: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalProfit: number;
  totalRoi: number;
}

export interface UserProfile {
  annual_income: number;
}
