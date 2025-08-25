'use client';

import { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { BitcoinPurchase } from '@/lib/types';

export type TimeFilter = 'all' | '7d' | '30d' | '90d' | '1y' | 'custom';

interface TimeFilterProps {
  purchases: BitcoinPurchase[];
  onFilterChange: (filteredPurchases: BitcoinPurchase[], filter: TimeFilter) => void;
  className?: string;
}

export default function TimeFilter({ purchases, onFilterChange, className = '' }: TimeFilterProps) {
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'All Time', description: 'Show all purchases' },
    { value: '7d', label: '7 Days', description: 'Last 7 days' },
    { value: '30d', label: '30 Days', description: 'Last 30 days' },
    { value: '90d', label: '90 Days', description: 'Last 90 days' },
    { value: '1y', label: '1 Year', description: 'Last 12 months' },
    { value: 'custom', label: 'Custom', description: 'Select date range' },
  ] as const;

  const getFilteredPurchases = (filter: TimeFilter, startDate?: string, endDate?: string): BitcoinPurchase[] => {
    if (filter === 'all') {
      return purchases;
    }

    const now = new Date();
    let cutoffDate: Date;

    switch (filter) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (startDate && endDate) {
          return purchases.filter(purchase => {
            const purchaseDate = new Date(purchase.date);
            return purchaseDate >= new Date(startDate) && purchaseDate <= new Date(endDate);
          });
        }
        return purchases;
      default:
        return purchases;
    }

    return purchases.filter(purchase => new Date(purchase.date) >= cutoffDate);
  };

  const handleFilterChange = (filter: TimeFilter) => {
    setActiveFilter(filter);
    
    if (filter === 'custom') {
      setShowCustomDatePicker(true);
      return;
    }
    
    setShowCustomDatePicker(false);
    const filteredPurchases = getFilteredPurchases(filter);
    onFilterChange(filteredPurchases, filter);
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      const filteredPurchases = getFilteredPurchases('custom', customStartDate, customEndDate);
      onFilterChange(filteredPurchases, 'custom');
      setShowCustomDatePicker(false);
    }
  };

  const getFilterStats = (filter: TimeFilter) => {
    const filtered = getFilteredPurchases(filter, customStartDate, customEndDate);
    const totalValue = filtered.reduce((sum, p) => sum + (p.amount_btc * p.price_usd), 0);
    const totalBTC = filtered.reduce((sum, p) => sum + p.amount_btc, 0);
    
    return {
      count: filtered.length,
      totalValue,
      totalBTC,
    };
  };

  const currentStats = getFilterStats(activeFilter);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Time Period Filter</h3>
        </div>
        
        {activeFilter !== 'all' && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {currentStats.count} purchases • ₿{currentStats.totalBTC.toFixed(4)} • ${currentStats.totalValue.toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFilterChange(option.value)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              activeFilter === option.value
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="font-medium text-gray-900 dark:text-white text-sm">
              {option.label}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {option.description}
            </div>
            {option.value !== 'all' && option.value !== 'custom' && (
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {getFilterStats(option.value).count} purchases
              </div>
            )}
          </button>
        ))}
      </div>

      {showCustomDatePicker && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                From:
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                To:
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <button
              onClick={handleCustomDateApply}
              disabled={!customStartDate || !customEndDate}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors"
            >
              Apply
            </button>
            
            <button
              onClick={() => {
                setShowCustomDatePicker(false);
                setActiveFilter('all');
                onFilterChange(purchases, 'all');
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeFilter !== 'all' && !showCustomDatePicker && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <span>
            Showing {currentStats.count} of {purchases.length} purchases
            {activeFilter === 'custom' && customStartDate && customEndDate && (
              <span className="ml-2">
                ({new Date(customStartDate).toLocaleDateString()} - {new Date(customEndDate).toLocaleDateString()})
              </span>
            )}
          </span>
          <button
            onClick={() => {
              setActiveFilter('all');
              onFilterChange(purchases, 'all');
              setShowCustomDatePicker(false);
            }}
            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
}