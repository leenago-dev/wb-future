'use client';

import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { Asset, AssetCategory } from '@/types';
import { getUserProfile, saveUserProfile } from '@/services/profileStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  assets: Asset[];
}

type DetailViewType = 'included' | 'excluded' | null;

const DsrCalculator: React.FC<Props> = ({ assets }) => {
  const [income, setIncome] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [detailView, setDetailView] = useState<DetailViewType>(null);

  useEffect(() => {
    const profile = getUserProfile();
    setIncome(profile.annual_income);
  }, []);

  const handleSaveIncome = () => {
    saveUserProfile({ annual_income: income });
    setIsEditing(false);
  };

  /**
   * DSR용 연간 원리금 상환액 계산 (네이버/금융권 표준 방식)
   */
  const calculateAnnualRepaymentForDsr = (asset: Asset) => {
    if (asset.category !== AssetCategory.LOAN || asset.metadata.is_dsr_excluded) return 0;

    const principal = asset.amount;
    const annualRate = (asset.metadata.interest_rate || 0) / 100;
    const months = asset.metadata.loan_period || 12;
    const years = months / 12;

    if (asset.metadata.repayment_type === '만기일시상환') {
      const annualPrincipal = principal / years;
      const annualInterest = principal * annualRate;
      return annualPrincipal + annualInterest;
    } else {
      const monthlyRate = annualRate / 12;
      if (monthlyRate === 0) return principal / years;
      const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
      return monthlyPayment * 12;
    }
  };

  const includedLoans = assets.filter(a => a.category === AssetCategory.LOAN && !a.metadata.is_dsr_excluded);
  const excludedLoans = assets.filter(a => a.category === AssetCategory.LOAN && a.metadata.is_dsr_excluded);

  const totalAnnualRepayment = includedLoans.reduce((sum, a) => sum + calculateAnnualRepaymentForDsr(a), 0);

  const dsrRatio = income > 0 ? (totalAnnualRepayment / income) * 100 : 0;
  const isExceeded = dsrRatio > 40;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
  };

  const toggleDetailView = (type: DetailViewType) => {
    setDetailView(detailView === type ? null : type);
  };

  return (
    <Card className="rounded-3xl p-6 mb-8 overflow-hidden relative">
      {/* Header Section */}
      <CardHeader className="p-0 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <span className="p-2 bg-primary/10 rounded-xl text-primary">📊</span>
                DSR 계산기
              </CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:text-primary">
                    <Info className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 sm:w-80 p-5" align="start">
                  <p className="text-xs font-black text-primary mb-2 uppercase tracking-tighter">DSR 산정 공식</p>
                  <p className="text-[11px] font-bold bg-muted p-2 rounded-lg mb-4">
                    DSR = (모든 대출의 연간 원리금 상환액) ÷ (연 소득) × 100
                  </p>
                  <p className="text-xs font-black mb-1">상환 방식별 산정 (금융권 기준)</p>
                  <ul className="text-[10px] text-muted-foreground font-bold space-y-1 mb-4">
                    <li>• <span className="text-foreground">만기일시:</span> (원금 / 대출기간) + 연간 이자</li>
                    <li>• <span className="text-foreground">원리금균등:</span> 연간 총 원리금 상환액</li>
                  </ul>
                  <p className="text-xs font-black text-destructive mb-1">주요 제외 대상 (DSR 미반영)</p>
                  <div className="grid grid-cols-1 gap-1 text-[9px] text-muted-foreground font-bold overflow-y-auto max-h-32">
                    <span>1. 전세자금대출</span>
                    <span>2. 보금자리론/특례보금자리론</span>
                    <span>3. 신생아 특례 구입·전세자금</span>
                    <span>4. 분양주택 중도금대출</span>
                    <span>5. 이주비 대출 / 추가분담금 중도금</span>
                    <span>6. 서민금융상품 (새희망홀씨 등)</span>
                    <span>7. 300만원 이하 소액 신용대출</span>
                    <span>8. 보험계약대출 / 예적금 담보대출</span>
                    <span>9. 할부·리스 및 현금서비스 등</span>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-wider">Debt Service Ratio Analysis</p>
          </div>

          <Card className="bg-muted p-2">
            <CardContent className="px-3 py-1 p-0">
              <span className="text-[10px] font-black text-muted-foreground block uppercase">나의 연 소득</span>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    className="w-32 p-1 text-sm font-black border-b-2 border-primary bg-transparent h-auto rounded-none"
                    autoFocus
                  />
                  <Button onClick={handleSaveIncome} size="sm" variant="ghost" className="text-[10px] font-black h-auto py-1 px-2">저장</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-black">{formatCurrency(income)}</span>
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="ghost" className="text-[10px] font-black h-auto py-1 px-2">수정</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardHeader>

      {/* Main Content Grid 2:1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2/3) - Chart & Indicators */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-xs font-black text-muted-foreground uppercase">현재 DSR 수치</span>
              <span className={cn('text-5xl sm:text-6xl font-black tracking-tighter', isExceeded ? 'text-destructive' : 'text-primary')}>
                {dsrRatio.toFixed(2)}<span className="text-xl sm:text-2xl">%</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-muted-foreground uppercase">DSR 산정 연간 상환액</span>
              <p className="text-xl font-black text-foreground">{formatCurrency(totalAnnualRepayment)}</p>
            </div>
          </div>

          <div className="relative h-16 w-full bg-muted rounded-3xl overflow-hidden border shadow-inner group">
            <div className="absolute left-[40%] top-0 bottom-0 w-1 bg-destructive/40 z-20">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-destructive rounded-full shadow-sm"></div>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-black text-destructive whitespace-nowrap uppercase tracking-tighter">BANK LIMIT (40%)</span>
            </div>
            <div
              className={cn('h-full transition-all duration-1000 ease-out flex items-center justify-end px-6 shadow-xl', isExceeded ? 'bg-gradient-to-r from-destructive to-destructive/80' : 'bg-gradient-to-r from-primary to-primary/80')}
              style={{ width: `${Math.min(dsrRatio, 100)}%` }}
            >
              {dsrRatio > 10 && <span className="text-sm font-black text-primary-foreground drop-shadow-lg">{dsrRatio.toFixed(2)}%</span>}
            </div>
          </div>

          {isExceeded && (
            <Card className="bg-destructive/10 border-destructive/20 p-5 rounded-2xl animate-pulse">
              <CardContent className="flex items-start gap-4 p-0">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="text-sm font-black text-destructive">DSR 임계치 초과</p>
                  <p className="text-[11px] font-bold text-destructive/80 leading-relaxed">금융권 대출 제한 기준을 넘었습니다. 신규 대출 및 증액이 어려울 수 있습니다.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (1/3) - Summary Blocks */}
        <div className="space-y-3">
          <Button
            onClick={() => toggleDetailView('included')}
            variant={detailView === 'included' ? 'default' : 'outline'}
            className={cn('w-full justify-start p-4 rounded-2xl h-auto', detailView === 'included' && 'shadow-lg')}
          >
            <div className="w-full text-left">
              <div className="flex justify-between items-center mb-1">
                <span className={cn('text-[10px] font-black uppercase', detailView === 'included' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>산정 대상 대출</span>
                <span className={cn('text-[10px] font-black', detailView === 'included' ? 'text-primary-foreground' : 'text-primary')}>{detailView === 'included' ? '숨기기' : '상세보기'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black">{includedLoans.length}</span>
                <span className="text-[10px] font-bold opacity-70">건</span>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => toggleDetailView('excluded')}
            variant={detailView === 'excluded' ? 'secondary' : 'outline'}
            className={cn('w-full justify-start p-4 rounded-2xl h-auto', detailView === 'excluded' && 'shadow-lg')}
          >
            <div className="w-full text-left">
              <div className="flex justify-between items-center mb-1">
                <span className={cn('text-[10px] font-black uppercase', detailView === 'excluded' ? 'text-secondary-foreground/80' : 'text-muted-foreground')}>DSR 제외 항목</span>
                <span className={cn('text-[10px] font-black', detailView === 'excluded' ? 'text-secondary-foreground' : 'text-muted-foreground')}>{detailView === 'excluded' ? '숨기기' : '상세보기'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black">{excludedLoans.length}</span>
                <span className="text-[10px] font-bold opacity-70">건</span>
              </div>
            </div>
          </Button>

          <Card className={cn('p-4 rounded-2xl', isExceeded ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-primary/10 border-primary/20 text-primary')}>
            <CardContent className="p-0">
              <span className="text-[10px] font-black uppercase opacity-60 mb-1 block">추가 대출 가용액</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black">{isExceeded ? '0' : formatCurrency(Math.max(0, income * 0.4 - totalAnnualRepayment)).replace('₩', '')}</span>
                <span className="text-[10px] font-bold opacity-70">원</span>
              </div>
              {!isExceeded && <p className="text-[9px] mt-1 font-bold opacity-60">* 40% 기준 시뮬레이션</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Loan List Section (Animated Transition) */}
      {detailView && (
        <div className="mt-8 pt-8 border-t animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
              <span className={cn('w-2 h-2 rounded-full', detailView === 'included' ? 'bg-primary' : 'bg-muted-foreground')}></span>
              {detailView === 'included' ? 'DSR 산정 포함 대출 리스트' : 'DSR 적용 제외 대출 리스트'}
            </h4>
            <Button onClick={() => setDetailView(null)} variant="ghost" size="sm" className="text-[10px] font-black uppercase h-auto py-1 px-2">
              <X className="w-3 h-3 mr-1" />
              닫기
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(detailView === 'included' ? includedLoans : excludedLoans).map(loan => (
              <Card key={loan.id} className="p-4 rounded-2xl hover:border-primary transition-colors">
                <CardContent className="p-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black truncate pr-2">{loan.name}</span>
                    <Badge variant="outline" className="text-[9px] font-black uppercase">{loan.owner}</Badge>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black">{formatCurrency(loan.amount)}</span>
                    <div className="flex items-center gap-2 mt-2 opacity-60 text-[10px] font-bold">
                      <span>{loan.metadata.interest_rate}%</span>
                      <span>•</span>
                      <span>{loan.metadata.repayment_type}</span>
                    </div>
                    {detailView === 'included' && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-[9px] font-black text-muted-foreground uppercase">DSR 산정 연간 상환액</span>
                        <p className="text-xs font-black text-primary">{formatCurrency(calculateAnnualRepaymentForDsr(loan))}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(detailView === 'included' ? includedLoans : excludedLoans).length === 0 && (
              <Card className="col-span-full py-12 border-2 border-dashed">
                <CardContent className="text-center p-0">
                  <p className="text-xs font-black text-muted-foreground">해당하는 대출 내역이 없습니다.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default DsrCalculator;
