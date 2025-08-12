'use client';

import { useState, useEffect } from 'react';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  source: string;
  error?: string;
}

export default function Home() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);

  const fetchStock = async (stockSymbol: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stock?symbol=${stockSymbol}`);
      const data = await response.json();
      setStockData(data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock(symbol);
  }, [symbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStock(symbol);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Investment Dashboard
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit} className="flex gap-4 items-center justify-center">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Enter stock symbol (e.g., AAPL)"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Get Quote'}
            </button>
          </form>
        </div>

        {stockData && !stockData.error && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {stockData.symbol} Stock Quote
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Current Price</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${stockData.price?.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Change</p>
                <p className={`text-2xl font-semibold ${
                  stockData.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stockData.change >= 0 ? '+' : ''}
                  ${stockData.change?.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Change %</p>
                <p className={`text-2xl font-semibold ${
                  parseFloat(stockData.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {parseFloat(stockData.changePercent) >= 0 ? '+' : ''}
                  {parseFloat(stockData.changePercent).toFixed(2)}%
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Data source: {stockData.source}
            </p>
          </div>
        )}

        {stockData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {stockData.error}</p>
          </div>
        )}
      </div>
    </main>
  );
}