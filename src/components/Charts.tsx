'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, Label } from 'recharts';
import { Asset, AssetCategory } from '@/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface Props {
  assets: Asset[];
  groupBy?: 'category' | 'country' | 'name';
}

const Charts: React.FC<Props> = ({ assets, groupBy = 'category' }) => {
  const calculateValue = (asset: Asset): number => {
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

  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: '총액',
      },
    };

    data.forEach((item, index) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#f43f5e', '#8b5cf6', '#06b6d4'];
      config[item.name] = {
        label: formatLabel(item.name),
        color: colors[index % colors.length],
      };
    });

    return config;
  }, [data]);

  const chartData = React.useMemo(() => {
    return data.map((item) => ({
      name: item.name,
      value: item.value,
      fill: `var(--color-${item.name})`,
    }));
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={(props) => {
            if (!props.active || !props.payload || props.payload.length === 0) {
              return null;
            }
            const formattedPayload = props.payload.map((item) => ({
              name: item.name as string | undefined,
              value: typeof item.value === 'number' ? formatCurrency(item.value) : String(item.value ?? ''),
              payload: item.payload,
              dataKey: item.dataKey as string | undefined,
              color: item.color,
            }));
            return (
              <ChartTooltipContent
                active={props.active}
                payload={formattedPayload}
                label={typeof props.label === 'string' ? props.label : undefined}
                hideLabel
              />
            );
          }}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {formatCurrency(totalValue)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      총 자산
                    </tspan>
                  </text>
                ) as React.ReactElement;
              }
              return null;
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
};

export default Charts;
