'use client';

import { useState, useEffect } from 'react';
import CSVUpload from '@/components/csv-upload';
import PortfolioChart from '@/components/portfolio-chart';
import AdvancedMetrics from '@/components/advanced-metrics';
import DataExport from '@/components/data-export';
import TimeFilter, { TimeFilter as TimeFilterType } from '@/components/time-filter';
import EnhancedAnalytics from '@/components/enhanced-analytics';
import PortfolioComparison from '@/components/portfolio-comparison';
import { DashboardLoadingState } from '@/components/loading-states';
import { BitcoinPurchase, PortfolioMetrics } from '@/lib/types';
import { calculatePortfolioMetrics, detectCurrenciesInPurchases } from '@/lib/portfolio-calculator';
import { getCurrentBitcoinPrice, formatPrice, formatPriceChange, BitcoinPrice } from '@/lib/bitcoin-price';
import { savePortfolioData, loadPortfolioData, clearPortfolioData } from '@/lib/storage';
import { saveSelectedCurrency, loadSelectedCurrency, formatCurrency as formatCurrencyUtil, MockFXProvider } from '@/lib/currency';
import CurrencySettings from '@/components/currency-settings';

export default function Dashboard() {
  const [purchases, setPurchases] = useState<BitcoinPurchase[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [bitcoinPrice, setBitcoinPrice] = useState<BitcoinPrice | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [filteredPurchases, setFilteredPurchases] = useState<BitcoinPurchase[]>([]);
  const [activeTimeFilter, setActiveTimeFilter] = useState<TimeFilterType>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [fxProvider] = useState(new MockFXProvider());

  // Load stored data and currency preference on component mount
  useEffect(() => {
    const storedPurchases = loadPortfolioData();
    if (storedPurchases && storedPurchases.length > 0) {
      setPurchases(storedPurchases);
    }
    
    // Load saved currency preference
    const savedCurrency = loadSelectedCurrency();
    setSelectedCurrency(savedCurrency);
  }, []);
  
  // Update available currencies when purchases change
  useEffect(() => {
    if (purchases.length > 0) {
      const detected = detectCurrenciesInPurchases(purchases);
      setAvailableCurrencies(detected);
    } else {
      setAvailableCurrencies([]);
    }
  }, [purchases]);

  // Fetch Bitcoin price on component mount
  useEffect(() => {
    const fetchPrice = async () => {
      setPriceLoading(true);
      const price = await getCurrentBitcoinPrice();
      setBitcoinPrice(price);
      setPriceLoading(false);
    };
    
    fetchPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize filtered purchases
  useEffect(() => {
    setFilteredPurchases(purchases);
  }, [purchases]);

  // Recalculate metrics when filtered purchases, price, or currency changes
  useEffect(() => {
    if (filteredPurchases.length > 0 && bitcoinPrice) {
      const calculatedMetrics = calculatePortfolioMetrics(
        filteredPurchases, 
        bitcoinPrice.usd,
        {
          fiat: selectedCurrency,
          fx: fxProvider,
        }
      );
      setMetrics(calculatedMetrics);
    } else if (filteredPurchases.length === 0) {
      setMetrics(null);
    }
  }, [filteredPurchases, bitcoinPrice, selectedCurrency, fxProvider]);

  // Auto-save purchases to localStorage
  useEffect(() => {
    if (purchases.length > 0) {
      savePortfolioData(purchases);
    }
  }, [purchases]);

  const handleDataParsed = (data: BitcoinPurchase[]) => {
    setPurchases(data);
    setFilteredPurchases(data);
  };

  const handleTimeFilterChange = (filtered: BitcoinPurchase[], filter: TimeFilterType) => {
    setFilteredPurchases(filtered);
    setActiveTimeFilter(filter);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all portfolio data? This action cannot be undone.')) {
      setPurchases([]);
      setMetrics(null);
      clearPortfolioData();
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    saveSelectedCurrency(currency);
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, selectedCurrency);
  };

  const formatBTC = (amount: number) => {
    return `₿${amount.toFixed(8)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (purchases.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bitcoin DCA Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Upload your purchase history to analyze your Bitcoin DCA performance
            </p>
          </div>
          <CSVUpload onDataParsed={handleDataParsed} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Portfolio Overview
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-gray-600 dark:text-gray-300">
                {purchases.length} purchases • {filteredPurchases.length} shown
                {activeTimeFilter !== 'all' && (
                  <span className="ml-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                    {activeTimeFilter}
                  </span>
                )}
              </p>
              {bitcoinPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">BTC Price:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(bitcoinPrice.usd)}
                  </span>
                  <span className={`text-sm font-medium ${
                    bitcoinPrice.usd_24h_change >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPriceChange(bitcoinPrice.usd_24h_change)}
                  </span>
                </div>
              )}
              {priceLoading && (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Fetching price...</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <CurrencySettings
              selectedCurrency={selectedCurrency}
              onCurrencyChange={handleCurrencyChange}
              availableCurrencies={availableCurrencies}
            />
            <button
              onClick={handleClearData}
              className="text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
            >
              Clear Data
            </button>
            <button
              onClick={() => {
                setPurchases([]);
                setMetrics(null);
              }}
              className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Upload New Data
            </button>
          </div>
        </div>

        {/* Show loading state if we have purchases but no price yet */}
        {purchases.length > 0 && !bitcoinPrice && (
          <DashboardLoadingState />
        )}

        {purchases.length > 0 && (
          <>
            {/* Time Filter */}
            <TimeFilter 
              purchases={purchases}
              onFilterChange={handleTimeFilterChange}
            />

            {metrics && bitcoinPrice && (
              <div className="space-y-8">
                {/* Advanced Metrics */}
                <AdvancedMetrics 
                  purchases={filteredPurchases} 
                  metrics={metrics} 
                  currentBTCPrice={bitcoinPrice.usd}
                  selectedCurrency={selectedCurrency}
                />

                {/* Portfolio Chart */}
                <PortfolioChart 
                  purchases={filteredPurchases} 
                  currentBTCPrice={bitcoinPrice.usd}
                  currentPriceCurrency="USD"
                  selectedCurrency={selectedCurrency}
                  currencyOptions={{
                    fiat: selectedCurrency,
                    fx: fxProvider,
                  }}
                />

                {/* Enhanced Analytics */}
                <EnhancedAnalytics 
                  purchases={filteredPurchases}
                  metrics={metrics}
                  selectedCurrency={selectedCurrency}
                />

                {/* Portfolio Comparison */}
                <PortfolioComparison 
                  purchases={purchases}
                  currentBTCPrice={bitcoinPrice.usd}
                />

                {/* Data Export */}
                <DataExport 
                  purchases={filteredPurchases} 
                  metrics={metrics} 
                  currentBTCPrice={bitcoinPrice.usd}
                  selectedCurrency={selectedCurrency}
                />
              </div>
            )}
          </>
        )}

        {metrics && (
          <>
            {/* Purchase History Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Purchase History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount (BTC)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price ({selectedCurrency})</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Cost ({selectedCurrency})</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fee ({selectedCurrency})</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Exchange</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPurchases.map((purchase, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(purchase.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatBTC(purchase.amount_btc)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(purchase.price_usd)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(purchase.amount_btc * purchase.price_usd)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(purchase.fee_usd || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {purchase.exchange || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}