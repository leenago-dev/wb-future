'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, Label } from 'recharts';
import { Asset, AssetCategory } from '@/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface Props {
  assets: Asset[];
  groupBy?: 'category' | 'country' | 'name';
  exchangeRate?: number;
}

const Charts: React.FC<Props> = ({ assets, groupBy = 'category', exchangeRate = 1450 }) => {
  const calculateValue = (asset: Asset): number => {
    if (asset.category === AssetCategory.STOCK || asset.category === AssetCategory.PENSION || asset.category === AssetCategory.VIRTUAL_ASSET) {
      const currentPrice = asset.current_price ?? asset.metadata.avg_price ?? 0;
      let value = currentPrice * asset.amount;

      // USD 자산인 경우 환율 적용하여 KRW로 변환
      const isUsdAsset = asset.currency === 'USD' || asset.metadata.country === '미국';
      if (isUsdAsset && value > 0) {
        value = value * exchangeRate;
      }

      return value;
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

  const sanitizeKey = (key: string): string => {
    return key.replace(/[^a-zA-Z0-9]/g, '_');
  };

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: '총액',
      },
    };

    data.forEach((item, index) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#f43f5e', '#8b5cf6', '#06b6d4'];
      const sanitizedKey = sanitizeKey(item.name);
      config[sanitizedKey] = {
        label: formatLabel(item.name),
        color: colors[index % colors.length],
      };
    });

    return config;
  }, [data]);

  const chartData = React.useMemo(() => {
    return data.map((item) => {
      const sanitizedKey = sanitizeKey(item.name);
      return {
        name: item.name,
        value: item.value,
        fill: `var(--color-${sanitizedKey})`,
        chartKey: sanitizedKey,
      };
    });
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square w-[250px] h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={(props) => {
            if (!props.active || !props.payload || props.payload.length === 0) {
              return null;
            }
            const formattedPayload = props.payload.map((item) => {
              const itemName = item.name as string | undefined;
              const sanitizedKey = itemName ? sanitizeKey(itemName) : undefined;
              const itemConfig = sanitizedKey ? chartConfig[sanitizedKey] : undefined;
              const color = sanitizedKey && itemConfig?.color ? `var(--color-${sanitizedKey})` : item.color;

              return {
                name: itemName,
                value: typeof item.value === 'number' ? formatCurrency(item.value) : String(item.value ?? ''),
                payload: {
                  ...item.payload,
                  chartKey: sanitizedKey,
                },
                dataKey: item.dataKey as string | undefined,
                color: color,
              };
            });
            return (
              <ChartTooltipContent
                active={props.active}
                payload={formattedPayload}
                label={typeof props.label === 'string' ? props.label : undefined}
                hideLabel
                nameKey="chartKey"
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
                const cx = viewBox.cx as number;
                const cy = viewBox.cy as number;
                return (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    <tspan
                      x={cx}
                      dy="-0.5em"
                      className="fill-foreground text-lg font-bold"
                    >
                      {formatCurrency(totalValue)}
                    </tspan>
                    <tspan
                      x={cx}
                      dy="1.2em"
                      className="fill-muted-foreground text-sm"
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
        <ChartLegend
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
          content={(props) => {
            if (!props.payload || props.payload.length === 0) {
              return null;
            }
            const formattedPayload = props.payload.map((item) => {
              const itemPayload = item.payload as { chartKey?: string; name?: string } | undefined;
              const chartKey = itemPayload?.chartKey || (item.value ? sanitizeKey(String(item.value)) : undefined);
              return {
                ...item,
                value: chartKey,
                payload: {
                  ...item.payload,
                  originalName: itemPayload?.name || item.value,
                },
              };
            });
            return (
              <ChartLegendContent
                payload={formattedPayload}
                nameKey="value"
              />
            );
          }}
        />
      </PieChart>
    </ChartContainer>
  );
};

export default Charts;
