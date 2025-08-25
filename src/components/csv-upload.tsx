'use client';

import { useState, useRef } from 'react';
import { parseCSV, generateSampleCSV, ParseResult } from '@/lib/csv-parser';
import { BitcoinPurchase } from '@/lib/types';

interface CSVUploadProps {
  onDataParsed: (data: BitcoinPurchase[]) => void;
}

export default function CSVUpload({ onDataParsed }: CSVUploadProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseResult({
        success: false,
        errors: ['Please upload a CSV file'],
        warnings: [],
      });
      return;
    }

    setIsLoading(true);
    try {
      const content = await file.text();
      const result = parseCSV(content);
      setParseResult(result);
      
      if (result.success && result.data) {
        onDataParsed(result.data);
      }
    } catch (error) {
      setParseResult({
        success: false,
        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const downloadSample = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bitcoin-purchases-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Upload Purchase History</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Upload your Bitcoin purchase history as a CSV file. All processing happens in your browser - no data is sent to any server.
        </p>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={downloadSample}
            className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Download Sample CSV
          </button>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3">Processing CSV...</span>
          </div>
        ) : (
          <>
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg mb-2">Drop your CSV file here, or click to browse</p>
            <p className="text-sm text-gray-500">Supports CSV files with purchase history</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Choose File
            </button>
          </>
        )}
      </div>

      {parseResult && (
        <div className="mt-6">
          {parseResult.success ? (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-green-800 dark:text-green-200">
                  Successfully parsed {parseResult.data?.length} purchases
                </span>
              </div>
              {parseResult.warnings.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warnings:</p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {parseResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-red-800 dark:text-red-200">Failed to parse CSV</span>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300">
                {parseResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <p className="font-medium mb-2">Expected CSV format:</p>
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-xs overflow-x-auto">
          date,amount_btc,price_usd,fee_usd,exchange,notes<br />
          2024-01-15,0.001,42000,2.5,Coinbase,First purchase<br />
          2024-02-15,0.0015,45000,3.0,Coinbase,Monthly DCA
        </div>
        <p className="mt-2 text-xs">
          Required: date, amount_btc, price_usd | Optional: fee_usd, exchange, notes
        </p>
      </div>
    </div>
  );
}