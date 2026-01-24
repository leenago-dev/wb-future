'use client';

import { useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { Asset, AssetOwner } from '@/types';
import { ViewType, useAssets } from '@/hooks/useAssets';
import { useAiAdvice } from '@/hooks/useAiAdvice';
import { useSidebar } from '@/components/SidebarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
      <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsMobileOpen(true)} variant="ghost" size="icon" className="lg:hidden -ml-2">
              <Menu className="w-6 h-6" />
            </Button>
            <h1 className="text-lg sm:text-xl text-foreground tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {isLoadingPrices && <Badge variant="outline" className="hidden md:inline text-[10px] text-primary animate-pulse tracking-tighter uppercase">Live Markets</Badge>}
            <Button
              onClick={() => { setEditingAsset(undefined); setIsFormOpen(true); }}
              className="text-xs sm:text-sm shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4 mr-1" />
              항목 추가
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <div className="flex items-center gap-4">
            <div className="flex bg-card p-1 rounded-2xl border shadow-sm w-max sm:w-fit">
              {OWNER_FILTER_OPTIONS.map((owner) => (
                <Button
                  key={owner}
                  onClick={() => setSelectedOwner(owner as 'Total' | AssetOwner)}
                  variant={selectedOwner === owner ? 'default' : 'ghost'}
                  className={cn('px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl', selectedOwner === owner && 'shadow-md')}
                >
                  {OWNER_LABELS[owner]}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-2xl border shadow-sm">
              <span className="text-xs text-muted-foreground font-medium">💵 USD/KRW</span>
              <span className="text-sm font-bold text-foreground">{exchangeRate.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-5 sm:p-6 rounded-3xl hover:border-primary/50 transition-colors">
            <CardContent className="p-0 flex flex-col justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground font-bold uppercase tracking-wider">Total Assets</span>
              <span className="text-xl sm:text-2xl font-black text-foreground mt-2">{formatCurrency(stats.totalAssets)}</span>
            </CardContent>
          </Card>

          {currentView === 'pension' || currentView === 'stock' || currentView === 'crypto' ? (
            <Card className="p-5 sm:p-6 rounded-3xl hover:border-emerald-100 transition-colors">
              <CardContent className="p-0 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs sm:text-sm text-muted-foreground font-bold uppercase tracking-wider">Performance</span>
                  <Badge variant={stats.totalProfit >= 0 ? 'default' : 'destructive'} className="text-[10px]">
                    {stats.totalRoi >= 0 ? '+' : ''}{stats.totalRoi.toFixed(2)}%
                  </Badge>
                </div>
                <span className={cn('text-xl sm:text-2xl font-black mt-2', stats.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(stats.totalProfit)}
                </span>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-5 sm:p-6 rounded-3xl hover:border-red-100 transition-colors">
              <CardContent className="p-0 flex flex-col justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground font-bold uppercase tracking-wider">Liabilities</span>
                <span className="text-xl sm:text-2xl font-black text-destructive mt-2">{formatCurrency(stats.totalLiabilities)}</span>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-primary to-indigo-700 p-5 sm:p-6 rounded-3xl shadow-xl text-primary-foreground transform transition-transform hover:scale-[1.01] sm:col-span-2 lg:col-span-1 border-0">
            <CardContent className="p-0 flex flex-col justify-between">
              <span className="text-xs sm:text-sm text-primary-foreground/80 font-bold uppercase tracking-wider">Net Worth</span>
              <span className="text-xl sm:text-2xl font-black mt-2">{formatCurrency(stats.netWorth)}</span>
            </CardContent>
          </Card>
        </div>

        {currentView === 'real-estate' && (
          <DsrCalculator assets={filteredAssets} />
        )}

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'Assets' | 'History')} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
            <TabsTrigger value="Assets" className="pb-3 px-1 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              자산 목록
            </TabsTrigger>
            <TabsTrigger value="History" className="pb-3 px-1 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              변동 추이
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'Assets' | 'History')} className="w-full">
          <TabsList className="hidden">
            <TabsTrigger value="Assets" />
            <TabsTrigger value="History" />
          </TabsList>
        </Tabs>

        {viewMode === 'Assets' ? (
          <div className="space-y-6">
            {(currentView === 'pension' || currentView === 'stock') && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6 rounded-3xl">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle className="flex items-center gap-2">🌍 국가별 투자 비중</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Charts assets={filteredAssets} groupBy="country" exchangeRate={exchangeRate} />
                    </CardContent>
                  </Card>
                  <Card className="p-6 rounded-3xl">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle className="flex items-center gap-2">📦 종목별 투자 비중</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Charts assets={filteredAssets} groupBy="name" exchangeRate={exchangeRate} />
                    </CardContent>
                  </Card>
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
                  <Card className="p-6 rounded-3xl">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle>Asset Allocation</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Charts assets={filteredAssets} exchangeRate={exchangeRate} />
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-indigo-900 p-6 rounded-3xl shadow-xl relative overflow-hidden group border-0">
                  {/* 배경 장식 아이콘 (AI 스파크 아이콘) */}
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <CardHeader className="p-0 mb-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">✨ Wealth AI</CardTitle>
                      <Button
                        onClick={() => getAiAdvice(filteredAssets, stats, selectedOwner, currentView)}
                        disabled={isAiThinking || filteredAssets.length === 0}
                        variant="secondary"
                        size="sm"
                        className="text-[10px] font-black"
                      >
                        {isAiThinking ? '분석 중...' : '진단 받기'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 relative z-10">
                    <div className="text-sm text-primary-foreground/80 leading-relaxed italic bg-background/10 p-4 rounded-2xl backdrop-blur-md border border-background/10 min-h-[120px] flex items-center">
                      {aiAdvice || "현재 구성을 기반으로 개인화된 재무 분석과 대출 조언을 제공합니다."}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`grid grid-cols-1 ${(currentView === 'pension' || currentView === 'stock') ? 'lg:grid-cols-2' : ''} gap-6`}>
              <Card className="p-6 sm:p-8 rounded-3xl">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-muted-foreground uppercase tracking-widest">순자산/총자산 추이</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <HistoryChart data={historyData} />
                </CardContent>
              </Card>
              {(currentView === 'pension' || currentView === 'stock') && (
                <Card className="p-6 sm:p-8 rounded-3xl">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-muted-foreground uppercase tracking-widest">수익금/수익률 추이</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ProfitHistoryChart data={historyData} />
                  </CardContent>
                </Card>
              )}
            </div>
            {currentView !== 'pension' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 rounded-3xl">
                  <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-muted-foreground uppercase tracking-widest">Assets Flow</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <AssetLiabilityBarChart data={historyData} type="assets" />
                  </CardContent>
                </Card>
                <Card className="p-6 rounded-3xl">
                  <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-muted-foreground uppercase tracking-widest">Liabilities Flow</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <AssetLiabilityBarChart data={historyData} type="liabilities" />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>

      {isFormOpen && <AssetForm onSave={(data) => { handleSave(data, editingAsset); setIsFormOpen(false); setEditingAsset(undefined); }} onClose={() => { setIsFormOpen(false); setEditingAsset(undefined); }} initialData={editingAsset} />}
      <Button
        onClick={() => { setEditingAsset(undefined); setIsFormOpen(true); }}
        size="icon"
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 rounded-full shadow-2xl text-3xl z-30 ring-4 ring-white"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </>
  );
}
