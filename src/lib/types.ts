import { z } from 'zod';

// Enhanced schema supporting French exchange format
export const BitcoinPurchaseSchema = z.object({
  // Core required fields (backwards compatible)
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format"
  }),
  amount_btc: z.number().positive("Bitcoin amount must be positive"),
  price_usd: z.number().positive("Price must be positive"),
  fee_usd: z.number().min(0, "Fee cannot be negative").optional().default(0),
  exchange: z.string().optional(),
  notes: z.string().optional(),
  
  // Enhanced fields from French exchanges
  type: z.string().optional(), // Type (Échange, Achat, Vente, etc.)
  timezone: z.string().optional(), // Fuseau horaire
  amount_received: z.number().optional(), // Montant reçu
  currency_received: z.string().optional(), // Monnaie ou jeton reçu
  amount_sent: z.number().optional(), // Montant envoyé
  currency_sent: z.string().optional(), // Monnaie ou jeton envoyé
  fee_amount: z.number().optional(), // Frais (alternative to fee_usd)
  fee_currency: z.string().optional(), // Monnaie ou jeton des frais
  description: z.string().optional(), // Description
  sent_token_price: z.number().optional(), // Prix du jeton du montant envoyé
  received_token_price: z.number().optional(), // Prix du jeton du montant reçu
  fee_token_price: z.number().optional(), // Prix du jeton des frais
  address: z.string().optional(), // Adresse
  transaction_hash: z.string().optional(), // Transaction hash
  external_id: z.string().optional(), // ID Externe
  
  // Calculated fields for better analysis
  fiat_amount: z.number().optional(), // Total fiat amount (EUR, USD, etc.)
  fiat_currency: z.string().optional(), // Fiat currency used
  effective_price: z.number().optional(), // Effective price including fees
});

export const CSVRowSchema = z.object({
  // Backwards compatible minimal fields
  date: z.string().optional(),
  amount_btc: z.string().optional(),
  price_usd: z.string().optional(),
  fee_usd: z.string().optional().default("0"),
  exchange: z.string().optional(),
  notes: z.string().optional(),
  
  // French exchange format fields
  type: z.string().optional(),
  fuseau_horaire: z.string().optional(),
  timezone: z.string().optional(),
  montant_recu: z.string().optional(),
  amount_received: z.string().optional(),
  monnaie_ou_jeton_recu: z.string().optional(),
  currency_received: z.string().optional(),
  montant_envoye: z.string().optional(),
  amount_sent: z.string().optional(),
  monnaie_ou_jeton_envoye: z.string().optional(),
  currency_sent: z.string().optional(),
  frais: z.string().optional(),
  fee_amount: z.string().optional(),
  monnaie_ou_jeton_des_frais: z.string().optional(),
  fee_currency: z.string().optional(),
  description: z.string().optional(),
  prix_du_jeton_du_montant_envoye: z.string().optional(),
  sent_token_price: z.string().optional(),
  prix_du_jeton_du_montant_recu: z.string().optional(),
  received_token_price: z.string().optional(),
  prix_du_jeton_des_frais: z.string().optional(),
  fee_token_price: z.string().optional(),
  adresse: z.string().optional(),
  address: z.string().optional(),
  transaction_hash: z.string().optional(),
  id_externe: z.string().optional(),
  external_id: z.string().optional(),
});

export type BitcoinPurchase = z.infer<typeof BitcoinPurchaseSchema>;
export type CSVRow = z.infer<typeof CSVRowSchema>;

export interface PortfolioMetrics {
  // Core metrics (backwards compatible)
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
  
  // Enhanced metrics with new data
  totalFiatAmount: number;
  primaryFiatCurrency: string;
  averageEffectivePrice: number;
  feeAsPercentOfInvestment: number;
  exchangeBreakdown: Record<string, {
    count: number;
    totalBTC: number;
    totalFiat: number;
    avgPrice: number;
  }>;
  transactionTypeBreakdown: Record<string, number>;
  currencyBreakdown: Record<string, {
    totalAmount: number;
    purchaseCount: number;
  }>;
  hasTransactionHashes: boolean;
  hasAddresses: boolean;
  timezoneMostUsed: string | null;
  largestPurchase: {
    amount: number;
    date: string;
    price: number;
  };
  smallestPurchase: {
    amount: number;
    date: string;
    price: number;
  };
}