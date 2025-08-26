import Papa from 'papaparse';
import { BitcoinPurchase, BitcoinPurchaseSchema, CSVRow, CSVRowSchema } from './types';

export interface ParseResult {
  success: boolean;
  data?: BitcoinPurchase[];
  errors: string[];
  warnings: string[];
}

export function parseCSV(csvContent: string): ParseResult {
  const result: ParseResult = {
    success: false,
    errors: [],
    warnings: [],
  };

  try {
    const parseResult = Papa.parse<CSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_'),
    });

    if (parseResult.errors.length > 0) {
      result.errors.push(...parseResult.errors.map(err => `Row ${err.row}: ${err.message}`));
    }

    const purchases: BitcoinPurchase[] = [];
    const validationErrors: string[] = [];

    parseResult.data.forEach((row, index) => {
      try {
        const csvRowResult = CSVRowSchema.safeParse(row);
        
        if (!csvRowResult.success) {
          validationErrors.push(`Row ${index + 2}: ${csvRowResult.error.issues.map(e => e.message).join(', ')}`);
          return;
        }

        const csvRow = csvRowResult.data;
        
        // Smart field mapping - handle both English and French column names
        const getFieldValue = (englishName: string, frenchName?: string): string | undefined => {
          const csvRowData = csvRow as Record<string, string>;
          
          // Try exact matches first (including quoted keys)
          if (csvRowData[englishName]) return csvRowData[englishName];
          if (csvRowData[`"${englishName}"`]) return csvRowData[`"${englishName}"`];
          if (frenchName && csvRowData[frenchName]) return csvRowData[frenchName];
          if (frenchName && csvRowData[`"${frenchName}"`]) return csvRowData[`"${frenchName}"`];
          
          // Try case-insensitive matches
          for (const key in csvRowData) {
            const cleanKey = key.replace(/"/g, '');
            if (cleanKey.toLowerCase() === englishName.toLowerCase()) return csvRowData[key];
            if (frenchName && cleanKey.toLowerCase() === frenchName.toLowerCase()) return csvRowData[key];
          }
          
          return undefined;
        };
        
        const parseNumber = (value: string | undefined, defaultValue: number = 0): number => {
          if (!value || value === '') return defaultValue;
          
          // Handle different number formats
          let cleanValue = value.toString().trim();
          
          // Remove any non-numeric characters except decimal separators
          cleanValue = cleanValue.replace(/[^\d,.-]/g, '');
          
          // Handle European format (comma as decimal separator)
          if (cleanValue.includes(',') && cleanValue.includes('.')) {
            // Format like "1.234,56" (European) - keep comma as decimal
            cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
          } else if (cleanValue.includes(',')) {
            // Single comma - could be decimal separator
            cleanValue = cleanValue.replace(',', '.');
          }
          
          const parsed = parseFloat(cleanValue);
          return isNaN(parsed) ? defaultValue : parsed;
        };
        
        // Determine Bitcoin amount and price from various formats
        let amount_btc = 0;
        let price_usd = 0;
        let fee_usd = 0;
        let fiat_amount = 0;
        let fiat_currency = '';
        
        // French exchange format detection with transformed field names
        const amountReceived = parseNumber(getFieldValue('montant_reçu')) || 
                             parseNumber(getFieldValue('amount_received'));
        
        const currencyReceived = getFieldValue('monnaie_ou_jeton_reçu')?.toUpperCase() ||
                               getFieldValue('currency_received')?.toUpperCase();
        
        const amountSent = parseNumber(getFieldValue('montant_envoyé')) ||
                         parseNumber(getFieldValue('amount_sent'));
        
        const currencySent = getFieldValue('monnaie_ou_jeton_envoyé')?.toUpperCase() ||
                           getFieldValue('currency_sent')?.toUpperCase();
        
        const receivedTokenPrice = parseNumber(getFieldValue('prix_du_jeton_du_montant_recu')) ||
                                 parseNumber(getFieldValue('received_token_price'));
        
        
        
        if (currencyReceived === 'BTC' && amountReceived > 0) {
          // French format: receiving BTC
          amount_btc = amountReceived;
          fiat_amount = amountSent;
          fiat_currency = currencySent || 'EUR';
          price_usd = receivedTokenPrice > 0 ? receivedTokenPrice : (amountSent > 0 ? amountSent / amountReceived : 0);
          
          // Convert EUR to USD if needed (approximate rate for calculation)
          if (fiat_currency === 'EUR' && receivedTokenPrice === 0) {
            price_usd = price_usd * 1.1; // Rough EUR to USD conversion
          }
        } else {
          // Original format or fallback
          amount_btc = parseNumber(getFieldValue('amount_btc'));
          price_usd = parseNumber(getFieldValue('price_usd'));
          fiat_amount = amount_btc * price_usd;
          fiat_currency = 'USD';
        }
        
        // Handle fees
        const feeAmount = parseNumber(getFieldValue('fee_amount', 'frais'));
        const feeCurrency = getFieldValue('fee_currency', 'monnaie_ou_jeton_des_frais');
        const feeTokenPrice = parseNumber(getFieldValue('fee_token_price', 'prix_du_jeton_des_frais'));
        
        
        if (feeAmount > 0) {
          if (feeCurrency === 'EUR') {
            fee_usd = feeAmount * 1.1; // Rough EUR to USD conversion
          } else if (feeCurrency === 'USD') {
            fee_usd = feeAmount;
          } else if (feeTokenPrice > 0) {
            fee_usd = feeAmount * feeTokenPrice;
          } else {
            fee_usd = feeAmount; // Assume same currency as purchase
          }
        } else {
          fee_usd = parseNumber(getFieldValue('fee_usd'));
        }
        

        const purchaseData = {
          date: getFieldValue('date') || new Date().toISOString(),
          amount_btc,
          price_usd,
          fee_usd,
          exchange: getFieldValue('exchange') || getFieldValue('description'),
          notes: getFieldValue('notes') || getFieldValue('description'),
          
          // Enhanced fields
          type: getFieldValue('type'),
          timezone: getFieldValue('timezone', 'fuseau_horaire'),
          amount_received: amountReceived,
          currency_received: currencyReceived,
          amount_sent: amountSent,
          currency_sent: currencySent,
          fee_amount: feeAmount,
          fee_currency: feeCurrency,
          description: getFieldValue('description'),
          sent_token_price: parseNumber(getFieldValue('sent_token_price', 'prix_du_jeton_du_montant_envoye')),
          received_token_price: receivedTokenPrice,
          fee_token_price: feeTokenPrice,
          address: getFieldValue('address', 'adresse'),
          transaction_hash: getFieldValue('transaction_hash'),
          external_id: getFieldValue('external_id', 'id_externe'),
          fiat_amount,
          fiat_currency,
          effective_price: fiat_amount > 0 ? (fiat_amount + fee_usd) / amount_btc : price_usd,
        };

        const purchaseResult = BitcoinPurchaseSchema.safeParse(purchaseData);
        
        if (!purchaseResult.success) {
          validationErrors.push(`Row ${index + 2}: ${purchaseResult.error.issues.map(e => e.message).join(', ')}`);
          return;
        }

        purchases.push(purchaseResult.data);
      } catch (error) {
        validationErrors.push(`Row ${index + 2}: Failed to parse data - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    result.errors.push(...validationErrors);

    if (purchases.length === 0 && result.errors.length === 0) {
      result.errors.push('No valid data found in CSV');
    } else if (purchases.length > 0) {
      result.success = true;
      result.data = purchases.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (validationErrors.length > 0) {
        result.warnings.push(`${validationErrors.length} rows had validation errors and were skipped`);
      }
    }

  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

export function generateSampleCSV(format: 'simple' | 'french' | 'enhanced' = 'simple'): string {
  if (format === 'simple') {
    const headers = ['date', 'amount_btc', 'price_usd', 'fee_usd', 'exchange', 'notes'];
    const sampleData = [
      ['2024-01-15', '0.001', '42000', '2.5', 'Coinbase', 'First purchase'],
      ['2024-02-15', '0.0015', '45000', '3.0', 'Coinbase', 'Monthly DCA'],
      ['2024-03-15', '0.002', '38000', '4.0', 'Kraken', 'Bought the dip'],
    ];
    return Papa.unparse([headers, ...sampleData]);
  }
  
  if (format === 'french') {
    const headers = [
      'Type', 'Date', 'Fuseau horaire', 'Montant reçu', 'Monnaie ou jeton reçu', 
      'Montant envoyé', 'Monnaie ou jeton envoyé', 'Frais', 'Monnaie ou jeton des frais', 
      'Description', 'Prix du jeton du montant envoyé', 'Prix du jeton du montant recu', 
      'Prix du jeton des frais', 'Adresse', 'Transaction hash', 'ID Externe'
    ];
    const sampleData = [
      ['Échange', '2024-01-15T10:30:00Z', 'GMT', '0.001', 'BTC', '42', 'EUR', '0.5', 'EUR', 
       'Achat par carte', '', '42000', '', '', '', 'abc123-def456'],
      ['Échange', '2024-02-15T14:20:00Z', 'GMT', '0.0015', 'BTC', '67.5', 'EUR', '0.75', 'EUR', 
       'Achat par virement', '', '45000', '', '', '', 'def789-ghi012'],
      ['Échange', '2024-03-15T09:15:00Z', 'GMT', '0.002', 'BTC', '76', 'EUR', '1.0', 'EUR', 
       'Achat pendant la baisse', '', '38000', '', '', '', 'ghi345-jkl678'],
    ];
    return Papa.unparse([headers, ...sampleData]);
  }
  
  if (format === 'enhanced') {
    const headers = [
      'date', 'amount_btc', 'price_usd', 'fee_usd', 'exchange', 'notes',
      'type', 'timezone', 'amount_received', 'currency_received', 'amount_sent', 'currency_sent',
      'fee_amount', 'fee_currency', 'description', 'sent_token_price', 'received_token_price',
      'address', 'transaction_hash', 'external_id', 'fiat_currency'
    ];
    const sampleData = [
      ['2024-01-15T10:30:00Z', '0.001', '42000', '2.5', 'Binance', 'Card purchase', 
       'Exchange', 'GMT', '0.001', 'BTC', '42', 'EUR', '2.5', 'EUR', 'Card purchase',
       '', '42000', 'bc1q...abc123', 'hash123...', 'ext-001', 'EUR'],
      ['2024-02-15T14:20:00Z', '0.0015', '45000', '3.0', 'Kraken', 'Bank transfer',
       'Exchange', 'GMT', '0.0015', 'BTC', '67.5', 'EUR', '3.0', 'EUR', 'Bank transfer', 
       '', '45000', 'bc1q...def456', 'hash456...', 'ext-002', 'EUR'],
    ];
    return Papa.unparse([headers, ...sampleData]);
  }
  
  return Papa.unparse([]);
}