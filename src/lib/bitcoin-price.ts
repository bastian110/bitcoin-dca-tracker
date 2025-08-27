export interface BitcoinPrice {
  price: number;
  price_24h_change: number;
  currency: string;
  last_updated_at: number;
  // Keep USD for backward compatibility with portfolio calculations
  usd?: number;
  usd_24h_change?: number;
}

export interface PriceHistory {
  prices: [number, number][]; // [timestamp, price]
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export async function getCurrentBitcoinPrice(currency: string = 'usd'): Promise<BitcoinPrice | null> {
  try {
    // Always fetch USD for portfolio calculations + the requested currency if different
    const currencies = currency.toLowerCase() === 'usd' ? 'usd' : `usd,${currency.toLowerCase()}`;
    
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=bitcoin&vs_currencies=${currencies}&include_24hr_change=true&include_last_updated_at=true`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.bitcoin) {
      throw new Error('Invalid response format');
    }
    
    const currencyLower = currency.toLowerCase();
    const requestedPrice = data.bitcoin[currencyLower];
    const requestedChange = data.bitcoin[`${currencyLower}_24h_change`];
    
    if (requestedPrice === undefined) {
      throw new Error(`Price not available for currency: ${currency}`);
    }
    
    return {
      price: requestedPrice,
      price_24h_change: requestedChange || 0,
      currency: currency.toUpperCase(),
      last_updated_at: data.bitcoin.last_updated_at,
      // Always include USD for backward compatibility
      usd: data.bitcoin.usd,
      usd_24h_change: data.bitcoin.usd_24h_change || 0,
    };
  } catch (error) {
    console.error('Failed to fetch Bitcoin price:', error);
    return null;
  }
}

export async function getBitcoinPriceHistory(days: number = 30, currency: string = 'usd'): Promise<PriceHistory | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/bitcoin/market_chart?vs_currency=${currency.toLowerCase()}&days=${days}&interval=daily`
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

export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPriceChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}