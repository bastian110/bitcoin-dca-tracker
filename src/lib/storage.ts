import { BitcoinPurchase } from './types';

const STORAGE_KEY = 'bitcoin-dca-portfolio-data';
const SETTINGS_KEY = 'bitcoin-dca-settings';

export interface StoredPortfolio {
  purchases: BitcoinPurchase[];
  lastUpdated: string;
  version: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: 'USD';
  autosave: boolean;
  showAdvancedMetrics: boolean;
  chartDefaultType: 'value' | 'pnl' | 'cost-basis';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  currency: 'USD',
  autosave: true,
  showAdvancedMetrics: true,
  chartDefaultType: 'value',
};

export function savePortfolioData(purchases: BitcoinPurchase[]): boolean {
  try {
    const data: StoredPortfolio = {
      purchases,
      lastUpdated: new Date().toISOString(),
      version: '1.0',
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save portfolio data:', error);
    return false;
  }
}

export function loadPortfolioData(): BitcoinPurchase[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data: StoredPortfolio = JSON.parse(stored);
    
    // Validate data structure
    if (!data.purchases || !Array.isArray(data.purchases)) {
      return null;
    }
    
    return data.purchases;
  } catch (error) {
    console.error('Failed to load portfolio data:', error);
    return null;
  }
}

export function clearPortfolioData(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear portfolio data:', error);
    return false;
  }
}

export function getStorageInfo(): { hasData: boolean; lastUpdated?: string; dataSize?: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { hasData: false };
    
    const data: StoredPortfolio = JSON.parse(stored);
    return {
      hasData: true,
      lastUpdated: data.lastUpdated,
      dataSize: stored.length,
    };
  } catch {
    return { hasData: false };
  }
}

export function saveSettings(settings: Partial<AppSettings>): boolean {
  try {
    const currentSettings = loadSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const settings = JSON.parse(stored);
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function exportAllData(): string {
  const portfolioData = localStorage.getItem(STORAGE_KEY);
  const settings = localStorage.getItem(SETTINGS_KEY);
  
  return JSON.stringify({
    portfolio: portfolioData ? JSON.parse(portfolioData) : null,
    settings: settings ? JSON.parse(settings) : null,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function importAllData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.portfolio) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.portfolio));
    }
    
    if (data.settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
}