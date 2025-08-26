import { BitcoinPurchase, PortfolioMetrics } from './types';

export function calculatePortfolioMetrics(
  purchases: BitcoinPurchase[], 
  currentBTCPrice: number
): PortfolioMetrics {
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
      primaryFiatCurrency: 'USD',
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
    };
  }

  // Sort purchases by date to ensure correct chronological order
  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate basic totals
  const totalBTC = sortedPurchases.reduce((sum, p) => sum + p.amount_btc, 0);
  const totalCost = sortedPurchases.reduce((sum, p) => sum + (p.amount_btc * p.price_usd), 0);
  const totalFees = sortedPurchases.reduce((sum, p) => sum + p.fee_usd, 0);
  const totalInvested = totalCost + totalFees;

  // Calculate average cost basis (weighted by BTC amount)
  const averageCostBasis = totalBTC > 0 ? totalCost / totalBTC : 0;

  // Calculate current value and P&L
  const currentValue = totalBTC * currentBTCPrice;
  const unrealizedPnL = currentValue - totalInvested;
  const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

  // Get date range
  const firstPurchaseDate = sortedPurchases[0].date;
  const lastPurchaseDate = sortedPurchases[sortedPurchases.length - 1].date;

  // Enhanced metrics calculations
  const totalFiatAmount = sortedPurchases.reduce((sum, p) => sum + (p.fiat_amount || (p.amount_btc * p.price_usd)), 0);
  const averageEffectivePrice = totalBTC > 0 ? (totalFiatAmount + totalFees) / totalBTC : 0;
  const feeAsPercentOfInvestment = totalInvested > 0 ? (totalFees / totalInvested) * 100 : 0;
  
  // Currency analysis
  const currencyBreakdown: Record<string, { totalAmount: number; purchaseCount: number }> = {};
  const primaryCurrency = sortedPurchases.reduce((currencies, p) => {
    const currency = p.fiat_currency || p.currency_sent || 'USD';
    currencies[currency] = (currencies[currency] || 0) + (p.fiat_amount || p.amount_btc * p.price_usd);
    return currencies;
  }, {} as Record<string, number>);
  
  const primaryFiatCurrency = Object.keys(primaryCurrency).reduce((a, b) => 
    primaryCurrency[a] > primaryCurrency[b] ? a : b, 'USD'
  );
  
  // Exchange breakdown
  const exchangeBreakdown: Record<string, { count: number; totalBTC: number; totalFiat: number; avgPrice: number }> = {};
  sortedPurchases.forEach(p => {
    const exchange = p.exchange || p.description || 'Unknown';
    if (!exchangeBreakdown[exchange]) {
      exchangeBreakdown[exchange] = { count: 0, totalBTC: 0, totalFiat: 0, avgPrice: 0 };
    }
    exchangeBreakdown[exchange].count++;
    exchangeBreakdown[exchange].totalBTC += p.amount_btc;
    exchangeBreakdown[exchange].totalFiat += p.fiat_amount || (p.amount_btc * p.price_usd);
    exchangeBreakdown[exchange].avgPrice = exchangeBreakdown[exchange].totalFiat / exchangeBreakdown[exchange].totalBTC;
  });
  
  // Transaction type breakdown
  const transactionTypeBreakdown: Record<string, number> = {};
  sortedPurchases.forEach(p => {
    const type = p.type || 'Purchase';
    transactionTypeBreakdown[type] = (transactionTypeBreakdown[type] || 0) + 1;
  });
  
  // Currency breakdown detailed
  sortedPurchases.forEach(p => {
    const currency = p.fiat_currency || p.currency_sent || 'USD';
    if (!currencyBreakdown[currency]) {
      currencyBreakdown[currency] = { totalAmount: 0, purchaseCount: 0 };
    }
    currencyBreakdown[currency].totalAmount += p.fiat_amount || (p.amount_btc * p.price_usd);
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
  
  // Purchase size analysis
  const purchaseAmounts = sortedPurchases.map(p => ({
    amount: p.amount_btc,
    date: p.date,
    price: p.effective_price || p.price_usd,
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
    totalFees,
    purchaseCount: purchases.length,
    firstPurchaseDate,
    lastPurchaseDate,
    
    // Enhanced metrics
    totalFiatAmount,
    primaryFiatCurrency,
    averageEffectivePrice,
    feeAsPercentOfInvestment,
    exchangeBreakdown,
    transactionTypeBreakdown,
    currencyBreakdown,
    hasTransactionHashes,
    hasAddresses,
    timezoneMostUsed,
    largestPurchase,
    smallestPurchase,
  };
}

export function calculateDCAPerformance(purchases: BitcoinPurchase[], currentBTCPrice: number) {
  if (purchases.length === 0) return null;

  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate running totals for each purchase
  let runningBTC = 0;
  let runningInvested = 0;

  const performance = sortedPurchases.map((purchase, index) => {
    runningBTC += purchase.amount_btc;
    runningInvested += (purchase.amount_btc * purchase.price_usd) + purchase.fee_usd;

    const avgCostBasis = runningInvested / runningBTC;
    const currentValue = runningBTC * currentBTCPrice;
    const unrealizedPnL = currentValue - runningInvested;
    const unrealizedPnLPercent = runningInvested > 0 ? (unrealizedPnL / runningInvested) * 100 : 0;

    return {
      date: purchase.date,
      runningBTC,
      runningInvested,
      avgCostBasis,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      purchaseIndex: index + 1,
    };
  });

  return performance;
}