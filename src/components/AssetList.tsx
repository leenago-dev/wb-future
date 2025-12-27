'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Asset, AssetCategory } from '@/types';
import { EXCHANGE_RATE } from '@/config/app';
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

const AssetList: React.FC<Props> = ({ assets, onEdit, onDelete, exchangeRate = EXCHANGE_RATE.INITIAL_USD_KRW }) => {
  const formatCurrency = (val: number, currency: 'KRW' | 'USD' = 'KRW') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
  };

  const calculateValue = (asset: Asset) => {
    if (asset.category === AssetCategory.STOCK || asset.category === AssetCategory.PENSION || asset.category === AssetCategory.VIRTUAL_ASSET) {
      return (asset.current_price || asset.metadata.avg_price || 0) * asset.amount;
    }
    return asset.amount;
  };

  const getProfit = (asset: Asset) => {
    if (asset.category === AssetCategory.STOCK || asset.category === AssetCategory.PENSION || asset.category === AssetCategory.VIRTUAL_ASSET) {
      const current = asset.current_price || 0;
      const avg = asset.metadata.avg_price || 0;
      if (avg === 0) return 0;
      return ((current - avg) / avg) * 100;
    }
    return 0;
  };

  const calculateMonthlyPayment = (asset: Asset) => {
    if (asset.category !== AssetCategory.LOAN || !asset.metadata.interest_rate) return 0;

    const principal = asset.amount;
    const annualRate = asset.metadata.interest_rate;
    const monthlyRate = annualRate / 12 / 100;
    const months = asset.metadata.loan_period || 12;

    if (asset.metadata.repayment_type === '만기일시상환') {
      return principal * monthlyRate;
    } else {
      return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    }
  };

  const getCategoryIcon = (cat: AssetCategory) => {
    switch (cat) {
      case AssetCategory.CASH: return '💰';
      case AssetCategory.REAL_ESTATE: return '🏠';
      case AssetCategory.PENSION: return '👴';
      case AssetCategory.STOCK: return '📈';
      case AssetCategory.VIRTUAL_ASSET: return '🔗';
      case AssetCategory.LOAN: return '💸';
      default: return '💼';
    }
  };

  const groupedAssets = assets.reduce((acc, asset) => {
    const categoryKey = asset.category as string;
    if (!acc[categoryKey]) acc[categoryKey] = [];
    acc[categoryKey].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  return (
    <div className="space-y-8">
      {(Object.entries(groupedAssets) as [string, Asset[]][]).map(([cat, items]) => (
        <Card key={cat} className="rounded-3xl overflow-hidden">
          <CardHeader className="px-6 py-4 bg-muted/50 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-3">
                <span className="text-xl">{getCategoryIcon(cat as AssetCategory)}</span>
                <span className="tracking-tight uppercase text-xs">
                  {cat === 'VIRTUAL_ASSET' ? '가상자산' :
                    cat === 'REAL_ESTATE' ? '부동산' :
                      cat === 'PENSION' ? '퇴직연금' :
                        cat === 'STOCK' ? '주식/ETF' :
                          cat === 'LOAN' ? '대출 및 부채' : '현금성 자산'}
                </span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px] uppercase">{items.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {items.map(asset => {
              const profit = getProfit(asset);
              const isLoan = asset.category === AssetCategory.LOAN;
              const monthlyPay = isLoan ? calculateMonthlyPayment(asset) : 0;
              const dsrExcluded = asset.metadata.is_dsr_excluded;

              return (
                <div key={asset.id} className="p-5 hover:bg-muted/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between group gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-black text-foreground">{asset.name}</p>
                      <Badge variant="secondary" className="text-[10px] uppercase">{asset.owner}</Badge>
                      {asset.metadata.country && (
                        <Badge variant="outline" className="text-[10px]">📍 {asset.metadata.country}</Badge>
                      )}
                      {isLoan && (
                        <Badge variant={dsrExcluded ? 'secondary' : 'destructive'} className="text-[9px] uppercase">
                          {dsrExcluded ? 'DSR 제외' : 'DSR 포함'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-bold">
                      {asset.metadata.ticker && <Badge variant="outline" className="px-2 py-0.5 font-mono uppercase tracking-tighter">{asset.metadata.ticker}</Badge>}
                      {asset.category === AssetCategory.REAL_ESTATE && <span className="truncate max-w-[200px]">{asset.metadata.address}</span>}
                      {isLoan && (
                        <div className="flex items-center gap-2 text-destructive/70">
                          <Badge variant="outline" className="bg-destructive/10 border-destructive/20 text-destructive px-2 py-0.5">{asset.metadata.loan_type}</Badge>
                          <Badge variant="outline" className="bg-destructive/10 border-destructive/20 text-destructive px-2 py-0.5">{asset.metadata.interest_rate}% ({asset.metadata.repayment_type})</Badge>
                        </div>
                      )}
                      {!isLoan && <span>{asset.category === AssetCategory.CASH ? '자산 총액' : `${asset.amount.toLocaleString()} Units`}</span>}
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex flex-row sm:flex-col justify-between items-end sm:justify-center gap-2">
                    <div>
                      {(() => {
                        const value = calculateValue(asset);
                        const isUsdAsset = asset.currency === 'USD' || asset.metadata.country === '미국';
                        const usdValue = isUsdAsset ? value : undefined;
                        const krwValue = isUsdAsset ? value * exchangeRate : value;

                        return (
                          <p className={cn('font-black text-lg leading-tight tracking-tight', isLoan ? 'text-destructive' : 'text-foreground')}>
                            {isUsdAsset && usdValue !== undefined ? (
                              <>
                                {formatCurrency(usdValue, 'USD')} | {formatCurrency(krwValue, 'KRW')}
                              </>
                            ) : (
                              formatCurrency(krwValue, 'KRW')
                            )}
                          </p>
                        );
                      })()}
                      {isLoan && (
                        <p className="text-[11px] font-black text-destructive/80 mt-1">
                          월 예상 납입: {formatCurrency(monthlyPay)}
                        </p>
                      )}
                      {profit !== 0 && (() => {
                        const currentValue = calculateValue(asset);
                        const principal = (asset.metadata.avg_price || 0) * asset.amount;
                        const profitAmount = currentValue - principal;
                        const isUsdAsset = asset.currency === 'USD' || asset.metadata.country === '미국';
                        const usdProfitAmount = isUsdAsset ? profitAmount : undefined;
                        const krwProfitAmount = isUsdAsset ? profitAmount * exchangeRate : profitAmount;

                        return (
                          <p className={cn('text-[11px] font-black mt-1', profit > 0 ? 'text-destructive' : 'text-primary')}>
                            {profit > 0 ? '▲' : '▼'} {Math.abs(profit).toFixed(2)}%
                            {isUsdAsset && usdProfitAmount !== undefined ? (
                              <> ({formatCurrency(usdProfitAmount, 'USD')} | {formatCurrency(krwProfitAmount, 'KRW')})</>
                            ) : (
                              <> ({formatCurrency(krwProfitAmount, 'KRW')})</>
                            )}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="flex gap-3 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => onEdit(asset)} variant="ghost" size="sm" className="uppercase tracking-widest h-auto py-1 px-2">Edit</Button>
                      <Button onClick={() => onDelete(asset.id)} variant="ghost" size="sm" className="uppercase tracking-widest h-auto py-1 px-2 text-destructive hover:text-destructive">Del</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
      {assets.length === 0 && (
        <Card className="rounded-3xl border-2 border-dashed p-20">
          <CardContent className="text-center flex flex-col items-center p-0">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-black tracking-tight">자산 정보를 입력하고 관리를 시작하세요.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssetList;
