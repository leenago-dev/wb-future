'use client';

import React from 'react';
import { Asset, AssetCategory } from '@/types';

interface Props {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

const AssetList: React.FC<Props> = ({ assets, onEdit, onDelete }) => {
  const formatCurrency = (val: number) => {
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
    switch(cat) {
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
        <div key={cat} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-black text-gray-700 flex items-center gap-3">
              <span className="text-xl">{getCategoryIcon(cat as AssetCategory)}</span>
              <span className="tracking-tight uppercase text-xs">
                {cat === 'VIRTUAL_ASSET' ? '가상자산' :
                 cat === 'REAL_ESTATE' ? '부동산' :
                 cat === 'PENSION' ? '퇴직연금' :
                 cat === 'STOCK' ? '주식/ETF' :
                 cat === 'LOAN' ? '대출 및 부채' : '현금성 자산'}
              </span>
            </h3>
            <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-gray-400 border border-gray-100 uppercase">{items.length} items</span>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map(asset => {
              const profit = getProfit(asset);
              const isLoan = asset.category === AssetCategory.LOAN;
              const monthlyPay = isLoan ? calculateMonthlyPayment(asset) : 0;
              const dsrExcluded = asset.metadata.is_dsr_excluded;

              return (
                <div key={asset.id} className="p-5 hover:bg-gray-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between group gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-gray-900">{asset.name}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase font-black">{asset.owner}</span>
                      {asset.metadata.country && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-black">📍 {asset.metadata.country}</span>
                      )}
                      {isLoan && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${dsrExcluded ? 'bg-gray-100 text-gray-400' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                          {dsrExcluded ? 'DSR 제외' : 'DSR 포함'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-bold">
                      {asset.metadata.ticker && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-mono uppercase tracking-tighter">{asset.metadata.ticker}</span>}
                      {asset.category === AssetCategory.REAL_ESTATE && <span className="truncate max-w-[200px]">{asset.metadata.address}</span>}
                      {isLoan && (
                        <div className="flex items-center gap-2 text-red-400/70">
                          <span className="bg-red-50/50 px-2 py-0.5 rounded-md">{asset.metadata.loan_type}</span>
                          <span className="bg-red-50/50 px-2 py-0.5 rounded-md">{asset.metadata.interest_rate}% ({asset.metadata.repayment_type})</span>
                        </div>
                      )}
                      {!isLoan && <span>{asset.category === AssetCategory.CASH ? '자산 총액' : `${asset.amount.toLocaleString()} Units`}</span>}
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex flex-row sm:flex-col justify-between items-end sm:justify-center gap-2">
                    <div>
                      <p className={`font-black ${isLoan ? 'text-red-600' : 'text-gray-900'} text-lg leading-tight tracking-tight`}>
                        {formatCurrency(calculateValue(asset))}
                      </p>
                      {isLoan && (
                        <p className="text-[11px] font-black text-red-400/80 mt-1">
                          월 예상 납입: {formatCurrency(monthlyPay)}
                        </p>
                      )}
                      {profit !== 0 && (
                        <p className={`text-[11px] font-black mt-1 ${profit > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {profit > 0 ? '▲' : '▼'} {Math.abs(profit).toFixed(2)}%
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(asset)} className="text-blue-500 hover:text-blue-700 text-[10px] font-black uppercase tracking-widest">Edit</button>
                      <button onClick={() => onDelete(asset.id)} className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-widest">Del</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {assets.length === 0 && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
             <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </div>
          <p className="text-gray-400 font-black tracking-tight">자산 정보를 입력하고 관리를 시작하세요.</p>
        </div>
      )}
    </div>
  );
};

export default AssetList;
