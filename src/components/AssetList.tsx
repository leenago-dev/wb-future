'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Asset, AssetCategory, AssetOwner } from '@/types';
import { EXCHANGE_RATE, OWNER_LABELS } from '@/config/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  exchangeRate?: number;
}

// ============================================
// 📊 유틸리티 함수들
// ============================================

const CATEGORY_ICONS: Record<AssetCategory, string> = {
  [AssetCategory.CASH]: '💰',
  [AssetCategory.REAL_ESTATE]: '🏠',
  [AssetCategory.PENSION]: '🎁',
  [AssetCategory.STOCK]: '📈',
  [AssetCategory.VIRTUAL_ASSET]: '🔗',
  [AssetCategory.LOAN]: '💸',
};

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  [AssetCategory.VIRTUAL_ASSET]: '가상자산',
  [AssetCategory.REAL_ESTATE]: '부동산',
  [AssetCategory.PENSION]: '퇴직연금',
  [AssetCategory.STOCK]: '주식/ETF',
  [AssetCategory.LOAN]: '대출 및 부채',
  [AssetCategory.CASH]: '현금성 자산',
};

const formatCurrency = (val: number, currency: 'KRW' | 'USD' = 'KRW'): string => {
  const locale = currency === 'USD' ? 'en-US' : 'ko-KR';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(val);
};

const isInvestmentAsset = (category: AssetCategory): boolean => {
  return [AssetCategory.STOCK, AssetCategory.PENSION, AssetCategory.VIRTUAL_ASSET].includes(category);
};

const calculateAssetValue = (asset: Asset): number => {
  if (!isInvestmentAsset(asset.category)) {
    // 부동산과 대출은 만원 단위로 저장되어 있으므로 원 단위로 변환
    if (asset.category === AssetCategory.REAL_ESTATE || asset.category === AssetCategory.LOAN) {
      return asset.amount * 10000;
    }
    return asset.amount;
  }

  const price = asset.current_price ?? asset.metadata.avg_price ?? 0;
  return price * asset.amount;
};

const calculateProfitRate = (asset: Asset): number => {
  if (!isInvestmentAsset(asset.category)) {
    return 0;
  }

  const currentPrice = asset.current_price ?? asset.metadata.avg_price ?? 0;
  const avgPrice = asset.metadata.avg_price ?? 0;

  if (avgPrice === 0) return 0;

  return ((currentPrice - avgPrice) / avgPrice) * 100;
};

const calculateMonthlyLoanPayment = (asset: Asset): number => {
  if (asset.category !== AssetCategory.LOAN || !asset.metadata.interest_rate) {
    return 0;
  }

  // 대출 원금은 만원 단위로 저장되어 있으므로 원 단위로 변환
  const principal = asset.amount * 10000;
  const annualRate = asset.metadata.interest_rate;
  const monthlyRate = annualRate / 12 / 100;
  const months = asset.metadata.loan_period ?? 12;

  if (asset.metadata.repayment_type === '만기일시상환') {
    return principal * monthlyRate;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
};

const isUsdAsset = (asset: Asset): boolean => {
  return asset.currency === 'USD' || asset.metadata.country === '미국';
};

const groupAssetsByCategory = (assets: Asset[]): Record<string, Asset[]> => {
  return assets.reduce((acc, asset) => {
    const categoryKey = asset.category;
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);
};

// ============================================
// 🧩 서브 컴포넌트들
// ============================================

interface CurrencyDisplayProps {
  currency: 'KRW' | 'USD';
  value: number;
  profitRate?: number;
  profitAmount?: number;
  isPositive?: boolean;
  isPrimary?: boolean;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  currency,
  value,
  profitRate,
  profitAmount,
  isPositive = false,
  isPrimary = true,
}) => {
  const hasProfit = profitRate !== undefined && profitRate !== 0;
  const formattedValue = formatCurrency(value, currency);
  const displayValue = currency === 'KRW'
    ? formattedValue.replace('₩', '₩ ')
    : formattedValue.replace('$', '$ ');

  return (
    <div className="text-right">
      <p className={cn(
        'font-bold text-slate-400 mb-1 tracking-wider uppercase',
        isPrimary ? 'text-[11px] font-medium' : 'text-[10px]'
      )}>
        {currency}
      </p>
      <p className={cn(
        'text-[18px] font-bold leading-none text-slate-900'
      )}>
        {displayValue}
      </p>
      {hasProfit && (
        <p className={cn(
          'text-xs mt-2 font-bold',
          isPositive ? 'text-rose-500' : 'text-blue-500'
        )}>
          {isPrimary ? (
            <>
              {isPositive ? '▲' : '▼'} {Math.abs(profitRate).toFixed(2)}%
              {profitAmount !== undefined && (
                <> ({isPositive ? '+' : ''}{formatCurrency(profitAmount, currency)})</>
              )}
            </>
          ) : (
            profitAmount !== undefined && (
              <>{isPositive ? '+' : ''}{formatCurrency(profitAmount, currency)}</>
            )
          )}
        </p>
      )}
    </div>
  );
};

interface InvestmentAssetInfoProps {
  name: string;
  ticker?: string;
  country?: string;
  amount: number;
  avgPrice?: number;
  isUsd: boolean;
}

const InvestmentAssetInfo: React.FC<InvestmentAssetInfoProps> = ({
  name,
  ticker,
  country,
  amount,
  avgPrice,
  isUsd,
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-2xl font-bold tracking-tight text-slate-900">{name}</span>
      {ticker && (
        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-semibold">
          {ticker}
        </span>
      )}
    </div>
    <div className="flex gap-3 text-xs text-slate-500 font-medium items-center flex-wrap">
      {country && (
        <>
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            {country}
          </span>
          <span className="w-px h-3 bg-slate-200"></span>
        </>
      )}
      <span>{amount.toLocaleString()}주</span>
      {avgPrice && (
        <>
          <span className="w-px h-3 bg-slate-200"></span>
          <span>평단가: {formatCurrency(avgPrice, isUsd ? 'USD' : 'KRW')}</span>
        </>
      )}
    </div>
  </div>
);

interface AssetHeaderProps {
  category: AssetCategory;
  owner: AssetOwner;
  onEdit: () => void;
  onDelete: () => void;
}

const AssetHeader: React.FC<AssetHeaderProps> = ({ category, owner, onEdit, onDelete }) => (
  <div className="flex justify-between items-center mb-1 pb-4 border-b border-slate-50 gap-3">
    <div className="flex items-center gap-2">
      <span className="text-xl">{CATEGORY_ICONS[category]}</span>
      <span className="font-bold text-slate-700">{CATEGORY_LABELS[category]}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded border border-blue-100/50 uppercase tracking-widest">
        {OWNER_LABELS[owner]}
      </span>
      <ActionButtons onEdit={onEdit} onDelete={onDelete} variant="compact" />
    </div>
  </div>
);

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  variant?: 'compact' | 'default';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onEdit, onDelete, variant = 'default' }) => {
  const isCompact = variant === 'compact';

  return (
    <div className={cn(
      'flex items-center opacity-0 group-hover:opacity-100 transition-opacity',
      isCompact ? 'gap-1' : 'gap-3'
    )}>
      <Button
        onClick={onEdit}
        variant="ghost"
        size="sm"
        className={cn(
          'uppercase tracking-widest h-auto py-1 px-2',
          isCompact && 'text-[10px]'
        )}
      >
        {isCompact ? '수정' : 'Edit'}
      </Button>
      <Button
        onClick={onDelete}
        variant="ghost"
        size="sm"
        className={cn(
          'uppercase tracking-widest h-auto py-1 px-2 text-destructive hover:text-destructive',
          isCompact && 'text-[10px]'
        )}
      >
        {isCompact ? '삭제' : 'Del'}
      </Button>
    </div>
  );
};

interface AssetBadgesProps {
  asset: Asset;
  isLoan: boolean;
  dsrExcluded: boolean;
}

const AssetBadges: React.FC<AssetBadgesProps> = ({ asset, isLoan, dsrExcluded }) => (
  <>
    <Badge variant="default" className="px-2 py-0.5 text-[11px] uppercase">
      {OWNER_LABELS[asset.owner as AssetOwner]}
    </Badge>

    {asset.metadata.country && (
      <Badge variant="outline" className="text-[11px]">
        📍 {asset.metadata.country}
      </Badge>
    )}

    {isLoan && (
      <Badge
        variant={dsrExcluded ? 'secondary' : 'destructive'}
        className="text-[11px] uppercase"
      >
        {dsrExcluded ? 'DSR 제외' : 'DSR 포함'}
      </Badge>
    )}
  </>
);

interface AssetDetailsProps {
  asset: Asset;
  isLoan: boolean;
}

const AssetDetails: React.FC<AssetDetailsProps> = ({ asset, isLoan }) => (
  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-bold">
    {asset.metadata.ticker && (
      <Badge variant="outline" className="px-2 py-0.5 font-mono uppercase tracking-tighter">
        {asset.metadata.ticker}
      </Badge>
    )}

    {asset.category === AssetCategory.REAL_ESTATE && (
      <span className="truncate max-w-[200px]">{asset.metadata.address}</span>
    )}

    {isLoan && (
      <div className="flex items-center gap-2 text-destructive/70">
        <Badge variant="outline" className="bg-destructive/10 border-destructive/20 text-destructive px-2 py-0.5">
          {asset.metadata.loan_type}
        </Badge>
        <Badge variant="outline" className="bg-destructive/10 border-destructive/20 text-destructive px-2 py-0.5">
          {asset.metadata.interest_rate}% ({asset.metadata.repayment_type})
        </Badge>
      </div>
    )}

    {!isLoan && (
      <span>
        {asset.category === AssetCategory.CASH
          ? '자산 총액'
          : `${asset.amount.toLocaleString()} Units`}
      </span>
    )}
  </div>
);

interface AssetValueDisplayProps {
  value: number;
  isUsd: boolean;
  exchangeRate: number;
  isLoan: boolean;
}

const AssetValueDisplay: React.FC<AssetValueDisplayProps> = ({
  value,
  isUsd,
  exchangeRate,
  isLoan,
}) => {
  const usdValue = isUsd ? value : undefined;
  const krwValue = isUsd ? value * exchangeRate : value;

  return (
    <p
      className={cn(
        'font-black text-lg leading-tight tracking-tight',
        isLoan ? 'text-destructive' : 'text-foreground'
      )}
    >
      {isUsd && usdValue !== undefined ? (
        <>
          {formatCurrency(usdValue, 'USD')} | {formatCurrency(krwValue, 'KRW')}
        </>
      ) : (
        formatCurrency(krwValue, 'KRW')
      )}
    </p>
  );
};

interface ProfitDisplayProps {
  asset: Asset;
  profitRate: number;
  exchangeRate: number;
}

const ProfitDisplay: React.FC<ProfitDisplayProps> = ({ asset, profitRate, exchangeRate }) => {
  if (profitRate === 0) return null;

  const currentValue = calculateAssetValue(asset);
  const principal = (asset.metadata.avg_price ?? 0) * asset.amount;
  const profitAmount = currentValue - principal;
  const isUsd = isUsdAsset(asset);

  const usdProfitAmount = isUsd ? profitAmount : undefined;
  const krwProfitAmount = isUsd ? profitAmount * exchangeRate : profitAmount;

  return (
    <p
      className={cn(
        'text-[11px] font-black mt-1',
        profitRate > 0 ? 'text-destructive' : 'text-primary'
      )}
    >
      {profitRate > 0 ? '▲' : '▼'} {Math.abs(profitRate).toFixed(2)}%
      {isUsd && usdProfitAmount !== undefined ? (
        <>
          {' '}
          ({formatCurrency(usdProfitAmount, 'USD')} | {formatCurrency(krwProfitAmount, 'KRW')})
        </>
      ) : (
        <> ({formatCurrency(krwProfitAmount, 'KRW')})</>
      )}
    </p>
  );
};

interface AssetItemProps {
  asset: Asset;
  exchangeRate: number;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

// 투자 자산 전용 카드 (주식, 퇴직연금)
const InvestmentAssetItem: React.FC<AssetItemProps> = ({ asset, exchangeRate, onEdit, onDelete }) => {
  const profitRate = calculateProfitRate(asset);
  const value = calculateAssetValue(asset);
  const isUsd = isUsdAsset(asset);
  const isPositive = profitRate >= 0;

  const usdValue = isUsd ? value : undefined;
  const krwValue = isUsd ? value * exchangeRate : value;

  const currentValue = calculateAssetValue(asset);
  const principal = (asset.metadata.avg_price ?? 0) * asset.amount;
  const profitAmount = currentValue - principal;
  const usdProfitAmount = isUsd ? profitAmount : undefined;
  const krwProfitAmount = isUsd ? profitAmount * exchangeRate : profitAmount;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all group">
      <AssetHeader
        category={asset.category}
        owner={asset.owner as AssetOwner}
        onEdit={() => onEdit(asset)}
        onDelete={() => onDelete(asset.id)}
      />

      {/* Main Content: Minimalist Split Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
        <InvestmentAssetInfo
          name={asset.name}
          ticker={asset.metadata.ticker}
          country={asset.metadata.country}
          amount={asset.amount}
          avgPrice={asset.metadata.avg_price}
          isUsd={isUsd}
        />

        {/* Currency Split Module */}
        <div className="bg-slate-50 p-5 rounded-2xl flex items-center gap-6 border border-slate-100">
          {isUsd && usdValue !== undefined ? (
            <>
              <CurrencyDisplay
                currency="KRW"
                value={krwValue}
                profitRate={profitRate}
                isPositive={isPositive}
                isPrimary={true}
              />

              <div className="w-px h-12 bg-slate-200"></div>

              <CurrencyDisplay
                currency="USD"
                value={usdValue}
                profitRate={profitRate}
                profitAmount={usdProfitAmount}
                isPositive={isPositive}
                isPrimary={false}
              />
            </>
          ) : (
            <CurrencyDisplay
              currency="KRW"
              value={krwValue}
              profitRate={profitRate}
              profitAmount={krwProfitAmount}
              isPositive={isPositive}
              isPrimary={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// 일반 자산 아이템 (현금, 부동산, 대출 등)
const AssetItem: React.FC<AssetItemProps> = ({ asset, exchangeRate, onEdit, onDelete }) => {
  const profitRate = calculateProfitRate(asset);
  const isLoan = asset.category === AssetCategory.LOAN;
  const monthlyPayment = isLoan ? calculateMonthlyLoanPayment(asset) : 0;
  const dsrExcluded = asset.metadata.is_dsr_excluded ?? false;
  const value = calculateAssetValue(asset);
  const isUsd = isUsdAsset(asset);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all group">
      <AssetHeader
        category={asset.category}
        owner={asset.owner as AssetOwner}
        onEdit={() => onEdit(asset)}
        onDelete={() => onDelete(asset.id)}
      />

      {/* Main Content */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
        {/* 왼쪽: 자산 정보 */}
        <div className="flex-1">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold tracking-tight text-slate-900">{asset.name}</span>
            </div>
            <AssetDetails asset={asset} isLoan={isLoan} />
          </div>
        </div>

        {/* 오른쪽: 금액 표시 */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="text-right">
            <p className="text-[11px] font-medium font-bold text-slate-400 mb-1 tracking-wider uppercase">
              {isUsd ? 'USD' : 'KRW'}
            </p>
            <p className={cn(
              'text-[18px] font-bold leading-none',
              isLoan ? 'text-destructive' : 'text-slate-900'
            )}>
              {isUsd ? (
                <>
                  {formatCurrency(value, 'USD').replace('$', '$ ')}
                </>
              ) : (
                formatCurrency(value, 'KRW').replace('₩', '₩ ')
              )}
            </p>
            {isUsd && (
              <p className="text-xs mt-2 font-medium text-slate-500">
                {formatCurrency(value * exchangeRate, 'KRW').replace('₩', '₩ ')}
              </p>
            )}
            {isLoan && (
              <p className="text-xs font-bold text-destructive/80 mt-2">
                월 납입: {formatCurrency(monthlyPayment, 'KRW')}
              </p>
            )}
            {profitRate !== 0 && (
              <p className={cn(
                'text-xs mt-2 font-bold',
                profitRate > 0 ? 'text-rose-500' : 'text-blue-500'
              )}>
                {profitRate > 0 ? '▲' : '▼'} {Math.abs(profitRate).toFixed(2)}%
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CategoryCardProps {
  category: AssetCategory;
  assets: Asset[];
  exchangeRate: number;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  assets,
  exchangeRate,
  onEdit,
  onDelete,
}) => {
  const isInvestmentCategory = category === AssetCategory.STOCK || category === AssetCategory.PENSION;

  // 모든 카테고리를 개별 카드 형태로 표시
  return (
    <div className="space-y-4">
      {assets.map((asset) => {
        if (isInvestmentCategory) {
          return (
            <InvestmentAssetItem
              key={asset.id}
              asset={asset}
              exchangeRate={exchangeRate}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        }
        return (
          <AssetItem
            key={asset.id}
            asset={asset}
            exchangeRate={exchangeRate}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <Card className="rounded-3xl border-2 border-dashed p-20">
    <CardContent className="text-center flex flex-col items-center p-0">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Plus className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-black tracking-tight">
        자산 정보를 입력하고 관리를 시작하세요.
      </p>
    </CardContent>
  </Card>
);

// ============================================
// 🎯 메인 컴포넌트
// ============================================

const AssetList: React.FC<Props> = ({
  assets,
  onEdit,
  onDelete,
  exchangeRate = EXCHANGE_RATE.INITIAL_USD_KRW,
}) => {
  const groupedAssets = useMemo(() => groupAssetsByCategory(assets), [assets]);

  if (assets.length === 0) {
    return (
      <div className="space-y-8">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedAssets).map(([categoryKey, categoryAssets]) => (
        <CategoryCard
          key={categoryKey}
          category={categoryKey as AssetCategory}
          assets={categoryAssets}
          exchangeRate={exchangeRate}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default AssetList;
