'use client';

import { useState } from 'react';
import { Settings, ChevronDown, Check } from 'lucide-react';

// Common fiat currencies
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
];

export interface CurrencySettingsProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  availableCurrencies?: string[]; // Currencies detected in the data
}

export default function CurrencySettings({ 
  selectedCurrency, 
  onCurrencyChange,
  availableCurrencies = []
}: CurrencySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get currency info for display
  const getCurrencyInfo = (code: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    return currency || { code, name: code, symbol: code };
  };

  // Note: allCurrencies logic could be used for advanced filtering if needed

  const selectedCurrencyInfo = getCurrencyInfo(selectedCurrency);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-gray-700 dark:text-gray-300">
          {selectedCurrencyInfo.symbol} {selectedCurrencyInfo.code}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Display Currency
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose the currency for displaying portfolio metrics
              </p>
            </div>

            {availableCurrencies.length > 0 && (
              <>
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
                    DETECTED IN YOUR DATA
                  </div>
                  {availableCurrencies.map((currency) => {
                    const currencyInfo = getCurrencyInfo(currency);
                    return (
                      <button
                        key={currency}
                        onClick={() => {
                          onCurrencyChange(currency);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currencyInfo.symbol}</span>
                          <span>{currencyInfo.name}</span>
                          <span className="text-gray-500 dark:text-gray-400">({currencyInfo.code})</span>
                        </div>
                        {selectedCurrency === currency && (
                          <Check className="w-4 h-4 text-orange-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700" />
              </>
            )}

            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
                OTHER CURRENCIES
              </div>
              {SUPPORTED_CURRENCIES
                .filter(currency => !availableCurrencies.includes(currency.code))
                .map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      onCurrencyChange(currency.code);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{currency.symbol}</span>
                      <span>{currency.name}</span>
                      <span className="text-gray-500 dark:text-gray-400">({currency.code})</span>
                    </div>
                    {selectedCurrency === currency.code && (
                      <Check className="w-4 h-4 text-orange-500" />
                    )}
                  </button>
                ))}
            </div>

            {/* Note about conversion */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong>Note:</strong> Currency conversion uses historical USD rates when available. 
                Mixed currency data without conversion rates will fall back to USD-based calculations.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}