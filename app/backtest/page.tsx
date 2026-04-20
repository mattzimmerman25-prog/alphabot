'use client'

import { useState, useEffect } from 'react'
import {
  getAllBacktests,
  getAggregateStats,
  type ThesisBacktest
} from '@/lib/portfolio-backtester'
import { exportBacktest } from '@/lib/pdf-exporter'

export default function BacktestPage() {
  const [backtests, setBacktests] = useState<ThesisBacktest[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedBacktest, setSelectedBacktest] = useState<ThesisBacktest | null>(null)
  const [filter, setFilter] = useState<'all' | 'outperformed' | 'underperformed'>('all')

  useEffect(() => {
    const allBacktests = getAllBacktests()
    setBacktests(allBacktests)
    setStats(getAggregateStats())
  }, [])

  const filteredBacktests = filter === 'all'
    ? backtests
    : backtests.filter(b => b.outcome === filter)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Portfolio Backtesting
          </h1>
          <p className="text-gray-300">
            How would wiki frameworks have performed? Test theses against historical data.
          </p>
        </div>

        {/* Aggregate Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">{stats.totalBacktests}</div>
              <div className="text-sm text-gray-400">Total Backtests</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className={`text-2xl font-bold ${stats.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.avgReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Avg Return</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl font-bold text-purple-400">{stats.winRate.toFixed(0)}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className={`text-2xl font-bold ${stats.totalAlpha >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.totalAlpha.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Total Alpha</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex space-x-2 mb-6">
          {(['all', 'outperformed', 'underperformed'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {type === 'all' ? 'All Theses' : type}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Backtest List */}
          <div className="space-y-4">
            {filteredBacktests.map((backtest, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedBacktest(backtest)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedBacktest?.thesisName === backtest.thesisName
                    ? 'bg-blue-900/50 border-blue-600'
                    : backtest.outcome === 'outperformed'
                    ? 'bg-green-900/20 border-green-700 hover:border-green-600'
                    : 'bg-red-900/20 border-red-700 hover:border-red-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{backtest.thesisName}</div>
                    <div className="text-sm text-gray-400">{backtest.author}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {backtest.testPeriod.start} → {backtest.testPeriod.end}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className={`text-2xl font-bold ${
                      backtest.performance.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {backtest.performance.totalReturnPercent >= 0 ? '+' : ''}
                      {backtest.performance.totalReturnPercent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      Alpha: {backtest.vsIndex.alpha >= 0 ? '+' : ''}{backtest.vsIndex.alpha.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="px-2 py-1 bg-gray-700 rounded capitalize">{backtest.category}</span>
                  <span className={`px-2 py-1 rounded ${
                    backtest.outcome === 'outperformed' ? 'bg-green-700' : 'bg-red-700'
                  }`}>
                    {backtest.outcome}
                  </span>
                  <span className="text-gray-400">
                    {backtest.performance.trades.length} trades
                  </span>
                  <span className="text-gray-400">
                    {backtest.performance.winRate.toFixed(0)}% win rate
                  </span>
                </div>

                <div className="mt-2 text-sm text-gray-300">
                  {backtest.prediction}
                </div>
              </button>
            ))}
          </div>

          {/* Backtest Detail */}
          <div>
            {selectedBacktest ? (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{selectedBacktest.thesisName}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportBacktest(selectedBacktest)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export
                    </button>
                    <button
                      onClick={() => setSelectedBacktest(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Summary */}
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Author</div>
                    <div className="font-medium">{selectedBacktest.author}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Prediction</div>
                    <div className="text-sm">{selectedBacktest.prediction}</div>
                  </div>

                  {/* Performance */}
                  <div className="pt-4 border-t border-gray-700">
                    <h3 className="font-semibold mb-3">Performance</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-400">Total Return</div>
                        <div className={`text-lg font-bold ${
                          selectedBacktest.performance.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {selectedBacktest.performance.totalReturnPercent >= 0 ? '+' : ''}
                          {selectedBacktest.performance.totalReturnPercent.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">vs {selectedBacktest.vsIndex.benchmark}</div>
                        <div className={`text-lg font-bold ${
                          selectedBacktest.vsIndex.alpha >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {selectedBacktest.vsIndex.alpha >= 0 ? '+' : ''}
                          {selectedBacktest.vsIndex.alpha.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Win Rate</div>
                        <div className="text-lg font-semibold">{selectedBacktest.performance.winRate.toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Max Drawdown</div>
                        <div className="text-lg font-semibold text-red-400">
                          {selectedBacktest.performance.maxDrawdown.toFixed(1)}%
                        </div>
                      </div>
                      {selectedBacktest.performance.sharpeRatio && (
                        <div>
                          <div className="text-xs text-gray-400">Sharpe Ratio</div>
                          <div className="text-lg font-semibold">
                            {selectedBacktest.performance.sharpeRatio.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trades */}
                  <div className="pt-4 border-t border-gray-700">
                    <h3 className="font-semibold mb-3">Trades ({selectedBacktest.performance.trades.length})</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedBacktest.performance.trades.map((trade, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded border text-sm ${
                            (trade.pnl || 0) >= 0
                              ? 'bg-green-900/20 border-green-700'
                              : 'bg-red-900/20 border-red-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{trade.ticker}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                trade.action === 'LONG' ? 'bg-green-700' : 'bg-red-700'
                              }`}>
                                {trade.action}
                              </span>
                            </div>
                            <div className={`font-semibold ${
                              (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>${trade.entryPrice} → ${trade.exitPrice || 'open'}</span>
                            <span>
                              {(trade.pnlPercent || 0) >= 0 ? '+' : ''}{(trade.pnlPercent || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outcome */}
                  <div className="pt-4 border-t border-gray-700">
                    <div className={`p-3 rounded text-center font-medium ${
                      selectedBacktest.outcome === 'outperformed'
                        ? 'bg-green-600'
                        : 'bg-red-600'
                    }`}>
                      {selectedBacktest.outcome === 'outperformed' ? '✓ ' : '✗ '}
                      {selectedBacktest.outcome.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📈</div>
                  <p className="text-gray-400">Select a backtest to view details</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click any thesis to see trade-by-trade performance
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Performance */}
        {stats && Object.keys(stats.byCategory).length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Performance by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(stats.byCategory).map(([cat, data]: [string, any]) => (
                <div key={cat} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="text-sm text-gray-400 capitalize mb-1">{cat}</div>
                  <div className={`text-2xl font-bold ${
                    data.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.avgReturn >= 0 ? '+' : ''}{data.avgReturn.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {data.count} backtest{data.count > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="mt-8 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700">
          <h2 className="text-xl font-semibold mb-4">💡 Key Insights</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-green-400">✓</span>
              <span>Dylan Patel power constraint thesis: +22% return, 13.5% alpha vs QQQ</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-400">✓</span>
              <span>Howard Marks debt warning thesis: +16% return, 10.8% alpha vs S&P 500</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-red-400">✗</span>
              <span>Gary Marcus scaling skepticism: -18% return, -36.5% alpha vs QQQ</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400">→</span>
              <span>Frameworks with empirical evidence (Patel, Marks) significantly outperformed speculation-based theses</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400">→</span>
              <span>Power/infrastructure theses generated best risk-adjusted returns (Sharpe Ratio 2.1)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
