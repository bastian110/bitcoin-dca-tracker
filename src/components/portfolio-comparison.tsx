'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator } from 'lucide-react';
import { BitcoinPurchase } from '@/lib/types';
import { calculatePortfolioMetrics } from '@/lib/portfolio-calculator';

interface PortfolioComparisonProps {
  purchases: BitcoinPurchase[];
  currentBTCPrice: number;
}

interface ComparisonStrategy {
  id: string;
  name: string;
  description: string;
  calculatePurchases: (originalPurchases: BitcoinPurchase[]) => BitcoinPurchase[];
}

export default function PortfolioComparison({ purchases, currentBTCPrice }: PortfolioComparisonProps) {
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['actual', 'monthly-dca']);

  const strategies: ComparisonStrategy[] = [
    {
      id: 'actual',
      name: 'Actual DCA',
      description: 'Your actual purchase history',
      calculatePurchases: (purchases) => purchases,
    },
    {
      id: 'monthly-dca',
      name: 'Monthly DCA',
      description: 'Equal monthly purchases',
      calculatePurchases: (purchases) => {
        if (purchases.length === 0) return [];
        
        const totalInvested = purchases.reduce((sum, p) => sum + (p.amount_btc * p.price_usd), 0);
        const firstDate = new Date(purchases[0].date);
        const lastDate = new Date(purchases[purchases.length - 1].date);
        const monthsDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        const monthlyAmount = totalInvested / Math.max(monthsDiff, 1);
        
        const monthlyPurchases: BitcoinPurchase[] = [];
        for (let i = 0; i < monthsDiff; i++) {
          const purchaseDate = new Date(firstDate);
          purchaseDate.setMonth(purchaseDate.getMonth() + i);
          
          // Find closest actual purchase for price reference
          const closestPurchase = purchases.reduce((closest, p) => {
            const pDate = new Date(p.date);
            const currentClosest = new Date(closest.date);
            return Math.abs(pDate.getTime() - purchaseDate.getTime()) < 
                   Math.abs(currentClosest.getTime() - purchaseDate.getTime()) ? p : closest;
          });
          
          monthlyPurchases.push({
            date: purchaseDate.toISOString().split('T')[0],
            amount_btc: monthlyAmount / closestPurchase.price_usd,
            price_usd: closestPurchase.price_usd,
            fee_usd: monthlyAmount * 0.01, // 1% fee assumption
            exchange: 'Simulated',
            notes: 'Monthly DCA simulation'
          });
        }
        
        return monthlyPurchases;
      },
    },
    {
      id: 'weekly-dca',
      name: 'Weekly DCA',
      description: 'Equal weekly purchases',
      calculatePurchases: (purchases) => {
        if (purchases.length === 0) return [];
        
        const totalInvested = purchases.reduce((sum, p) => sum + (p.amount_btc * p.price_usd), 0);
        const firstDate = new Date(purchases[0].date);
        const lastDate = new Date(purchases[purchases.length - 1].date);
        const weeksDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const weeklyAmount = totalInvested / Math.max(weeksDiff, 1);
        
        const weeklyPurchases: BitcoinPurchase[] = [];
        for (let i = 0; i < weeksDiff; i++) {
          const purchaseDate = new Date(firstDate);
          purchaseDate.setDate(purchaseDate.getDate() + (i * 7));
          
          const closestPurchase = purchases.reduce((closest, p) => {
            const pDate = new Date(p.date);
            const currentClosest = new Date(closest.date);
            return Math.abs(pDate.getTime() - purchaseDate.getTime()) < 
                   Math.abs(currentClosest.getTime() - purchaseDate.getTime()) ? p : closest;
          });
          
          weeklyPurchases.push({
            date: purchaseDate.toISOString().split('T')[0],
            amount_btc: weeklyAmount / closestPurchase.price_usd,
            price_usd: closestPurchase.price_usd,
            fee_usd: weeklyAmount * 0.01,
            exchange: 'Simulated',
            notes: 'Weekly DCA simulation'
          });
        }
        
        return weeklyPurchases;
      },
    },
    {
      id: 'lump-sum',
      name: 'Lump Sum',
      description: 'Single purchase at the beginning',
      calculatePurchases: (purchases) => {
        if (purchases.length === 0) return [];
        
        const totalInvested = purchases.reduce((sum, p) => sum + (p.amount_btc * p.price_usd), 0);
        const firstPurchase = purchases[0];
        
        return [{
          date: firstPurchase.date,
          amount_btc: totalInvested / firstPurchase.price_usd,
          price_usd: firstPurchase.price_usd,
          fee_usd: totalInvested * 0.005, // 0.5% fee for lump sum
          exchange: 'Simulated',
          notes: 'Lump sum simulation'
        }];
      },
    },
  ];

  const getStrategyMetrics = (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return null;
    
    const strategyPurchases = strategy.calculatePurchases(purchases);
    return calculatePortfolioMetrics(strategyPurchases, currentBTCPrice);
  };

  const comparisonData = selectedStrategies.map(strategyId => {
    const strategy = strategies.find(s => s.id === strategyId);
    const metrics = getStrategyMetrics(strategyId);
    
    return {
      strategy: strategy?.name || '',
      totalBTC: metrics?.totalBTC || 0,
      totalInvested: metrics?.totalInvested || 0,
      currentValue: metrics?.currentValue || 0,
      unrealizedPnL: metrics?.unrealizedPnL || 0,
      unrealizedPnLPercent: metrics?.unrealizedPnLPercent || 0,
      averageCostBasis: metrics?.averageCostBasis || 0,
      totalFees: metrics?.totalFees || 0,
      purchaseCount: metrics?.purchaseCount || 0,
    };
  });

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

  const toggleStrategy = (strategyId: string) => {
    setSelectedStrategies(prev => {
      if (prev.includes(strategyId)) {
        return prev.filter(id => id !== strategyId);
      } else {
        return [...prev, strategyId];
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Strategy Comparison</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Compare your DCA strategy against alternative investment approaches using the same time period and total investment.
        </p>
      </div>

      {/* Strategy Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Strategies to Compare:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {strategies.map(strategy => (
            <button
              key={strategy.id}
              onClick={() => toggleStrategy(strategy.id)}
              className={`p-3 border-2 rounded-lg text-left transition-colors ${
                selectedStrategies.includes(strategy.id)
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                {strategy.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {strategy.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {comparisonData.length > 0 && (
        <>
          {/* Comparison Chart */}
          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Portfolio Value Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="strategy" className="text-sm" />
                <YAxis tickFormatter={formatCurrency} className="text-sm" />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Current Value']}
                  labelClassName="text-gray-900 dark:text-white"
                  contentStyle={{ backgroundColor: 'rgb(31 41 55)', border: '1px solid rgb(75 85 99)', borderRadius: '0.5rem' }}
                />
                <Bar dataKey="currentValue" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Comparison Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Strategy</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Bitcoin</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Invested</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Current Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">P&L</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Avg Cost</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Purchases</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((data, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {data.strategy}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {formatBTC(data.totalBTC)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {formatCurrency(data.totalInvested)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {formatCurrency(data.currentValue)}
                    </td>
                    <td className={`py-3 px-4 font-medium ${
                      data.unrealizedPnL >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(data.unrealizedPnL)}
                      <div className="text-xs">
                        ({data.unrealizedPnLPercent > 0 ? '+' : ''}{data.unrealizedPnLPercent.toFixed(1)}%)
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {formatCurrency(data.averageCostBasis)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {data.purchaseCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key Insights */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Key Insights
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              {(() => {
                const bestStrategy = comparisonData.reduce((best, current) => 
                  current.unrealizedPnL > best.unrealizedPnL ? current : best
                );
                
                return (
                  <>
                    <p>• Best performing strategy: <strong>{bestStrategy.strategy}</strong> with {formatCurrency(bestStrategy.unrealizedPnL)} P&L</p>
                    <p>• Your actual DCA vs best: {formatCurrency((comparisonData.find(d => d.strategy === 'Actual DCA')?.unrealizedPnL || 0) - bestStrategy.unrealizedPnL)} difference</p>
                    <p>• Most Bitcoin accumulated: <strong>{comparisonData.reduce((max, current) => current.totalBTC > max.totalBTC ? current : max).strategy}</strong></p>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}