'use client';

import React, { useState, useEffect } from 'react';
import { Asset, AssetCategory } from '@/types';
import { getUserProfile, saveUserProfile } from '@/services/profileStorage';

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
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8 overflow-hidden relative">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 group relative">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <span className="p-2 bg-blue-50 rounded-xl text-blue-600">📊</span>
              DSR 계산기
            </h3>

            <div className="relative group cursor-help">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors">i</div>
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white border border-gray-200 shadow-2xl rounded-2xl p-5 z-[60] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <p className="text-xs font-black text-blue-600 mb-2 uppercase tracking-tighter">DSR 산정 공식</p>
                <p className="text-[11px] font-bold text-gray-800 bg-gray-50 p-2 rounded-lg mb-4">
                  DSR = (모든 대출의 연간 원리금 상환액) ÷ (연 소득) × 100
                </p>
                <p className="text-xs font-black text-gray-900 mb-1">상환 방식별 산정 (금융권 기준)</p>
                <ul className="text-[10px] text-gray-500 font-bold space-y-1 mb-4">
                  <li>• <span className="text-gray-800">만기일시:</span> (원금 / 대출기간) + 연간 이자</li>
                  <li>• <span className="text-gray-800">원리금균등:</span> 연간 총 원리금 상환액</li>
                </ul>
                <p className="text-xs font-black text-red-500 mb-1">주요 제외 대상 (DSR 미반영)</p>
                <div className="grid grid-cols-1 gap-1 text-[9px] text-gray-400 font-bold overflow-y-auto max-h-32 custom-scrollbar">
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
                <div className="absolute -top-1.5 left-2 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45"></div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Debt Service Ratio Analysis</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
          <div className="px-3 py-1">
            <span className="text-[10px] font-black text-gray-400 block uppercase">나의 연 소득</span>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-32 p-1 text-sm font-black border-b-2 border-blue-500 bg-transparent outline-none text-blue-600"
                  autoFocus
                />
                <button onClick={handleSaveIncome} className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">저장</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-black text-gray-800">{formatCurrency(income)}</span>
                <button onClick={() => setIsEditing(true)} className="text-[10px] font-black text-blue-500 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors">수정</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid 2:1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2/3) - Chart & Indicators */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-400 uppercase">현재 DSR 수치</span>
              <span className={`text-5xl sm:text-6xl font-black tracking-tighter ${isExceeded ? 'text-red-600' : 'text-blue-600'}`}>
                {dsrRatio.toFixed(2)}<span className="text-xl sm:text-2xl">%</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-gray-400 uppercase">DSR 산정 연간 상환액</span>
              <p className="text-xl font-black text-gray-800">{formatCurrency(totalAnnualRepayment)}</p>
            </div>
          </div>

          <div className="relative h-16 w-full bg-gray-100 rounded-3xl overflow-hidden border border-gray-100 shadow-inner group">
            <div className="absolute left-[40%] top-0 bottom-0 w-1 bg-red-400/40 z-20">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-black text-red-500 whitespace-nowrap uppercase tracking-tighter">BANK LIMIT (40%)</span>
            </div>
            <div
              className={`h-full transition-all duration-1000 ease-out flex items-center justify-end px-6 shadow-xl ${isExceeded ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
              style={{ width: `${Math.min(dsrRatio, 100)}%` }}
            >
              {dsrRatio > 10 && <span className="text-sm font-black text-white drop-shadow-lg">{dsrRatio.toFixed(2)}%</span>}
            </div>
          </div>

          {isExceeded && (
            <div className="flex items-start gap-4 p-5 bg-red-50 rounded-2xl border border-red-100 animate-pulse">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="text-sm font-black text-red-700">DSR 임계치 초과</p>
                <p className="text-[11px] font-bold text-red-600/80 leading-relaxed">금융권 대출 제한 기준을 넘었습니다. 신규 대출 및 증액이 어려울 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1/3) - Summary Blocks */}
        <div className="space-y-3">
          <button
            onClick={() => toggleDetailView('included')}
            className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98] ${detailView === 'included' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-800 hover:bg-gray-100'}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[10px] font-black uppercase ${detailView === 'included' ? 'text-blue-100' : 'text-gray-400'}`}>산정 대상 대출</span>
              <span className={`text-[10px] font-black ${detailView === 'included' ? 'text-white' : 'text-blue-600'}`}>{detailView === 'included' ? '숨기기' : '상세보기'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black">{includedLoans.length}</span>
              <span className="text-[10px] font-bold opacity-70">건</span>
            </div>
          </button>

          <button
            onClick={() => toggleDetailView('excluded')}
            className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98] ${detailView === 'excluded' ? 'bg-slate-700 border-slate-700 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-800 hover:bg-gray-100'}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[10px] font-black uppercase ${detailView === 'excluded' ? 'text-slate-300' : 'text-gray-400'}`}>DSR 제외 항목</span>
              <span className={`text-[10px] font-black ${detailView === 'excluded' ? 'text-white' : 'text-slate-500'}`}>{detailView === 'excluded' ? '숨기기' : '상세보기'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black">{excludedLoans.length}</span>
              <span className="text-[10px] font-bold opacity-70">건</span>
            </div>
          </button>

          <div className={`p-4 rounded-2xl border ${isExceeded ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
            <span className="text-[10px] font-black uppercase opacity-60 mb-1 block">추가 대출 가용액</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black">{isExceeded ? '0' : formatCurrency(Math.max(0, income * 0.4 - totalAnnualRepayment)).replace('₩', '')}</span>
              <span className="text-[10px] font-bold opacity-70">원</span>
            </div>
            {!isExceeded && <p className="text-[9px] mt-1 font-bold opacity-60">* 40% 기준 시뮬레이션</p>}
          </div>
        </div>
      </div>

      {/* Detailed Loan List Section (Animated Transition) */}
      {detailView && (
        <div className="mt-8 pt-8 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
              <span className={`w-2 h-2 rounded-full ${detailView === 'included' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
              {detailView === 'included' ? 'DSR 산정 포함 대출 리스트' : 'DSR 적용 제외 대출 리스트'}
            </h4>
            <button onClick={() => setDetailView(null)} className="text-[10px] font-black text-gray-400 hover:text-gray-900 transition-colors uppercase">닫기 X</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(detailView === 'included' ? includedLoans : excludedLoans).map(loan => (
              <div key={loan.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between group hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black text-gray-800 truncate pr-2">{loan.name}</span>
                  <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{loan.owner}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-gray-900">{formatCurrency(loan.amount)}</span>
                  <div className="flex items-center gap-2 mt-2 opacity-60 text-[10px] font-bold">
                    <span>{loan.metadata.interest_rate}%</span>
                    <span>•</span>
                    <span>{loan.metadata.repayment_type}</span>
                  </div>
                  {detailView === 'included' && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <span className="text-[9px] font-black text-gray-400 uppercase">DSR 산정 연간 상환액</span>
                      <p className="text-xs font-black text-blue-600">{formatCurrency(calculateAnnualRepaymentForDsr(loan))}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(detailView === 'included' ? includedLoans : excludedLoans).length === 0 && (
              <div className="col-span-full py-12 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                <p className="text-xs font-black text-gray-400">해당하는 대출 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DsrCalculator;
