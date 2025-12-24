'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HistoryData } from '@/types';

interface Props {
  data: HistoryData[];
  type: 'assets' | 'liabilities';
}

const AssetLiabilityBarChart: React.FC<Props> = ({ data, type }) => {
  const isAssets = type === 'assets';
  const dataKey = isAssets ? 'totalAssets' : 'totalLiabilities';
  const color = isAssets ? '#3b82f6' : '#ef4444';
  const label = isAssets ? '총자산' : '총부채';

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{fontSize: 11, fill: '#94a3b8'}}
          />
          <YAxis hide={true} domain={[0, 'auto']} />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: number) => [new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value), label]}
          />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AssetLiabilityBarChart;
