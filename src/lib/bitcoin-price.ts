export interface BitcoinPrice {
  usd: number;
  usd_24h_change: number;
  last_updated_at: number;
}

export interface PriceHistory {
  prices: [number, number][]; // [timestamp, price]
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export async function getCurrentBitcoinPrice(): Promise<BitcoinPrice | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.bitcoin) {
      throw new Error('Invalid response format');
    }
    
    return {
      usd: data.bitcoin.usd,
      usd_24h_change: data.bitcoin.usd_24h_change || 0,
      last_updated_at: data.bitcoin.last_updated_at,
    };
  } catch (error) {
    console.error('Failed to fetch Bitcoin price:', error);
    return null;
  }
}

export async function getBitcoinPriceHistory(days: number = 30): Promise<PriceHistory | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price history: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.prices) {
      throw new Error('Invalid response format');
    }
    
    return {
      prices: data.prices,
    };
  } catch (error) {
    console.error('Failed to fetch Bitcoin price history:', error);
    return null;
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPriceChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}