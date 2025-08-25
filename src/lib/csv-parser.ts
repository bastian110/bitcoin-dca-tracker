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
        
        const purchaseData = {
          date: csvRow.date,
          amount_btc: parseFloat(csvRow.amount_btc),
          price_usd: parseFloat(csvRow.price_usd),
          fee_usd: csvRow.fee_usd ? parseFloat(csvRow.fee_usd) : 0,
          exchange: csvRow.exchange,
          notes: csvRow.notes,
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

export function generateSampleCSV(): string {
  const headers = ['date', 'amount_btc', 'price_usd', 'fee_usd', 'exchange', 'notes'];
  const sampleData = [
    ['2024-01-15', '0.001', '42000', '2.5', 'Coinbase', 'First purchase'],
    ['2024-02-15', '0.0015', '45000', '3.0', 'Coinbase', 'Monthly DCA'],
    ['2024-03-15', '0.002', '38000', '4.0', 'Kraken', 'Bought the dip'],
  ];
  
  return Papa.unparse([headers, ...sampleData]);
}