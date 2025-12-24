'use client';

import React, { useState } from 'react';
import { AssetCategory, Asset, AssetOwner, LoanType, RepaymentType } from '@/types';

interface Props {
  onSave: (asset: Omit<Asset, 'id' | 'updated_at' | 'user_id' | 'created_at'>) => void;
  onClose: () => void;
  initialData?: Asset;
}

const COUNTRIES = ['한국', '미국', '중국', '일본', '기타'];

const AssetForm: React.FC<Props> = ({ onSave, onClose, initialData }) => {
  const [category, setCategory] = useState<AssetCategory>(initialData?.category || AssetCategory.CASH);
  const [owner, setOwner] = useState<AssetOwner>(initialData?.owner || 'Leena');
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount || 0);

  const [ticker, setTicker] = useState(initialData?.metadata.ticker || '');
  const [avgPrice, setAvgPrice] = useState(initialData?.metadata.avg_price || 0);
  const [country, setCountry] = useState(initialData?.metadata.country || '한국');
  const [address, setAddress] = useState(initialData?.metadata.address || '');
  const [purchasePrice, setPurchasePrice] = useState(initialData?.metadata.purchase_price || 0);

  const [loanType, setLoanType] = useState<LoanType>(initialData?.metadata.loan_type || '신용대출');
  const [interestRate, setInterestRate] = useState<number>(initialData?.metadata.interest_rate || 0);
  const [repaymentType, setRepaymentType] = useState<RepaymentType>(initialData?.metadata.repayment_type || '만기일시상환');
  const [loanPeriod, setLoanPeriod] = useState<number>(initialData?.metadata.loan_period || 12);
  const [isDsrExcluded, setIsDsrExcluded] = useState<boolean>(initialData?.metadata.is_dsr_excluded || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      category,
      owner,
      name,
      amount,
      metadata: {
        ticker: (category === AssetCategory.PENSION || category === AssetCategory.STOCK || category === AssetCategory.VIRTUAL_ASSET) ? ticker : undefined,
        avg_price: (category === AssetCategory.PENSION || category === AssetCategory.STOCK || category === AssetCategory.VIRTUAL_ASSET) ? avgPrice : undefined,
        country: (category === AssetCategory.PENSION || category === AssetCategory.STOCK) ? country : undefined,
        address: category === AssetCategory.REAL_ESTATE ? address : undefined,
        purchase_price: category === AssetCategory.REAL_ESTATE ? purchasePrice : undefined,
        loan_type: category === AssetCategory.LOAN ? loanType : undefined,
        interest_rate: category === AssetCategory.LOAN ? interestRate : undefined,
        repayment_type: category === AssetCategory.LOAN ? repaymentType : undefined,
        loan_period: category === AssetCategory.LOAN ? loanPeriod : undefined,
        is_dsr_excluded: category === AssetCategory.LOAN ? isDsrExcluded : undefined,
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-900">{initialData ? '수정하기' : '항목 추가'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">소유자</label>
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              {['Leena', 'Husband', 'Common'].map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOwner(o as AssetOwner)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${owner === o ? 'bg-white shadow-sm text-blue-600 scale-100' : 'text-gray-400 hover:text-gray-600'}`}
                >{o === 'Common' ? '공통' : o}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AssetCategory)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
            >
              <option value={AssetCategory.CASH}>현금성 자산</option>
              <option value={AssetCategory.PENSION}>퇴직연금</option>
              <option value={AssetCategory.STOCK}>주식/ETF</option>
              <option value={AssetCategory.VIRTUAL_ASSET}>가상자산</option>
              <option value={AssetCategory.REAL_ESTATE}>부동산</option>
              <option value={AssetCategory.LOAN}>대출 및 부채</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">이름</label>
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 미래에셋 퇴직연금, 삼성전자 등" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
          </div>

          {(category === AssetCategory.PENSION || category === AssetCategory.STOCK || category === AssetCategory.VIRTUAL_ASSET) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-1">티커 (Ticker)</label>
                  <input required type="text" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="BTC" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-1">수량</label>
                  <input required type="number" step="any" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 mb-1">평단가</label>
                <input required type="number" step="any" value={avgPrice} onChange={(e) => setAvgPrice(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold" />
              </div>
              {(category === AssetCategory.PENSION || category === AssetCategory.STOCK) && (
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-1">국가</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm"
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          {category === AssetCategory.REAL_ESTATE && (
            <>
              <div>
                <label className="block text-xs font-black text-gray-400 mb-1">주소</label>
                <input required type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="서울시..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-black text-gray-400 mb-1">매입가</label><input required type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold" /></div>
                <div><label className="block text-xs font-black text-gray-400 mb-1">평가액</label><input required type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold" /></div>
              </div>
            </>
          )}

          {category === AssetCategory.LOAN && (
            <div className="space-y-4 p-5 bg-red-50/50 rounded-3xl border border-red-100">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-red-400 mb-1 uppercase">대출 종류</label><select value={loanType} onChange={(e) => setLoanType(e.target.value as LoanType)} className="w-full p-2 bg-white border border-red-100 rounded-xl text-xs font-bold"><option value="신용대출">신용대출</option><option value="주택담보대출">주택담보대출</option><option value="마이너스통장">마이너스통장</option></select></div>
                <div><label className="block text-[10px] font-black text-red-400 mb-1 uppercase">이율 (%)</label><input required type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="w-full p-2 bg-white border border-red-100 rounded-xl text-xs font-bold" /></div>
              </div>
              <div><label className="block text-[10px] font-black text-red-400 mb-1 uppercase">상환 방식</label><select value={repaymentType} onChange={(e) => setRepaymentType(e.target.value as RepaymentType)} className="w-full p-2 bg-white border border-red-100 rounded-xl text-xs font-bold"><option value="만기일시상환">만기일시상환</option><option value="원리금균등분할상환">원리금균등분할상환</option></select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-red-400 mb-1 uppercase">기간 (개월)</label><input required type="number" value={loanPeriod} onChange={(e) => setLoanPeriod(Number(e.target.value))} className="w-full p-2 bg-white border border-red-100 rounded-xl text-xs font-bold" /></div>
                <div><label className="block text-[10px] font-black text-red-400 mb-1 uppercase">대출 원금</label><input required type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full p-2 bg-white border border-red-100 rounded-xl text-xs font-bold" /></div>
              </div>
              <div className="pt-2 border-t border-red-100 mt-2">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col"><span className="text-[11px] font-black text-red-500 uppercase">DSR 적용 제외 여부</span><span className="text-[9px] text-red-300 font-bold leading-tight">전세자금대출 등 제외 시 체크</span></div>
                  <input type="checkbox" checked={isDsrExcluded} onChange={(e) => setIsDsrExcluded(e.target.checked)} className="w-5 h-5 rounded-md border-red-200 text-red-500" />
                </label>
              </div>
            </div>
          )}

          {category === AssetCategory.CASH && (
            <div><label className="block text-xs font-black text-gray-400 mb-1">금액</label><input required type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold" /></div>
          )}

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-colors">취소</button>
            <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-colors">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;
