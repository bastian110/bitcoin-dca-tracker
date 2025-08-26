'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BitcoinPurchase } from '@/lib/types';
import { calculateDCAPerformance } from '@/lib/portfolio-calculator';
import { useState } from 'react';

interface PortfolioChartProps {
  purchases: BitcoinPurchase[];
  currentBTCPrice: number;
}

type ChartType = 'value' | 'pnl' | 'cost-basis';

export default function PortfolioChart({ purchases, currentBTCPrice }: PortfolioChartProps) {
  const [chartType, setChartType] = useState<ChartType>('value');
  
  const performance = calculateDCAPerformance(purchases, currentBTCPrice);
  
  if (!performance || performance.length === 0) {
    return null;
  }

  const chartData = performance.map((point, index) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: point.date,
    portfolioValue: point.currentValue,
    invested: point.runningInvested,
    btcAmount: point.runningBTC,
    pnl: point.unrealizedPnL,
    pnlPercent: point.unrealizedPnLPercent,
    avgCost: point.avgCostBasis,
    index: index + 1,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatBTC = (value: number) => {
    return `₿${value.toFixed(4)}`;
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) => {
    if (active && payload && payload.length) {
      const data = (payload[0] as { payload?: Record<string, unknown> })?.payload;
      if (!data) return null;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600 dark:text-gray-300">
              Portfolio Value: <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(Number(data.portfolioValue) || 0)}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Total Invested: <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(Number(data.invested) || 0)}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Bitcoin Held: <span className="font-medium text-gray-900 dark:text-white">{formatBTC(Number(data.btcAmount) || 0)}</span>
            </p>
            <p className={`${Number(data.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              P&L: <span className="font-medium">{formatCurrency(Number(data.pnl) || 0)} ({Number(data.pnlPercent || 0).toFixed(2)}%)</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'value':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" className="text-sm" />
              <YAxis tickFormatter={formatCurrency} className="text-sm" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="#6b7280"
                fill="url(#investedGradient)"
                strokeWidth={2}
                name="Total Invested"
              />
              <Area
                type="monotone"
                dataKey="portfolioValue"
                stroke="#f97316"
                fill="url(#portfolioGradient)"
                strokeWidth={3}
                name="Portfolio Value"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'pnl':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" className="text-sm" />
              <YAxis tickFormatter={formatCurrency} className="text-sm" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke={chartData[chartData.length - 1]?.pnl >= 0 ? '#10b981' : '#ef4444'}
                strokeWidth={3}
                dot={{ fill: chartData[chartData.length - 1]?.pnl >= 0 ? '#10b981' : '#ef4444', strokeWidth: 2, r: 4 }}
                name="Unrealized P&L"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'cost-basis':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" className="text-sm" />
              <YAxis tickFormatter={formatCurrency} className="text-sm" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="avgCost"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Average Cost Basis"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 sm:mb-0">
          Portfolio Performance
        </h3>
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setChartType('value')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              chartType === 'value'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Portfolio Value
          </button>
          <button
            onClick={() => setChartType('pnl')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              chartType === 'pnl'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            P&L
          </button>
          <button
            onClick={() => setChartType('cost-basis')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              chartType === 'cost-basis'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Cost Basis
          </button>
        </div>
      </div>
      {renderChart()}
    </div>
  );
}