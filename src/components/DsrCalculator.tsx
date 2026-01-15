'use client';

import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { Asset, AssetCategory, AssetOwner } from '@/types';
import { getUserProfile, saveUserProfile } from '@/services/profileStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DSR, OWNER_LABELS } from '@/config/app';

interface Props {
  assets: Asset[];
}

const DsrCalculator: React.FC<Props> = ({ assets }) => {
  const [income, setIncome] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState<boolean>(false);

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
  const isExceeded = dsrRatio > DSR.BANK_LIMIT_PERCENTAGE;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
  };

  const toggleDetailView = () => {
    setIsDetailViewOpen(!isDetailViewOpen);
  };

  return (
    <Card className="rounded-3xl p-6 mb-8 overflow-hidden relative">
      {/* Header Section */}
      <CardHeader className="p-0 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
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
                  <p className="text-xs font-black text-primary mb-2 uppercase tracking-tighter">{DSR.FORMULA_TITLE}</p>
                  <p className="text-[11px] font-bold bg-muted p-2 rounded-lg mb-4">
                    {DSR.FORMULA}
                  </p>
                  <p className="text-xs font-black mb-1">{DSR.REPAYMENT_METHOD_TITLE}</p>
                  <ul className="text-[10px] text-muted-foreground font-bold space-y-1 mb-4">
                    {DSR.REPAYMENT_METHODS.map((method) => (
                      <li key={method.type}>
                        • <span className="text-foreground">{method.type}:</span> {method.formula}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-black text-destructive mb-1">{DSR.EXCLUDED_TARGETS_TITLE}</p>
                  <div className="grid grid-cols-1 gap-1 text-[9px] text-muted-foreground font-bold overflow-y-auto max-h-32">
                    {DSR.EXCLUDED_TARGETS.map((target, index) => (
                      <span key={target}>{index + 1}. {target}</span>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-wider">Debt Service Ratio Analysis</p>
          </div>

          <Card className="bg-muted p-2 py-2 px-7">
            <CardContent className="px-5 py-3 p-0">
              <span className="text-sm text-muted-foreground block uppercase">나의 연 소득</span>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    className="w-32 p-1 text-lg border-b-2 border-primary bg-transparent h-auto rounded-none"
                    autoFocus
                  />
                  <Button onClick={handleSaveIncome} size="default" variant="ghost" className="h-auto py-1 px-2">저장</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-md font-black">{formatCurrency(income)}</span>
                  <Button onClick={() => setIsEditing(true)} size="default" variant="ghost" className="h-auto py-1 px-2">수정</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardHeader>

      {/* Main Content Grid 2:1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2/3) - Chart & Indicators & Loan Lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-md text-muted-foreground uppercase">현재 DSR 수치</span>
              <span className={cn('text-4xl font-black tracking-tighter', isExceeded ? 'text-destructive' : 'text-primary')}>
                {dsrRatio.toFixed(2)}<span className="text-lg">%</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-md text-muted-foreground uppercase">DSR 산정 연간 상환액</span>
              <p className="text-4xl font-black text-foreground">{formatCurrency(totalAnnualRepayment)}</p>
            </div>
          </div>

          <div className="relative h-10 w-full bg-muted rounded-3xl overflow-hidden border shadow-inner group">
            <div className="absolute top-0 bottom-0 w-1 bg-destructive/50 z-20" style={{ left: `${DSR.BANK_LIMIT_PERCENTAGE}%` }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-destructive rounded-full shadow-sm"></div>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-black text-destructive whitespace-nowrap uppercase tracking-tighter">BANK LIMIT ({DSR.BANK_LIMIT_PERCENTAGE}%)</span>
            </div>
            <div
              className={cn('h-full transition-all duration-1000 ease-out flex items-center justify-end px-0 shadow-xl', isExceeded ? 'bg-gradient-to-r from-destructive to-destructive/80' : 'bg-gradient-to-r from-primary to-primary/80')}
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

          {/* Detailed Loan Lists Section - 1:1 Split */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-widest">대출 상세 내역</h4>
              <Button
                onClick={toggleDetailView}
                variant={isDetailViewOpen ? 'default' : 'ghost'}
                size="sm"
                className="uppercase h-auto py-1 px-2 text-[10px]"
              >
                {isDetailViewOpen ? '숨기기' : '상세보기'}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Included Loans */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    DSR 산정 포함 대출
                  </h5>
                </div>
                {isDetailViewOpen && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    {includedLoans.length > 0 ? (
                      includedLoans.map(loan => (
                        <Card key={loan.id} className="p-4 rounded-2xl hover:border-primary transition-colors">
                          <CardContent className="p-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-black truncate pr-2">{loan.name}</span>
                              <Badge variant="outline" className="text-[9px] uppercase">{OWNER_LABELS[loan.owner as AssetOwner]}</Badge>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-lg font-black">{formatCurrency(loan.amount)}</span>
                              <div className="flex items-center gap-2 mt-2 opacity-60 text-[10px] font-bold">
                                <span>{loan.metadata.interest_rate}%</span>
                                <span>•</span>
                                <span>{loan.metadata.repayment_type}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card className="py-12 border-2 border-dashed">
                        <CardContent className="text-center p-0">
                          <p className="text-xs font-black text-muted-foreground">해당하는 대출 내역이 없습니다.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Excluded Loans */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                    DSR 적용 제외 대출
                  </h5>
                </div>
                {isDetailViewOpen && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    {excludedLoans.length > 0 ? (
                      excludedLoans.map(loan => (
                        <Card key={loan.id} className="p-4 rounded-2xl hover:border-primary transition-colors">
                          <CardContent className="p-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-black truncate pr-2">{loan.name}</span>
                              <Badge variant="outline" className="text-[9px] uppercase">{OWNER_LABELS[loan.owner as AssetOwner]}</Badge>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-lg font-black">{formatCurrency(loan.amount)}</span>
                              <div className="flex items-center gap-2 mt-2 opacity-60 text-[10px] font-bold">
                                <span>{loan.metadata.interest_rate}%</span>
                                <span>•</span>
                                <span>{loan.metadata.repayment_type}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card className="py-12 border-2 border-dashed">
                        <CardContent className="text-center p-0">
                          <p className="text-xs font-black text-muted-foreground">해당하는 대출 내역이 없습니다.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) - Summary Block */}
        <div className="space-y-3">
          <Card className={cn('p-4 rounded-2xl', isExceeded ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-primary/10 border-primary/20 text-primary')}>
            <CardContent className="p-0">
              <span className="text-[10px] font-black uppercase opacity-60 mb-1 block">추가 대출 가용액</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black">{isExceeded ? '0' : formatCurrency(Math.max(0, income * (DSR.BANK_LIMIT_PERCENTAGE / 100) - totalAnnualRepayment)).replace('₩', '')}</span>
                <span className="text-[10px] font-bold opacity-70">원</span>
              </div>
              {!isExceeded && <p className="text-[9px] mt-1 font-bold opacity-60">* {DSR.BANK_LIMIT_PERCENTAGE}% 기준 시뮬레이션</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </Card>
  );
};

export default DsrCalculator;
