import { 
  BitcoinPurchase, 
  PortfolioMetrics, 
  MetricOptions, 
  CurrencyOptions, 
  DCAOptions, 
  DCAPerformancePoint
} from './types';

// Utility function to detect FIAT currencies in purchase data (excludes cryptocurrencies)
export function detectCurrenciesInPurchases(purchases: BitcoinPurchase[]): string[] {
  const currencies = new Set<string>();
  
  // Known cryptocurrencies to exclude
  const cryptoCurrencies = new Set(['BTC', 'Bitcoin', 'ETH', 'Ethereum', 'USDC', 'USDT', 'Tether']);
  
  purchases.forEach(p => {
    // Add currencies from various fields, but filter out known cryptocurrencies
    if (p.fiat_currency && !cryptoCurrencies.has(p.fiat_currency)) {
      currencies.add(p.fiat_currency);
    }
    if (p.currency_sent && !cryptoCurrencies.has(p.currency_sent)) {
      currencies.add(p.currency_sent);
    }
    if (p.currency_received && !cryptoCurrencies.has(p.currency_received)) {
      currencies.add(p.currency_received);
    }
    if (p.fee_currency && !cryptoCurrencies.has(p.fee_currency)) {
      currencies.add(p.fee_currency);
    }
    
    // Always include USD if price_usd or fee_usd is present
    if (p.price_usd > 0 || (p.fee_usd && p.fee_usd > 0)) {
      currencies.add('USD');
    }
  });
  
  // Remove empty/null values, filter out any remaining crypto currencies, and sort
  return Array.from(currencies)
    .filter(Boolean)
    .filter(currency => !cryptoCurrencies.has(currency))
    .sort((a, b) => {
      // Prioritize USD first, then alphabetical
      if (a === 'USD') return -1;
      if (b === 'USD') return 1;
      return a.localeCompare(b);
    });
}

// Utility function to safely convert unknown values to numbers
const num = (x: unknown, d = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
};

// Helper function to convert price from one currency to target currency
export function convertPriceToTarget(
  price: number,
  priceCur: string,
  target: string,
  fx?: { getRate: (from: string, to: string, date?: string) => number | null } | null,
  date?: string
): number {
  if (priceCur === target) return price;
  if (!fx) throw new Error(`FX required to convert ${priceCur}->${target}`);
  const r = fx.getRate(priceCur, target, date) ?? fx.getRate(priceCur, target);
  if (!r) throw new Error(`Missing FX ${priceCur}->${target} on ${date ?? 'n/a'}`);
  return price * r;
}

// Row cost calculation functions for currency normalization
function rowCostFiatExclFees(p: BitcoinPurchase, options?: CurrencyOptions): number {
  const targetFiat = options?.fiat ?? 'USD';
  const fx = options?.fx ?? null;
  
  // Priority: explicit fiat_amount; else amount_btc * price_fiat; else price_usd.
  const rowFiat = num(
    p.fiat_amount,
    num(p.amount_btc) * (num(p.price_fiat) || num(p.price_usd))
  );
  
  const from = p.fiat_currency || (p.price_fiat ? p.fiat_currency : 'USD');
  if (!from || from === targetFiat) return rowFiat;

  // If no FX provider, fall back to USD-based calculation for backwards compatibility
  if (!fx) {
    console.warn(`Mixed currencies detected (${from} -> ${targetFiat}) but no FX provider available. Falling back to USD-based calculation.`);
    // Use price_usd as fallback
    return num(p.amount_btc) * num(p.price_usd);
  }
  
  const rate = fx.getRate(from, targetFiat, p.date) ?? fx.getRate(from, targetFiat);
  if (!rate) {
    console.warn(`Missing FX rate ${from}->${targetFiat} for ${p.date ?? 'n/a'}. Falling back to USD-based calculation.`);
    // Use price_usd as fallback
    return num(p.amount_btc) * num(p.price_usd);
  }
  return rowFiat * rate;
}

function rowFeeFiat(p: BitcoinPurchase, options?: CurrencyOptions): number {
  const targetFiat = options?.fiat ?? 'USD';
  const fx = options?.fx ?? null;
  
  // fee may be in p.fee_fiat with currency; else fee_usd; else 0
  const from = p.fee_currency || (p.fiat_currency ?? 'USD');
  const fee = num(p.fee_fiat, num(p.fee_usd));
  if (!fee) return 0;
  if (from === targetFiat) return fee;
  
  // If no FX provider, fall back to fee_usd for backwards compatibility
  if (!fx) {
    console.warn(`Mixed currencies detected for fee (${from} -> ${targetFiat}) but no FX provider available. Falling back to USD-based calculation.`);
    return num(p.fee_usd);
  }
  
  const rate = fx.getRate(from, targetFiat, p.date) ?? fx.getRate(from, targetFiat);
  if (!rate) {
    console.warn(`Missing FX rate ${from}->${targetFiat} for fee on ${p.date ?? 'n/a'}. Falling back to USD-based calculation.`);
    return num(p.fee_usd);
  }
  return fee * rate;
}

export function calculatePortfolioMetrics(
  purchases: BitcoinPurchase[], 
  currentBTCPrice: number,
  options?: MetricOptions & CurrencyOptions
): PortfolioMetrics {
  const targetFiat = options?.fiat ?? 'USD';
  const priceCur = options?.currentPriceCurrency ?? 'USD';
  if (purchases.length === 0) {
    return {
      totalBTC: 0,
      totalInvested: 0,
      averageCostBasis: 0,
      currentValue: 0,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      totalFees: 0,
      purchaseCount: 0,
      firstPurchaseDate: '',
      lastPurchaseDate: '',
      totalFiatAmount: 0,
      primaryFiatCurrency: targetFiat,
      averageEffectivePrice: 0,
      feeAsPercentOfInvestment: 0,
      exchangeBreakdown: {},
      transactionTypeBreakdown: {},
      currencyBreakdown: {},
      hasTransactionHashes: false,
      hasAddresses: false,
      timezoneMostUsed: null,
      largestPurchase: { amount: 0, date: '', price: 0 },
      smallestPurchase: { amount: 0, date: '', price: 0 },
      largestPurchaseBTC: { amountBTC: 0, date: '' },
      smallestPurchaseBTC: { amountBTC: 0, date: '' },
      largestPurchaseFiat: { amountFiat: 0, date: '' },
      smallestPurchaseFiat: { amountFiat: 0, date: '' },
      averageExecutionPrice: 0,
      averageEffectiveCostBasis: 0,
      targetFiat,
    };
  }

  // Sort purchases by date to ensure correct chronological order
  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate basic totals using enhanced logic
  const totalBTC = sortedPurchases.reduce((sum, p) => sum + num(p.amount_btc), 0);
  const totalCostFiatExclFees = sortedPurchases.reduce((sum, p) => sum + rowCostFiatExclFees(p, options), 0);
  const totalFeesFiat = sortedPurchases.reduce((sum, p) => sum + rowFeeFiat(p, options), 0);
  const totalInvestedFiat = totalCostFiatExclFees + totalFeesFiat;

  // Calculate both execution and effective average prices
  const averageExecutionPrice = totalBTC > 0 ? totalCostFiatExclFees / totalBTC : 0;
  const averageEffectiveCostBasis = totalBTC > 0 ? (totalCostFiatExclFees + totalFeesFiat) / totalBTC : 0;

  // Choose basis based on options
  const averageCostBasis = options?.basis === 'execution'
    ? averageExecutionPrice
    : averageEffectiveCostBasis;

  // Calculate current value and P&L with proper currency conversion
  const btcForValuation = totalBTC; // NOTE: using purchased BTC (no lot/withdrawal adjustment yet)
  
  // Convert current BTC price to target fiat currency
  const currentPriceFiat = convertPriceToTarget(
    num(currentBTCPrice),
    priceCur,
    targetFiat,
    options?.fx,
    sortedPurchases[sortedPurchases.length - 1]?.date // Use last purchase date for FX rate
  );
  
  const currentValue = btcForValuation * currentPriceFiat;
  const totalInvested = options?.basis === 'execution' ? totalCostFiatExclFees : totalInvestedFiat;
  const unrealizedPnL = currentValue - totalInvested;
  const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

  // Get date range
  const firstPurchaseDate = sortedPurchases[0].date;
  const lastPurchaseDate = sortedPurchases[sortedPurchases.length - 1].date;

  // Enhanced metrics calculations (using normalized values)
  const totalFiatAmount = totalCostFiatExclFees; // Renamed for clarity
  const feeAsPercentOfInvestment = totalInvestedFiat > 0 ? (totalFeesFiat / totalInvestedFiat) * 100 : 0;
  
  // Currency analysis - build fiat map first, then pick max
  const fiatMap = sortedPurchases.reduce((m, p) => {
    const cur = p.fiat_currency || p.currency_sent || 'USD';
    const amt = rowCostFiatExclFees(p, options);
    m[cur] = (m[cur] || 0) + amt;
    return m;
  }, {} as Record<string, number>);

  const primaryFiatCurrency =
    Object.keys(fiatMap).length === 0
      ? targetFiat
      : Object.entries(fiatMap).reduce((max, [k, v]) => (v > max[1] ? [k, v] : max))[0];
  
  // Exchange breakdown
  const exchangeBreakdown: Record<string, { count: number; totalBTC: number; totalFiat: number; avgPrice: number }> = {};
  sortedPurchases.forEach(p => {
    const exchange = p.exchange || p.description || 'Unknown';
    if (!exchangeBreakdown[exchange]) {
      exchangeBreakdown[exchange] = { count: 0, totalBTC: 0, totalFiat: 0, avgPrice: 0 };
    }
    exchangeBreakdown[exchange].count++;
    exchangeBreakdown[exchange].totalBTC += num(p.amount_btc);
    exchangeBreakdown[exchange].totalFiat += rowCostFiatExclFees(p, options);
    exchangeBreakdown[exchange].avgPrice = exchangeBreakdown[exchange].totalBTC > 0 
      ? exchangeBreakdown[exchange].totalFiat / exchangeBreakdown[exchange].totalBTC 
      : 0;
  });
  
  // Transaction type breakdown
  const transactionTypeBreakdown: Record<string, number> = {};
  sortedPurchases.forEach(p => {
    const type = p.type || 'Purchase';
    transactionTypeBreakdown[type] = (transactionTypeBreakdown[type] || 0) + 1;
  });
  
  // Currency breakdown detailed
  const currencyBreakdown: Record<string, { totalAmount: number; purchaseCount: number }> = {};
  sortedPurchases.forEach(p => {
    const currency = p.fiat_currency || p.currency_sent || 'USD';
    if (!currencyBreakdown[currency]) {
      currencyBreakdown[currency] = { totalAmount: 0, purchaseCount: 0 };
    }
    currencyBreakdown[currency].totalAmount += rowCostFiatExclFees(p, options);
    currencyBreakdown[currency].purchaseCount++;
  });
  
  // Data completeness analysis
  const hasTransactionHashes = sortedPurchases.some(p => p.transaction_hash);
  const hasAddresses = sortedPurchases.some(p => p.address);
  
  // Timezone analysis
  const timezones = sortedPurchases.map(p => p.timezone).filter(Boolean);
  const timezoneCounts = timezones.reduce((acc, tz) => {
    acc[tz!] = (acc[tz!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const timezoneMostUsed = Object.keys(timezoneCounts).length > 0 
    ? Object.keys(timezoneCounts).reduce((a, b) => timezoneCounts[a] > timezoneCounts[b] ? a : b)
    : null;
  
  // Purchase size analysis (both BTC and fiat)
  const byBTC = sortedPurchases.map(p => ({ amountBTC: num(p.amount_btc), date: p.date }));
  const byFiat = sortedPurchases.map(p => ({ amountFiat: rowCostFiatExclFees(p, options), date: p.date }));

  const largestPurchaseBTC = byBTC.reduce((m, c) => c.amountBTC > m.amountBTC ? c : m, byBTC[0]);
  const smallestPurchaseBTC = byBTC.reduce((m, c) => c.amountBTC < m.amountBTC ? c : m, byBTC[0]);

  const largestPurchaseFiat = byFiat.reduce((m, c) => c.amountFiat > m.amountFiat ? c : m, byFiat[0]);
  const smallestPurchaseFiat = byFiat.reduce((m, c) => c.amountFiat < m.amountFiat ? c : m, byFiat[0]);

  // Backwards compatible purchase analysis
  const purchaseAmounts = sortedPurchases.map(p => ({
    amount: num(p.amount_btc),
    date: p.date,
    price: num(p.effective_price) || num(p.price_usd),
  }));
  
  const largestPurchase = purchaseAmounts.reduce((max, current) => 
    current.amount > max.amount ? current : max
  );
  
  const smallestPurchase = purchaseAmounts.reduce((min, current) => 
    current.amount < min.amount ? current : min
  );

  return {
    // Core metrics (backwards compatible)
    totalBTC,
    totalInvested,
    averageCostBasis,
    currentValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    totalFees: totalFeesFiat,
    purchaseCount: purchases.length,
    firstPurchaseDate,
    lastPurchaseDate,
    
    // Enhanced metrics
    totalFiatAmount,
    primaryFiatCurrency,
    averageEffectivePrice: averageEffectiveCostBasis,
    feeAsPercentOfInvestment,
    exchangeBreakdown,
    transactionTypeBreakdown,
    currencyBreakdown,
    hasTransactionHashes,
    hasAddresses,
    timezoneMostUsed,
    largestPurchase,
    smallestPurchase,
    
    // New enhanced purchase size metrics
    largestPurchaseBTC,
    smallestPurchaseBTC,
    largestPurchaseFiat,
    smallestPurchaseFiat,
    
    // Enhanced cost basis metrics
    averageExecutionPrice,
    averageEffectiveCostBasis,
    
    // Currency normalization info
    targetFiat,
  };
}

export function calculateDCAPerformance(
  purchases: BitcoinPurchase[],
  currentBTCPrice: number,
  options?: DCAOptions
): DCAPerformancePoint[] {
  if (purchases.length === 0) return [];

  const mode = options?.mode ?? 'toDate';
  const getHist = options?.getHistoricalPrice;
  const targetFiat = options?.fiat ?? 'USD';
  const priceCur = options?.currentPriceCurrency ?? 'USD';

  let runningBTC = 0;
  let runningCostFiatExclFees = 0;
  let runningFeesFiat = 0;

  return purchases
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p, i) => {
      const rowFiat = rowCostFiatExclFees(p, options);
      const rowFee = rowFeeFiat(p, options);

      runningBTC += num(p.amount_btc);
      runningCostFiatExclFees += rowFiat;
      runningFeesFiat += rowFee;

      const runningInvested = (options?.basis === 'execution'
        ? runningCostFiatExclFees
        : runningCostFiatExclFees + runningFeesFiat);

      const priceForPoint =
        mode === 'markToMarket'
          ? (() => {
              if (!getHist) throw new Error('getHistoricalPrice required for markToMarket');
              // Historical price is assumed to be in target fiat (simplest approach)
              // If it's in a different currency, you would need getHistoricalPriceWithCurrency
              return num(getHist(p.date));
            })()
          : convertPriceToTarget(num(currentBTCPrice), priceCur, targetFiat, options?.fx, p.date);

      const currentValue = runningBTC * priceForPoint;
      const unrealizedPnL = currentValue - runningInvested;
      const unrealizedPnLPercent = runningInvested > 0 ? (unrealizedPnL / runningInvested) * 100 : 0;

      const avgCostBasis =
        options?.basis === 'execution'
          ? (runningBTC > 0 ? runningCostFiatExclFees / runningBTC : 0)
          : (runningBTC > 0 ? (runningCostFiatExclFees + runningFeesFiat) / runningBTC : 0);

      return {
        date: p.date,
        purchaseIndex: i + 1,
        runningBTC,
        runningInvested,
        avgCostBasis,
        priceUsed: priceForPoint,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
      };
    });
}