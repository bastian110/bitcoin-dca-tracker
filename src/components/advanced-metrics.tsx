'use client';

import { BitcoinPurchase, PortfolioMetrics } from '@/lib/types';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Bitcoin, Target, Clock, Activity } from 'lucide-react';

interface AdvancedMetricsProps {
  purchases: BitcoinPurchase[];
  metrics: PortfolioMetrics;
  currentBTCPrice: number;
  selectedCurrency?: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
}

function MetricCard({ title, value, subValue, icon, trend, trendValue, description }: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            {icon}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          </div>
        </div>
        {trend && trendValue && (
          <div className={`flex items-center ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1 text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subValue && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subValue}</p>
        )}
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}

export default function AdvancedMetrics({ purchases, metrics, currentBTCPrice, selectedCurrency = 'USD' }: AdvancedMetricsProps) {
  const formatCurrencyAmount = (amount: number) => {
    return formatCurrency(amount, selectedCurrency);
  };

  const formatBTC = (amount: number) => {
    return `₿${amount.toFixed(8)}`;
  };

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Calculate additional metrics
  const avgPurchaseAmount = purchases.length > 0 ? metrics.totalInvested / purchases.length : 0;
  const daysSinceFirst = purchases.length > 0 ? 
    Math.floor((new Date().getTime() - new Date(metrics.firstPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const daysSinceLast = purchases.length > 0 ?
    Math.floor((new Date().getTime() - new Date(metrics.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  // Calculate if current price is above or below average cost basis
  const priceVsCostBasis = ((currentBTCPrice - metrics.averageCostBasis) / metrics.averageCostBasis) * 100;
  
  // Calculate efficiency metrics
  const btcPerDollar = metrics.totalInvested > 0 ? metrics.totalBTC / metrics.totalInvested : 0;
  const feeEfficiency = metrics.totalInvested > 0 ? (metrics.totalFees / metrics.totalInvested) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Primary Metrics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Key Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Bitcoin"
            value={formatBTC(metrics.totalBTC)}
            subValue={`Worth ${formatCurrencyAmount(metrics.currentValue)}`}
            icon={<Bitcoin className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
            description="Total Bitcoin accumulated through DCA"
          />
          
          <MetricCard
            title="Total Invested"
            value={formatCurrencyAmount(metrics.totalInvested)}
            subValue={`Including ${formatCurrencyAmount(metrics.totalFees)} in fees`}
            icon={<DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />}
            description="Total USD invested including fees"
          />
          
          <MetricCard
            title="Average Cost Basis"
            value={formatCurrencyAmount(metrics.averageCostBasis)}
            subValue={`vs Current: ${formatCurrencyAmount(currentBTCPrice)}`}
            icon={<Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            trend={priceVsCostBasis >= 0 ? 'up' : 'down'}
            trendValue={formatPercent(priceVsCostBasis)}
            description="Dollar cost averaged entry price"
          />
          
          <MetricCard
            title="Unrealized P&L"
            value={formatCurrencyAmount(metrics.unrealizedPnL)}
            subValue={formatPercent(metrics.unrealizedPnLPercent)}
            icon={<Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            trend={metrics.unrealizedPnL >= 0 ? 'up' : 'down'}
            trendValue={formatPercent(metrics.unrealizedPnLPercent)}
            description="Current profit/loss vs invested amount"
          />
        </div>
      </div>

      {/* Investment Pattern Metrics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Investment Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Average Purchase"
            value={formatCurrencyAmount(avgPurchaseAmount)}
            subValue={`Across ${metrics.purchaseCount} purchases`}
            icon={<DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
            description="Average amount per purchase"
          />
          
          <MetricCard
            title="Days Since First"
            value={`${daysSinceFirst}`}
            subValue={`Started ${new Date(metrics.firstPurchaseDate).toLocaleDateString()}`}
            icon={<Calendar className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />}
            description="Time since first Bitcoin purchase"
          />
          
          <MetricCard
            title="Days Since Last"
            value={`${daysSinceLast}`}
            subValue={`Last: ${new Date(metrics.lastPurchaseDate).toLocaleDateString()}`}
            icon={<Clock className="w-6 h-6 text-pink-600 dark:text-pink-400" />}
            description="Time since most recent purchase"
          />
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Efficiency Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Bitcoin per Dollar"
            value={`₿${(btcPerDollar * 1000000).toFixed(2)}`}
            subValue="sats per USD invested"
            icon={<Target className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
            description="Efficiency of Bitcoin accumulation"
          />
          
          <MetricCard
            title="Fee Impact"
            value={formatPercent(feeEfficiency)}
            subValue={`${formatCurrency(metrics.totalFees)} total fees`}
            icon={<TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />}
            trend={feeEfficiency < 2 ? 'up' : 'down'}
            description="Fees as percentage of total investment"
          />
          
          <MetricCard
            title="DCA Frequency"
            value={`${(daysSinceFirst / metrics.purchaseCount).toFixed(1)}`}
            subValue="days between purchases"
            icon={<Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
            description="Average time between purchases"
          />
        </div>
      </div>
    </div>
  );
}