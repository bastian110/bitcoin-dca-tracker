'use client';

import { BitcoinPurchase, PortfolioMetrics } from '@/lib/types';
import { formatCurrency } from '@/lib/currency';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Globe, Hash, MapPin, TrendingUp, DollarSign, Repeat, Clock } from 'lucide-react';

interface EnhancedAnalyticsProps {
  purchases: BitcoinPurchase[];
  metrics: PortfolioMetrics;
  selectedCurrency?: string;
}

export default function EnhancedAnalytics({ purchases, metrics, selectedCurrency = 'USD' }: EnhancedAnalyticsProps) {
  const formatCurrencyAmount = (amount: number) => {
    return formatCurrency(amount, selectedCurrency);
  };

  const formatBTC = (amount: number) => {
    return `₿${amount.toFixed(8)}`;
  };

  // Prepare data for charts
  const exchangeData = Object.entries(metrics.exchangeBreakdown).map(([name, data]) => ({
    name: name.length > 15 ? name.substring(0, 15) + '...' : name,
    fullName: name,
    count: data.count,
    totalBTC: data.totalBTC,
    totalFiat: data.totalFiat,
    avgPrice: data.avgPrice,
  }));

  const currencyData = Object.entries(metrics.currencyBreakdown).map(([currency, data]) => ({
    currency,
    amount: data.totalAmount,
    count: data.purchaseCount,
    percentage: (data.totalAmount / metrics.totalFiatAmount) * 100,
  }));

  const typeData = Object.entries(metrics.transactionTypeBreakdown).map(([type, count]) => ({
    type,
    count,
    percentage: (count / metrics.purchaseCount) * 100,
  }));

  // Colors for charts
  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const hasEnhancedData = purchases.some(p => 
    p.type || p.currency_received || p.transaction_hash || p.address || p.external_id
  );

  if (!hasEnhancedData) {
    return null; // Don't show enhanced analytics for simple data
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Summary Cards */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Enhanced Portfolio Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary Currency</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.primaryFiatCurrency}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrencyAmount(metrics.totalFiatAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Effective Price</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrencyAmount(metrics.averageEffectivePrice)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Including all fees</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                <Repeat className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fee Impact</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.feeAsPercentOfInvestment.toFixed(2)}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">of total investment</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Timezone</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.timezoneMostUsed || 'Mixed'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Most common</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Breakdown Chart */}
      {exchangeData.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Exchange Distribution</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={exchangeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="totalBTC"
                    label={({ name, totalBTC }) => `${name}: ₿${totalBTC.toFixed(4)}`}
                  >
                    {exchangeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₿${value.toFixed(6)}`, 'Bitcoin']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {exchangeData.map((exchange, index) => (
                <div key={exchange.fullName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{exchange.fullName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{exchange.count} purchases</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{formatBTC(exchange.totalBTC)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg: {formatCurrencyAmount(exchange.avgPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Currency Breakdown */}
      {currencyData.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Currency Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currencyData}>
              <XAxis dataKey="currency" />
              <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'amount' ? formatCurrencyAmount(value) : value,
                  name === 'amount' ? 'Amount' : 'Purchases'
                ]}
              />
              <Legend />
              <Bar dataKey="amount" fill="#f97316" name="Total Amount" />
              <Bar dataKey="count" fill="#3b82f6" name="Purchase Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction Types */}
      {typeData.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Transaction Types</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeData.map((type) => (
              <div key={type.type} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{type.type}</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {type.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center">
                  <div
                    className="h-2 bg-orange-600 rounded-full mr-2"
                    style={{ width: `${Math.max(type.percentage, 5)}%` }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{type.count} purchases</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Completeness */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Quality & Completeness</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Hash className={`w-6 h-6 mr-3 ${metrics.hasTransactionHashes ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Transaction Hashes</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metrics.hasTransactionHashes ? 'Available' : 'Not available'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <MapPin className={`w-6 h-6 mr-3 ${metrics.hasAddresses ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Addresses</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metrics.hasAddresses ? 'Available' : 'Not available'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Globe className={`w-6 h-6 mr-3 ${metrics.timezoneMostUsed ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Timezone Data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metrics.timezoneMostUsed ? `Primary: ${metrics.timezoneMostUsed}` : 'Not available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Size Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Purchase Size Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h5 className="font-medium text-green-900 dark:text-green-200 mb-2">Largest Purchase</h5>
            <div className="space-y-1">
              <p className="text-lg font-bold text-green-800 dark:text-green-300">
                {formatBTC(metrics.largestPurchase.amount)}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                {new Date(metrics.largestPurchase.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                @ {formatCurrencyAmount(metrics.largestPurchase.price)}
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Smallest Purchase</h5>
            <div className="space-y-1">
              <p className="text-lg font-bold text-blue-800 dark:text-blue-300">
                {formatBTC(metrics.smallestPurchase.amount)}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {new Date(metrics.smallestPurchase.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                @ {formatCurrencyAmount(metrics.smallestPurchase.price)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}