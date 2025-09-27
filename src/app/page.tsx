'use client';

import { useState } from 'react';
import { clearAllData, getStorageInfo } from '@/lib/storage';

export default function Home() {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      const success = clearAllData();
      if (success) {
        alert('All cached data has been cleared successfully!');
      } else {
        alert('Failed to clear data. Please try again.');
      }
    } catch {
      alert('An error occurred while clearing data.');
    } finally {
      setIsClearing(false);
      setShowConfirm(false);
    }
  };

  const storageInfo = getStorageInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Bitcoin DCA Tracker
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Privacy-first Bitcoin Dollar Cost Averaging portfolio tracker. 
              Analyze your purchase history and monitor performance after moving to cold storage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="text-orange-600 dark:text-orange-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-gray-600 dark:text-gray-300">
                All calculations happen in your browser. No private keys, no server storage, complete privacy.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="text-orange-600 dark:text-orange-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Performance</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upload your purchase history CSV and optionally add xpub/addresses for live balance tracking.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/dashboard" className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-8 py-3 rounded-lg transition-colors">
                Get Started
              </a>

              {storageInfo.hasData && (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={isClearing}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium px-6 py-2 rounded-lg transition-colors text-sm"
                  >
                    {isClearing ? 'Clearing...' : 'Clear All Data'}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(storageInfo.lastUpdated!).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Open source • No registration required • Read-only operations
            </p>
          </div>

          {/* Confirmation Modal */}
          {showConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Clear All Data?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  This will permanently delete all your uploaded purchase history, settings, and cached data. This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearData}
                    disabled={isClearing}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
                  >
                    {isClearing ? 'Clearing...' : 'Clear All Data'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
