'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Check, Settings, ArrowUpDown } from 'lucide-react';

// Types
interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  dayHigh?: number;
  dayLow?: number;
  week52High?: number;
  week52Low?: number;
  marketCap?: number;
  volume?: number;
  source: string;
  error?: string;
}

interface WatchList {
  id: string;
  name: string;
  symbols: string[];
  displayColumns: string[];
}

type SortField = 'symbol' | 'price' | 'change' | 'changePercent' | 'marketCap' | 'volume';
type SortDirection = 'asc' | 'desc';

// Available columns for display
const AVAILABLE_COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'price', label: 'Price' },
  { key: 'change', label: 'Change' },
  { key: 'changePercent', label: 'Change %' },
  { key: 'dayHigh', label: 'Day High' },
  { key: 'dayLow', label: 'Day Low' },
  { key: 'week52High', label: '52W High' },
  { key: 'week52Low', label: '52W Low' },
  { key: 'marketCap', label: 'Market Cap' },
  { key: 'volume', label: 'Volume' }
];

export default function Home() {
  // State management
  const [watchLists, setWatchLists] = useState<WatchList[]>([
    {
      id: '1',
      name: 'My Stocks',
      symbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
      displayColumns: ['symbol', 'price', 'change', 'changePercent']
    }
  ]);
  
  const [activeWatchListId, setActiveWatchListId] = useState('1');
  const [stocksData, setStocksData] = useState<{ [key: string]: StockData }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  
  // UI state
  const [editingWatchListId, setEditingWatchListId] = useState<string | null>(null);
  const [newWatchListName, setNewWatchListName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const activeWatchList = watchLists.find(wl => wl.id === activeWatchListId);

  // Fetch stock data
  const fetchStockData = async (symbol: string) => {
    setLoading(prev => ({ ...prev, [symbol]: true }));
    try {
      const response = await fetch(`/api/stock?symbol=${symbol}`);
      const data = await response.json();
      setStocksData(prev => ({ ...prev, [symbol]: data }));
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
      setStocksData(prev => ({ 
        ...prev, 
        [symbol]: { 
          symbol, 
          price: 0, 
          change: 0, 
          changePercent: '0', 
          source: 'error', 
          error: 'Failed to load' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  // Load data for active watchlist
  useEffect(() => {
    if (activeWatchList) {
      activeWatchList.symbols.forEach(symbol => {
        if (!stocksData[symbol] && !loading[symbol]) {
          fetchStockData(symbol);
        }
      });
    }
  }, [activeWatchList, stocksData, loading]);

  // Watchlist management
  const createWatchList = () => {
    if (newWatchListName.trim()) {
      const newId = Date.now().toString();
      setWatchLists(prev => [...prev, {
        id: newId,
        name: newWatchListName.trim(),
        symbols: [],
        displayColumns: ['symbol', 'price', 'change', 'changePercent']
      }]);
      setActiveWatchListId(newId);
      setNewWatchListName('');
    }
  };

  const renameWatchList = (id: string, newName: string) => {
    setWatchLists(prev => prev.map(wl => 
      wl.id === id ? { ...wl, name: newName } : wl
    ));
    setEditingWatchListId(null);
  };

  const deleteWatchList = (id: string) => {
    if (watchLists.length > 1) {
      setWatchLists(prev => prev.filter(wl => wl.id !== id));
      if (activeWatchListId === id) {
        setActiveWatchListId(watchLists.find(wl => wl.id !== id)?.id || '');
      }
    }
  };

  const addSymbol = () => {
    if (newSymbol.trim() && activeWatchList) {
      const symbol = newSymbol.trim().toUpperCase();
      if (!activeWatchList.symbols.includes(symbol)) {
        setWatchLists(prev => prev.map(wl => 
          wl.id === activeWatchListId 
            ? { ...wl, symbols: [...wl.symbols, symbol] }
            : wl
        ));
        fetchStockData(symbol);
      }
      setNewSymbol('');
    }
  };

  const removeSymbol = (symbol: string) => {
    setWatchLists(prev => prev.map(wl => 
      wl.id === activeWatchListId 
        ? { ...wl, symbols: wl.symbols.filter(s => s !== symbol) }
        : wl
    ));
  };

  const updateDisplayColumns = (columns: string[]) => {
    setWatchLists(prev => prev.map(wl => 
      wl.id === activeWatchListId 
        ? { ...wl, displayColumns: columns }
        : wl
    ));
  };

  // Sorting
  const sortedSymbols = activeWatchList ? [...activeWatchList.symbols].sort((a, b) => {
    const aData = stocksData[a];
    const bData = stocksData[b];
    
    if (!aData || !bData) return 0;
    
    let aValue: string | number = aData[sortField] || '';
    let bValue: string | number = bData[sortField] || '';
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  const paginatedSymbols = sortedSymbols.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(sortedSymbols.length / ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(0);
  };

  const formatValue = (value: string | number | undefined, column: string) => {
    if (value === undefined || value === null) return '-';
    
    switch (column) {
      case 'price':
      case 'dayHigh':
      case 'dayLow':
      case 'week52High':
      case 'week52Low':
        return `${Number(value).toFixed(2)}`;
      case 'change':
        return `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}`;
      case 'changePercent':
        return `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`;
      case 'marketCap':
        return value ? `${(Number(value) / 1e9).toFixed(1)}B` : '-';
      case 'volume':
        return value ? Number(value).toLocaleString() : '-';
      default:
        return value;
    }
  };

  const getValueColor = (value: string | number | undefined, column: string) => {
    if (column === 'change' || column === 'changePercent') {
      return Number(value) >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return 'text-gray-900';
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Investment Dashboard
        </h1>

        {/* Watchlist Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {watchLists.map(wl => (
            <div key={wl.id} className="flex items-center">
              {editingWatchListId === wl.id ? (
                <div className="flex items-center px-3 py-2 bg-blue-100 rounded-t-lg">
                  <input
                    type="text"
                    defaultValue={wl.name}
                    className="px-2 py-1 text-sm border rounded"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renameWatchList(wl.id, e.currentTarget.value);
                      } else if (e.key === 'Escape') {
                        setEditingWatchListId(null);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => renameWatchList(wl.id, (document.querySelector('input[type="text"]') as HTMLInputElement)?.value || wl.name)}
                    className="ml-2 text-green-600 hover:text-green-700"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveWatchListId(wl.id)}
                  className={`px-4 py-2 font-medium rounded-t-lg flex items-center gap-2 ${
                    activeWatchListId === wl.id
                      ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {wl.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingWatchListId(wl.id);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 size={14} />
                  </button>
                  {watchLists.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWatchList(wl.id);
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </button>
              )}
            </div>
          ))}
          
          {/* New Watchlist */}
          <div className="flex items-center">
            <input
              type="text"
              value={newWatchListName}
              onChange={(e) => setNewWatchListName(e.target.value)}
              placeholder="New watchlist name"
              className="px-3 py-2 text-sm border rounded-l-lg"
              onKeyDown={(e) => e.key === 'Enter' && createWatchList()}
            />
            <button
              onClick={createWatchList}
              className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {activeWatchList && (
          <div className="bg-white rounded-lg shadow-md">
            {/* Controls */}
            <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Add Symbol */}
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    placeholder="Add symbol (e.g. AAPL)"
                    className="px-3 py-2 border rounded-l-lg"
                    onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
                  />
                  <button
                    onClick={addSymbol}
                    className="px-3 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Column Settings */}
                <div className="relative">
                  <button
                    onClick={() => setShowColumnSettings(!showColumnSettings)}
                    className="px-3 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
                  >
                    <Settings size={16} />
                    Columns
                  </button>
                  
                  {showColumnSettings && (
                    <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-4 z-10 min-w-64">
                      <h4 className="font-medium mb-3">Display Columns</h4>
                      <div className="space-y-2">
                        {AVAILABLE_COLUMNS.map(col => (
                          <label key={col.key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={activeWatchList.displayColumns.includes(col.key)}
                              onChange={(e) => {
                                const newColumns = e.target.checked
                                  ? [...activeWatchList.displayColumns, col.key]
                                  : activeWatchList.displayColumns.filter(c => c !== col.key);
                                updateDisplayColumns(newColumns);
                              }}
                              className="mr-2"
                            />
                            {col.label}
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowColumnSettings(false)}
                        className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-sm"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {activeWatchList.displayColumns.map(column => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(column as SortField)}
                      >
                        <div className="flex items-center gap-1">
                          {AVAILABLE_COLUMNS.find(col => col.key === column)?.label}
                          <ArrowUpDown size={14} className="text-gray-400" />
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedSymbols.map(symbol => {
                    const data = stocksData[symbol];
                    const isLoading = loading[symbol];
                    
                    return (
                      <tr key={symbol} className="hover:bg-gray-50">
                        {activeWatchList.displayColumns.map(column => (
                          <td key={column} className="px-4 py-3 text-sm">
                            {isLoading ? (
                              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                            ) : data?.error ? (
                              <span className="text-red-500">Error</span>
                            ) : (
                              <span className={getValueColor(data?.[column as keyof StockData], column)}>
                                {formatValue(data?.[column as keyof StockData], column)}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => removeSymbol(symbol)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {activeWatchList.symbols.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No symbols in this watchlist. Add some symbols to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}