import { SUPPORTED_CURRENCIES } from '@/components/currency-settings';

const CURRENCY_STORAGE_KEY = 'bitcoin-dca-selected-currency';

// Save selected currency to localStorage
export function saveSelectedCurrency(currency: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }
}

// Load selected currency from localStorage
export function loadSelectedCurrency(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(CURRENCY_STORAGE_KEY) || 'USD';
  }
  return 'USD';
}

// Get currency info for formatting
export function getCurrencyInfo(code: string) {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
  return currency || { code, name: code, symbol: code };
}

// Format amount in the specified currency
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const currencyInfo = getCurrencyInfo(currencyCode);
  
  try {
    // Use Intl.NumberFormat for proper currency formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if currency is not supported by Intl.NumberFormat
    return `${currencyInfo.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

// Simple FX rate provider interface for future extension
export interface SimpleFXProvider {
  getRate: (from: string, to: string, date?: string) => number | null;
}

// Mock FX provider for demonstration (in real app, this would call an API)
export class MockFXProvider implements SimpleFXProvider {
  private rates: Record<string, Record<string, number>> = {
    'USD': { 'EUR': 0.85, 'GBP': 0.73, 'CAD': 1.25, 'AUD': 1.35, 'JPY': 110, 'CHF': 0.92 },
    'EUR': { 'USD': 1.18, 'GBP': 0.86, 'CAD': 1.47, 'AUD': 1.59, 'JPY': 129, 'CHF': 1.08 },
    'GBP': { 'USD': 1.37, 'EUR': 1.16, 'CAD': 1.71, 'AUD': 1.85, 'JPY': 151, 'CHF': 1.26 },
  };

  getRate(from: string, to: string): number | null {
    if (from === to) return 1;
    
    // Try direct rate
    if (this.rates[from] && this.rates[from][to]) {
      return this.rates[from][to];
    }
    
    // Try inverse rate
    if (this.rates[to] && this.rates[to][from]) {
      return 1 / this.rates[to][from];
    }
    
    // For unsupported currencies, return null so we fall back to USD
    return null;
  }
}