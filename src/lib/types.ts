import { z } from 'zod';

export const BitcoinPurchaseSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format"
  }),
  amount_btc: z.number().positive("Bitcoin amount must be positive"),
  price_usd: z.number().positive("Price must be positive"),
  fee_usd: z.number().min(0, "Fee cannot be negative").optional().default(0),
  exchange: z.string().optional(),
  notes: z.string().optional(),
});

export const CSVRowSchema = z.object({
  date: z.string(),
  amount_btc: z.string(),
  price_usd: z.string(),
  fee_usd: z.string().optional().default("0"),
  exchange: z.string().optional(),
  notes: z.string().optional(),
});

export type BitcoinPurchase = z.infer<typeof BitcoinPurchaseSchema>;
export type CSVRow = z.infer<typeof CSVRowSchema>;

export interface PortfolioMetrics {
  totalBTC: number;
  totalInvested: number;
  averageCostBasis: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  totalFees: number;
  purchaseCount: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
}