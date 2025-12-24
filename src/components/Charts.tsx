'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Asset, AssetCategory } from '@/types';

interface Props {
  assets: Asset[];
  groupBy?: 'category' | 'country' | 'name';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#f43f5e', '#8b5cf6', '#06b6d4'];

const Charts: React.FC<Props> = ({ assets, groupBy = 'category' }) => {
  const calculateValue = (asset: Asset): number => {
    // Fix: Explicitly handle undefined/null values with nullish coalescing to ensure numeric types for arithmetic operations
    if (asset.category === AssetCategory.STOCK || asset.category === AssetCategory.PENSION || asset.category === AssetCategory.VIRTUAL_ASSET) {
      const currentPrice = asset.current_price ?? asset.metadata.avg_price ?? 0;
      return currentPrice * asset.amount;
    }
    return asset.amount;
  };

  const dataMap = assets.reduce((acc, asset) => {
    let key = '';
    if (groupBy === 'category') key = asset.category;
    else if (groupBy === 'country') key = asset.metadata.country || '기타';
    else if (groupBy === 'name') key = asset.name;

    const val = calculateValue(asset);
    acc[key] = (acc[key] || 0) + val;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(dataMap)
    .map(([name, value]) => ({ name, value: value as number }))
    // Fix: Explicitly cast values to number to resolve TypeScript arithmetic operation errors on line 34
    .sort((a, b) => (b.value as number) - (a.value as number));

  const formatLabel = (name: string) => {
    if (name === 'VIRTUAL_ASSET') return '가상자산';
    if (name === 'REAL_ESTATE') return '부동산';
    if (name === 'PENSION') return '퇴직연금';
    if (name === 'STOCK') return '주식/ETF';
    if (name === 'LOAN') return '대출';
    if (name === 'CASH') return '현금';
    return name;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value),
              formatLabel(name)
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => formatLabel(value)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;
