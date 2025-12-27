'use client';

import { useState } from 'react';
import { Asset, AssetOwner } from '@/types';
import { ViewType, useAssets } from '@/hooks/useAssets';
import { useAiAdvice } from '@/hooks/useAiAdvice';
import { useSidebar } from '@/components/SidebarContext';
import AssetForm from '@/components/AssetForm';
import AssetList from '@/components/AssetList';
import Charts from '@/components/Charts';
import HistoryChart from '@/components/HistoryChart';
import ProfitHistoryChart from '@/components/ProfitHistoryChart';
import AssetLiabilityBarChart from '@/components/AssetLiabilityBarChart';
import DsrCalculator from '@/components/DsrCalculator';
import StockCard from '@/components/StockCard';
import { OWNER_LABELS, OWNER_FILTER_OPTIONS } from '@/config/app';

interface DashboardContentProps {
  currentView: ViewType;
  title: string;
}

export default function DashboardContent({ currentView, title }: DashboardContentProps) {
  const [selectedOwner, setSelectedOwner] = useState<'Total' | AssetOwner>('Total');
  const [viewMode, setViewMode] = useState<'Assets' | 'History'>('Assets');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  const { setIsMobileOpen } = useSidebar();

  const { filteredAssets, stats, historyData, isLoadingPrices, exchangeRate, handleSave, handleDelete } = useAssets(selectedOwner, currentView);
  const { aiAdvice, isAiThinking, getAiAdvice } = useAiAdvice();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {isLoadingPrices && <span className="hidden md:inline text-[10px] text-blue-500 animate-pulse font-black tracking-tighter uppercase">Live Markets</span>}
            <button
              onClick={() => { setEditingAsset(undefined); setIsFormOpen(true); }}
              className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              + 항목 추가
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <div className="flex bg-white p-1 rounded-2xl border shadow-sm w-max sm:w-fit">
            {OWNER_FILTER_OPTIONS.map((owner) => (
              <button
                key={owner}
                onClick={() => setSelectedOwner(owner as 'Total' | AssetOwner)}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${selectedOwner === owner ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {OWNER_LABELS[owner]}
              </button>
            ))}
          </div>
        </div>

        {currentView === 'real-estate' && (
          <DsrCalculator assets={filteredAssets} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border shadow-sm flex flex-col justify-between hover:border-blue-100 transition-colors group">
            <span className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">Total Assets</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 mt-2">{formatCurrency(stats.totalAssets)}</span>
          </div>

          {currentView === 'pension' ? (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border shadow-sm flex flex-col justify-between hover:border-emerald-100 transition-colors group">
              <div className="flex justify-between items-start">
                <span className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">Performance</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stats.totalProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {stats.totalRoi >= 0 ? '+' : ''}{stats.totalRoi.toFixed(2)}%
                </span>
              </div>
              <span className={`text-xl sm:text-2xl font-black mt-2 ${stats.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(stats.totalProfit)}
              </span>
            </div>
          ) : (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border shadow-sm flex flex-col justify-between hover:border-red-100 transition-colors group">
              <span className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">Liabilities</span>
              <span className="text-xl sm:text-2xl font-black text-red-600 mt-2">{formatCurrency(stats.totalLiabilities)}</span>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col justify-between text-white transform transition-transform hover:scale-[1.01] sm:col-span-2 lg:col-span-1">
            <span className="text-xs sm:text-sm text-blue-100 font-bold uppercase tracking-wider">Net Worth</span>
            <span className="text-xl sm:text-2xl font-black mt-2">{formatCurrency(stats.netWorth)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-gray-100 overflow-x-auto">
          <button onClick={() => setViewMode('Assets')} className={`pb-3 px-1 text-sm font-black transition-all relative ${viewMode === 'Assets' ? 'text-blue-600' : 'text-gray-400'}`}>
            자산 목록 {viewMode === 'Assets' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full" />}
          </button>
          <button onClick={() => setViewMode('History')} className={`pb-3 px-1 text-sm font-black transition-all relative ${viewMode === 'History' ? 'text-blue-600' : 'text-gray-400'}`}>
            변동 추이 {viewMode === 'History' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full" />}
          </button>
        </div>

        {viewMode === 'Assets' ? (
          <div className="space-y-6">
            {currentView === 'pension' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <h2 className="text-base font-black text-gray-800 mb-6 flex items-center gap-2">🌍 국가별 투자 비중</h2>
                    <Charts assets={filteredAssets} groupBy="country" />
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <h2 className="text-base font-black text-gray-800 mb-6 flex items-center gap-2">📦 종목별 투자 비중</h2>
                    <Charts assets={filteredAssets} groupBy="name" />
                  </div>
                </div>
                <StockCard />
              </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <AssetList assets={filteredAssets} onEdit={(asset) => { setEditingAsset(asset); setIsFormOpen(true); }} onDelete={handleDelete} exchangeRate={exchangeRate} />
              </div>

              <div className="space-y-6">
                {currentView !== 'pension' && (
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <h2 className="text-base font-black text-gray-800 mb-6">Asset Allocation</h2>
                    <Charts assets={filteredAssets} />
                  </div>
                )}

                <div className="bg-indigo-900 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707zM16.243 16.243a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414z"></path></svg></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h2 className="text-base font-black text-white flex items-center gap-2">✨ Wealth AI</h2>
                    <button onClick={() => getAiAdvice(filteredAssets, stats, selectedOwner, currentView)} disabled={isAiThinking || filteredAssets.length === 0} className="text-[10px] font-black bg-white text-indigo-900 px-3 py-1.5 rounded-full hover:bg-indigo-50 active:scale-95 disabled:bg-gray-400">
                      {isAiThinking ? '분석 중...' : '진단 받기'}
                    </button>
                  </div>
                  <div className="text-sm text-indigo-100 leading-relaxed italic relative z-10 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 min-h-[120px] flex items-center">
                    {aiAdvice || "현재 구성을 기반으로 개인화된 재무 분석과 대출 조언을 제공합니다."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`grid grid-cols-1 ${currentView === 'pension' ? 'lg:grid-cols-2' : ''} gap-6`}>
              <div className="bg-white p-6 sm:p-8 rounded-3xl border shadow-sm">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">순자산/총자산 추이</h3>
                <HistoryChart data={historyData} />
              </div>
              {currentView === 'pension' && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border shadow-sm">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">수익금/수익률 추이</h3>
                  <ProfitHistoryChart data={historyData} />
                </div>
              )}
            </div>
            {currentView !== 'pension' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Assets Flow</h3>
                  <AssetLiabilityBarChart data={historyData} type="assets" />
                </div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Liabilities Flow</h3>
                  <AssetLiabilityBarChart data={historyData} type="liabilities" />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {isFormOpen && <AssetForm onSave={(data) => { handleSave(data, editingAsset); setIsFormOpen(false); setEditingAsset(undefined); }} onClose={() => { setIsFormOpen(false); setEditingAsset(undefined); }} initialData={editingAsset} />}
      <button onClick={() => { setEditingAsset(undefined); setIsFormOpen(true); }} className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl hover:bg-blue-700 active:scale-90 transition-transform z-30 ring-4 ring-white">+</button>
    </>
  );
}
