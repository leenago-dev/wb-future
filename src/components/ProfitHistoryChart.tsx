'use client';

import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HistoryData } from '@/types';

interface Props {
  data: HistoryData[];
}

const ProfitHistoryChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{fontSize: 12, fill: '#94a3b8'}}
            dy={10}
          />
          <YAxis
            yAxisId="left"
            hide={true}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            hide={true}
          />
          <Tooltip
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
            formatter={(value: number, name: string) => {
              if (name === '수익률') return [`${value.toFixed(2)}%`, name];
              return [new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value), name];
            }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
          <Bar
            yAxisId="left"
            dataKey="totalProfit"
            name="수익금"
            fill="#fb7185"
            radius={[6, 6, 0, 0]}
            barSize={24}
            opacity={0.8}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="totalRoi"
            name="수익률"
            stroke="#f59e0b"
            strokeWidth={4}
            dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfitHistoryChart;
