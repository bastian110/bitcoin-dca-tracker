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

  return {
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