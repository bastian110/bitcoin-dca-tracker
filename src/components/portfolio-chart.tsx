'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BitcoinPurchase, CurrencyOptions } from '@/lib/types';
import { formatCurrency } from '@/lib/currency';
import { useState, useMemo, useId } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Info } from 'lucide-react';

// Import the currency normalization functions
const num = (x: unknown, d = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
};

function rowCostFiatExclFees(p: BitcoinPurchase, options?: CurrencyOptions): number {
  const fx = options?.fx ?? null;
  const target = options?.fiat ?? 'USD';

  // Prefer explicit fiat_amount (excl. fees)
  if (num(p.fiat_amount) > 0) {
    const from = p.fiat_currency; // SHOULD exist if fiat_amount exists
    if (!from) {
      console.warn('fiat_amount provided without fiat_currency; assuming target currency.');
      return num(p.fiat_amount);
    }
    if (from === target) return num(p.fiat_amount);
    if (!fx) throw new Error(`FX required to convert ${from}->${target}`);
    const r = fx.getRate(from, target, p.date) ?? fx.getRate(from, target);
    if (!r) throw new Error(`Missing FX ${from}->${target} on ${p.date ?? 'n/a'}`);
    return num(p.fiat_amount) * r;
  }

  // Next: price_fiat with fiat_currency
  if (num(p.price_fiat) > 0 && p.fiat_currency) {
    const from = p.fiat_currency;
    const base = num(p.amount_btc) * num(p.price_fiat);
    if (from === target) return base;
    if (!fx) throw new Error(`FX required to convert ${from}->${target}`);
    const r = fx.getRate(from, target, p.date) ?? fx.getRate(from, target);
    if (!r) throw new Error(`Missing FX ${from}->${target} on ${p.date ?? 'n/a'}`);
    return base * r;
  }

  // Fallback: USD path
  const baseUSD = num(p.amount_btc) * num(p.price_usd);
  if (target === 'USD') return baseUSD;
  if (!fx) throw new Error(`FX required to convert USD->${target}`);
  const r = fx.getRate('USD', target, p.date) ?? fx.getRate('USD', target);
  if (!r) throw new Error(`Missing FX USD->${target} on ${p.date ?? 'n/a'}`);
  return baseUSD * r;
}

function rowFeeFiat(p: BitcoinPurchase, options?: CurrencyOptions): number {
  const fx = options?.fx ?? null;
  const target = options?.fiat ?? 'USD';

  // Try fee_fiat with currency first
  if (num(p.fee_fiat) > 0 && p.fiat_currency) {
    const from = p.fiat_currency;
    if (from === target) return num(p.fee_fiat);
    if (!fx) throw new Error(`FX required to convert ${from}->${target}`);
    const r = fx.getRate(from, target, p.date) ?? fx.getRate(from, target);
    if (!r) throw new Error(`Missing FX ${from}->${target} on ${p.date ?? 'n/a'}`);
    return num(p.fee_fiat) * r;
  }

  // Try fee_amount with fee_currency
  if (num(p.fee_amount) > 0 && p.fee_currency) {
    const from = p.fee_currency;
    if (from === target) return num(p.fee_amount);
    if (!fx) throw new Error(`FX required to convert ${from}->${target}`);
    const r = fx.getRate(from, target, p.date) ?? fx.getRate(from, target);
    if (!r) throw new Error(`Missing FX ${from}->${target} on ${p.date ?? 'n/a'}`);
    return num(p.fee_amount) * r;
  }

  // Fallback: USD path
  const feeUSD = num(p.fee_usd) || 0;
  if (target === 'USD') return feeUSD;
  if (!fx) throw new Error(`FX required to convert USD->${target}`);
  const r = fx.getRate('USD', target, p.date) ?? fx.getRate('USD', target);
  if (!r) throw new Error(`Missing FX USD->${target} on ${p.date ?? 'n/a'}`);
  return feeUSD * r;
}

interface PortfolioChartProps {
  purchases: BitcoinPurchase[];
  currentBTCPrice: number;
  currentPriceCurrency?: string;    // Currency of currentBTCPrice, default 'USD'
  selectedCurrency?: string;
  currencyOptions?: CurrencyOptions;
}

interface PerformanceDataPoint {
  date: string;
  fullDate: string;
  purchaseIndex: number;
  runningBTC: number;
  runningInvested: number;
  // Mark-to-Market values
  valueMTM: number;
  pnlMTM: number;
  pnlPercentMTM: number;
  // ToDate values  
  valueToDate: number;
  pnlToDate: number;
  pnlPercentToDate: number;
  // Purchase price at this step
  priceAtBuy: number;
}

type ChartType = 'portfolio-value' | 'pnl-dollar' | 'pnl-percent' | 'comparison';
type DCAMode = 'both' | 'markToMarket' | 'toDate';

export default function PortfolioChart({ 
  purchases, 
  currentBTCPrice,
  currentPriceCurrency = 'USD',
  selectedCurrency = 'USD',
  currencyOptions
}: PortfolioChartProps) {
  const [chartType, setChartType] = useState<ChartType>('portfolio-value');
  const [dcaMode, setDcaMode] = useState<DCAMode>('both');
  const gid = useId(); // Unique gradient IDs to prevent collisions
  
  // Force a single target fiat for both compute & format
  const targetFiat = currencyOptions?.fiat ?? selectedCurrency;
  
  // Warn if divergent values in development
  if (process.env.NODE_ENV !== 'production' && selectedCurrency !== targetFiat) {
    console.warn(`[PortfolioChart] selectedCurrency(${selectedCurrency}) != currencyOptions.fiat(${targetFiat}). Using ${targetFiat} for both.`);
  }

  // Convert current BTC price to target currency with explicit source currency
  const convertCurrentPriceToTargetCurrency = (price: number, priceCur = 'USD'): number => {
    const fx = currencyOptions?.fx ?? null;
    if (priceCur === targetFiat) return price;
    if (!fx) {
      console.warn(`Need FX to convert ${priceCur}->${targetFiat}. Using original price.`);
      return price;
    }
    const rate = fx.getRate(priceCur, targetFiat);
    if (!rate) {
      console.warn(`Missing FX ${priceCur}->${targetFiat}. Using original price.`);
      return price;
    }
    return price * rate;
  };
  
  // Unified currency formatter
  const formatCurrencyAmount = (value: number) => formatCurrency(value, targetFiat);

  // Calculate comprehensive performance data with proper currency normalization
  const calculateComprehensivePerformance = (): PerformanceDataPoint[] => {
    const sortedPurchases = [...purchases].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBTC = 0;
    let runningInvested = 0;

    return sortedPurchases.map((purchase, index) => {
      // Get normalized values for this purchase in target currency
      const rowCost = rowCostFiatExclFees(purchase, currencyOptions);  // Cost excluding fees
      const rowFee = rowFeeFiat(purchase, currencyOptions);            // Fee amount in target currency
      
      // CRITICAL: Update running totals correctly
      // - Fees are included in runningInvested for P&L calculations  
      // - But fees are NOT added to priceAtBuy (purchase price should exclude fees)
      runningBTC += num(purchase.amount_btc);
      runningInvested += rowCost + rowFee;  // Total invested includes fees

      // Calculate priceAtBuy in target currency (EXCLUDING fees) for THIS specific purchase
      // This is the pure purchase price without fees, properly normalized to target currency
      const priceAtBuy = num(purchase.amount_btc) > 0 ? rowCost / num(purchase.amount_btc) : 0;

      // Mark-to-Market calculations (historical perspective)
      // Use priceAtBuy (which is already normalized and excludes fees)
      const valueMTM = runningBTC * priceAtBuy;
      const pnlMTM = valueMTM - runningInvested;
      const pnlPercentMTM = runningInvested > 0 ? (pnlMTM / runningInvested) * 100 : 0;

      // ToDate calculations (current perspective) 
      // Convert current BTC price to target currency
      const currentPriceInTargetCurrency = convertCurrentPriceToTargetCurrency(
        num(currentBTCPrice),
        currentPriceCurrency
      );
      const valueToDate = runningBTC * currentPriceInTargetCurrency;
      const pnlToDate = valueToDate - runningInvested;
      const pnlPercentToDate = runningInvested > 0 ? (pnlToDate / runningInvested) * 100 : 0;

      return {
        date: new Date(purchase.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: sortedPurchases.length > 50 ? undefined : '2-digit'
        }),
        fullDate: purchase.date,
        purchaseIndex: index + 1,
        runningBTC,
        runningInvested,        // Includes fees (correct for P&L)
        valueMTM,
        pnlMTM,
        pnlPercentMTM,
        valueToDate,
        pnlToDate,
        pnlPercentToDate,
        priceAtBuy,             // Normalized to target currency, excludes fees (correct for MTM calculations)
      };
    });
  };

  // Memoize performance data to prevent recalculation on every render
  const performanceData = useMemo(() => {
    if (purchases.length === 0) {
      return [];
    }
    return calculateComprehensivePerformance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchases, currencyOptions, targetFiat, currentBTCPrice, currentPriceCurrency]);

  // formatCurrencyAmount is now defined earlier with targetFiat

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatBTC = (value: number) => {
    return `₿${value.toFixed(4)}`;
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) => {
    if (active && payload && payload.length) {
      const data = (payload[0] as { payload?: PerformanceDataPoint })?.payload;
      if (!data) return null;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-80">
          <p className="font-medium text-gray-900 dark:text-white mb-3">
            Purchase #{data.purchaseIndex} - {label}
          </p>
          
          <div className="space-y-2 text-sm">
            {/* Basic info */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
              <p className="text-gray-600 dark:text-gray-300">
                Bitcoin Held: <span className="font-medium text-gray-900 dark:text-white">{formatBTC(data.runningBTC)}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Total Invested: <span className="font-medium text-gray-900 dark:text-white">{formatCurrencyAmount(data.runningInvested)}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Price at Buy: <span className="font-medium text-gray-900 dark:text-white">{formatCurrencyAmount(data.priceAtBuy)}</span>
              </p>
            </div>

            {/* Mark-to-Market */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">Mark-to-Market (Historical)</p>
              <p className="text-blue-700 dark:text-blue-300">
                Value: <span className="font-medium">{formatCurrencyAmount(data.valueMTM)}</span>
              </p>
              <p className={`${data.pnlMTM >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                P&L: <span className="font-medium">{formatCurrencyAmount(data.pnlMTM)} ({formatPercent(data.pnlPercentMTM)})</span>
              </p>
            </div>

            {/* ToDate */}
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
              <p className="font-medium text-orange-900 dark:text-orange-200 mb-1">ToDate (Current Price)</p>
              <p className="text-orange-700 dark:text-orange-300">
                Value: <span className="font-medium">{formatCurrencyAmount(data.valueToDate)}</span>
              </p>
              <p className={`${data.pnlToDate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                P&L: <span className="font-medium">{formatCurrencyAmount(data.pnlToDate)} ({formatPercent(data.pnlPercentToDate)})</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'portfolio-value':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id={`investedGradient-${gid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id={`mtmGradient-${gid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id={`todateGradient-${gid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" className="text-sm" />
              <YAxis tickFormatter={formatCurrencyAmount} className="text-sm" />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Invested Capital - baseline */}
              <Area
                type="monotone"
                dataKey="runningInvested"
                stroke="#6b7280"
                strokeDasharray="5 5"
                fill={`url(#investedGradient-${gid})`}
                strokeWidth={2}
                name="Invested Capital"
              />
              
              {/* Mark-to-Market Value */}
              {(dcaMode === 'both' || dcaMode === 'markToMarket') && (
                <Area
                  type="monotone"
                  dataKey="valueMTM"
                  stroke="#3b82f6"
                  fill={`url(#mtmGradient-${gid})`}
                  strokeWidth={2}
                  name="Mark-to-Market Value"
                />
              )}
              
              {/* ToDate Value */}
              {(dcaMode === 'both' || dcaMode === 'toDate') && (
                <Area
                  type="monotone"
                  dataKey="valueToDate"
                  stroke="#f97316"
                  fill={`url(#todateGradient-${gid})`}
                  strokeWidth={3}
                  name="ToDate Value"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'pnl-dollar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" className="text-sm" />
              <YAxis tickFormatter={formatCurrencyAmount} className="text-sm" />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Zero line */}
              <Line
                type="monotone"
                dataKey={() => 0}
                stroke="#6b7280"
                strokeDasharray="3 3"
                strokeWidth={1}
                dot={false}
                name="Break Even"
              />
              
              {/* Mark-to-Market P&L */}
              {(dcaMode === 'both' || dcaMode === 'markToMarket') && (
                <Line
                  type="monotone"
                  dataKey="pnlMTM"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  name="Mark-to-Market P&L"
                />
              )}
              
              {/* ToDate P&L */}
              {(dcaMode === 'both' || dcaMode === 'toDate') && (
                <Line
                  type="monotone"
                  dataKey="pnlToDate"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                  name="ToDate P&L"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pnl-percent':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" className="text-sm" />
              <YAxis 
                tickFormatter={(value) => `${value.toFixed(1)}%`} 
                className="text-sm" 
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Zero line */}
              <Line
                type="monotone"
                dataKey={() => 0}
                stroke="#6b7280"
                strokeDasharray="3 3"
                strokeWidth={1}
                dot={false}
                name="Break Even"
              />
              
              {/* Mark-to-Market P&L % */}
              {(dcaMode === 'both' || dcaMode === 'markToMarket') && (
                <Line
                  type="monotone"
                  dataKey="pnlPercentMTM"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  name="Mark-to-Market P&L %"
                />
              )}
              
              {/* ToDate P&L % */}
              {(dcaMode === 'both' || dcaMode === 'toDate') && (
                <Line
                  type="monotone"
                  dataKey="pnlPercentToDate"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                  name="ToDate P&L %"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'comparison':
        return (
          <div className="space-y-6">
            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 font-medium text-gray-900 dark:text-white">Mode / Metric</th>
                    <th className="text-right py-3 font-medium text-gray-900 dark:text-white">Portfolio Value</th>
                    <th className="text-right py-3 font-medium text-gray-900 dark:text-white">P&L in {targetFiat}</th>
                    <th className="text-right py-3 font-medium text-gray-900 dark:text-white">P&L in %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {performanceData.length > 0 && (
                    <>
                      <tr>
                        <td className="py-3 text-blue-600 dark:text-blue-400 font-medium">Mark-to-Market</td>
                        <td className="py-3 text-right text-gray-900 dark:text-white">
                          {formatCurrencyAmount(performanceData[performanceData.length - 1].valueMTM)}
                        </td>
                        <td className={`py-3 text-right font-medium ${
                          performanceData[performanceData.length - 1].pnlMTM >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrencyAmount(performanceData[performanceData.length - 1].pnlMTM)}
                        </td>
                        <td className={`py-3 text-right font-medium ${
                          performanceData[performanceData.length - 1].pnlPercentMTM >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatPercent(performanceData[performanceData.length - 1].pnlPercentMTM)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 text-orange-600 dark:text-orange-400 font-medium">ToDate (default)</td>
                        <td className="py-3 text-right text-gray-900 dark:text-white">
                          {formatCurrencyAmount(performanceData[performanceData.length - 1].valueToDate)}
                        </td>
                        <td className={`py-3 text-right font-medium ${
                          performanceData[performanceData.length - 1].pnlToDate >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrencyAmount(performanceData[performanceData.length - 1].pnlToDate)}
                        </td>
                        <td className={`py-3 text-right font-medium ${
                          performanceData[performanceData.length - 1].pnlPercentToDate >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatPercent(performanceData[performanceData.length - 1].pnlPercentToDate)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 text-gray-600 dark:text-gray-400 font-medium">Invested Capital</td>
                        <td className="py-3 text-right text-gray-900 dark:text-white">
                          {formatCurrencyAmount(performanceData[performanceData.length - 1].runningInvested)}
                        </td>
                        <td className="py-3 text-right text-gray-500 dark:text-gray-400">—</td>
                        <td className="py-3 text-right text-gray-500 dark:text-gray-400">—</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Definitions */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Definitions & Formulas
              </h4>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Mark-to-Market:</span> Portfolio value using historical BTC price at each purchase date. Shows &ldquo;what was it worth then?&rdquo;
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">ToDate:</span> Portfolio value using today&apos;s BTC price. Shows &ldquo;what would those coins be worth if I stopped DCA at that point?&rdquo;
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Invested Capital:</span> Cumulative fiat spent (baseline for P&L calculations).
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (purchases.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 sm:mb-0">
            Portfolio Performance Analysis
          </h3>
          
          {/* Chart Type Selector */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setChartType('portfolio-value')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === 'portfolio-value'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-1" />
              Portfolio Value
            </button>
            <button
              onClick={() => setChartType('pnl-dollar')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === 'pnl-dollar'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              P&L ({targetFiat})
            </button>
            <button
              onClick={() => setChartType('pnl-percent')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === 'pnl-percent'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4 inline mr-1" />
              P&L (%)
            </button>
            <button
              onClick={() => setChartType('comparison')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === 'comparison'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Comparison
            </button>
          </div>
        </div>

        {/* DCA Mode Selector (for chart views) */}
        {chartType !== 'comparison' && (
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setDcaMode('both')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  dcaMode === 'both'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Both
              </button>
              <button
                onClick={() => setDcaMode('markToMarket')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  dcaMode === 'markToMarket'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Mark-to-Market Only
              </button>
              <button
                onClick={() => setDcaMode('toDate')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  dcaMode === 'toDate'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                ToDate Only
              </button>
            </div>
          </div>
        )}
      </div>

      {renderChart()}
    </div>
  );
}