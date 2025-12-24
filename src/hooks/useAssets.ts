'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Asset, AssetCategory, AssetOwner, DashboardStats, HistoryData } from '@/types';
import { getAssets, saveAsset, deleteAsset, fetchCurrentPrice } from '@/services/mockApi';

export type ViewType = 'dashboard' | 'real-estate' | 'pension' | 'crypto';

export function useAssets(selectedOwner: 'Total' | AssetOwner, currentView: ViewType) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  const loadData = useCallback(async () => {
    const data = getAssets();
    setAssets(data);

    setIsLoadingPrices(true);
    const updatedAssets = await Promise.all(data.map(async (asset) => {
      if ((asset.category === AssetCategory.STOCK || asset.category === AssetCategory.PENSION || asset.category === AssetCategory.VIRTUAL_ASSET) && asset.metadata.ticker) {
        try {
          const price = await fetchCurrentPrice(asset.metadata.ticker);
          return { ...asset, current_price: price };
        } catch (e) {
          return asset;
        }
      }
      return asset;
    }));
    setAssets(updatedAssets);
    setIsLoadingPrices(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAssets = useMemo(() => {
    const baseAssets = selectedOwner === 'Total' ? assets : assets.filter(a => a.owner === selectedOwner);

    if (currentView === 'real-estate') {
      return baseAssets.filter(a => a.category === AssetCategory.REAL_ESTATE || a.category === AssetCategory.LOAN);
    }
    if (currentView === 'pension') return baseAssets.filter(a => a.category === AssetCategory.PENSION);
    if (currentView === 'crypto') return baseAssets.filter(a => a.category === AssetCategory.VIRTUAL_ASSET);

    return baseAssets;
  }, [assets, selectedOwner, currentView]);

  const stats: DashboardStats = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalProfit = 0;
    let totalPrincipal = 0;

    filteredAssets.forEach(asset => {
      const isLoan = asset.category === AssetCategory.LOAN;
      const isInvested = [AssetCategory.STOCK, AssetCategory.PENSION, AssetCategory.VIRTUAL_ASSET].includes(asset.category);

      const currentVal = (isInvested)
        ? (asset.current_price || asset.metadata.avg_price || 0) * asset.amount
        : asset.amount;

      if (isLoan) {
        totalLiabilities += currentVal;
      } else {
        totalAssets += currentVal;
        if (isInvested) {
          const principal = (asset.metadata.avg_price || 0) * asset.amount;
          totalPrincipal += principal;
          totalProfit += (currentVal - principal);
        } else if (asset.category === AssetCategory.REAL_ESTATE) {
          const principal = asset.metadata.purchase_price || 0;
          totalPrincipal += principal;
          totalProfit += (currentVal - principal);
        }
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      totalProfit,
      totalRoi: totalPrincipal > 0 ? (totalProfit / totalPrincipal) * 100 : 0
    };
  }, [filteredAssets]);

  const historyData: HistoryData[] = useMemo(() => {
    if (assets.length === 0) return [];
    const now = new Date();
    const result: HistoryData[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      let mAssets = 0;
      let mLiabilities = 0;
      let mProfit = 0;
      let mPrincipal = 0;

      const marketVariance = 1 - (i * 0.015);

      assets.forEach(asset => {
        const creationDate = new Date(asset.created_at || asset.updated_at);
        if (creationDate <= monthEnd) {
          if (selectedOwner === 'Total' || asset.owner === selectedOwner) {
            if (currentView !== 'dashboard') {
              if (currentView === 'real-estate' && asset.category !== AssetCategory.REAL_ESTATE && asset.category !== AssetCategory.LOAN) return;
              if (currentView === 'pension' && asset.category !== AssetCategory.PENSION) return;
              if (currentView === 'crypto' && asset.category !== AssetCategory.VIRTUAL_ASSET) return;
            }

            const isLoan = asset.category === AssetCategory.LOAN;
            const isInvested = [AssetCategory.STOCK, AssetCategory.PENSION, AssetCategory.VIRTUAL_ASSET].includes(asset.category);

            const currentVal = isInvested
              ? (asset.current_price || asset.metadata.avg_price || 0) * asset.amount * marketVariance
              : asset.amount;

            if (isLoan) {
              mLiabilities += currentVal;
            } else {
              mAssets += currentVal;
              if (isInvested) {
                const principal = (asset.metadata.avg_price || 0) * asset.amount;
                mPrincipal += principal;
                mProfit += (currentVal - principal);
              } else if (asset.category === AssetCategory.REAL_ESTATE) {
                const principal = asset.metadata.purchase_price || 0;
                mPrincipal += principal;
                mProfit += (currentVal - principal);
              }
            }
          }
        }
      });

      result.push({
        month: monthStr,
        netWorth: mAssets - mLiabilities,
        totalAssets: mAssets,
        totalLiabilities: mLiabilities,
        totalProfit: mProfit,
        totalRoi: mPrincipal > 0 ? (mProfit / mPrincipal) * 100 : 0
      });
    }
    return result;
  }, [assets, selectedOwner, currentView]);

  const handleSave = useCallback((assetData: Omit<Asset, 'id' | 'updated_at' | 'created_at' | 'user_id'>, editingAsset?: Asset) => {
    const now = new Date().toISOString();
    const newAsset: Asset = {
      ...assetData,
      id: editingAsset?.id || crypto.randomUUID(),
      user_id: 'leena-husband-uuid',
      created_at: editingAsset?.created_at || now,
      updated_at: now
    };
    saveAsset(newAsset);
    loadData();
  }, [loadData]);

  const handleDelete = useCallback((id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteAsset(id);
      loadData();
    }
  }, [loadData]);

  return {
    assets,
    filteredAssets,
    stats,
    historyData,
    isLoadingPrices,
    loadData,
    handleSave,
    handleDelete,
  };
}
