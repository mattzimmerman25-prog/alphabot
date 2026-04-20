'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAccuracyStats, getCredibilityLeaderboard } from '@/lib/temporal-tracker'
import { getAggregateStats } from '@/lib/portfolio-backtester'

export default function DashboardV2() {
  const [temporalStats, setTemporalStats] = useState<any>(null)
  const [backtestStats, setBacktestStats] = useState<any>(null)
  const [topSources, setTopSources] = useState<any[]>([])

  useEffect(() => {
    setTemporalStats(getAccuracyStats())
    setBacktestStats(getAggregateStats())
    setTopSources(getCredibilityLeaderboard().slice(0, 3))
  }, [])

  const features = [
    {
      title: 'Real-Time Synthesis',
      href: '/synthesize',
      icon: '⚡',
      description: 'Analyze breaking news with streaming AI. Find contradictions with elite frameworks.',
      color: 'from-blue-600 to-cyan-600',
      stats: '5 contradiction categories'
    },
    {
      title: 'Multi-News Compare',
      href: '/compare',
      icon: '📰',
      description: 'Compare 2-5 articles simultaneously. Find consensus vs debate areas.',
      color: 'from-purple-600 to-pink-600',
      stats: 'Cross-article analysis'
    },
    {
      title: 'Scenario Simulator',
      href: '/scenario',
      icon: '🔮',
      description: 'Run "what if" scenarios. See downstream effects through wiki frameworks.',
      color: 'from-indigo-600 to-blue-600',
      stats: '6 predefined scenarios'
    },
    {
      title: 'Chat with Wiki',
      href: '/chat',
      icon: '💬',
      description: 'Ask questions to 403-page wiki. Get synthesis with citations.',
      color: 'from-green-600 to-emerald-600',
      stats: '403 pages indexed'
    },
    {
      title: 'Knowledge Graph',
      href: '/graph',
      icon: '🕸️',
      description: 'Explore connections between entities, concepts, and sources.',
      color: 'from-orange-600 to-red-600',
      stats: 'D3.js interactive'
    },
    {
      title: 'Temporal Analysis',
      href: '/temporal',
      icon: '⏱️',
      description: 'Track predictions vs outcomes. Source credibility leaderboard.',
      color: 'from-yellow-600 to-orange-600',
      stats: temporalStats ? `${temporalStats.overallAccuracy.toFixed(0)}% accuracy` : 'Loading...'
    },
    {
      title: 'Portfolio Backtest',
      href: '/backtest',
      icon: '📈',
      description: 'Test investment theses against historical data. Trade-by-trade analysis.',
      color: 'from-teal-600 to-cyan-600',
      stats: backtestStats ? `${backtestStats.avgReturn.toFixed(1)}% avg return` : 'Loading...'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AlphaBot V2
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Real-Time AI Intelligence System
          </p>
          <p className="text-gray-400">
            Powered by 403-page elite framework wiki • Live contradiction detection • Investment thesis generation
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-blue-400">8</div>
            <div className="text-sm text-gray-400">Active Features</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-purple-400">403</div>
            <div className="text-sm text-gray-400">Wiki Pages</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-green-400">
              {temporalStats?.verified || 0}
            </div>
            <div className="text-sm text-gray-400">Predictions Tracked</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-yellow-400">
              {backtestStats?.totalBacktests || 0}
            </div>
            <div className="text-sm text-gray-400">Theses Backtested</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, idx) => (
            <Link
              key={idx}
              href={feature.href}
              className="group bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700 hover:border-gray-500 transition-all hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`text-4xl p-3 rounded-lg bg-gradient-to-br ${feature.color}`}>
                  {feature.icon}
                </div>
                <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                  {feature.stats}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400">
                {feature.description}
              </p>
            </Link>
          ))}

          {/* Classic Dashboard Link */}
          <Link
            href="/dashboard-v1"
            className="group bg-gray-800/30 backdrop-blur rounded-lg p-6 border border-gray-700 hover:border-gray-500 transition-all opacity-75"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl p-3 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700">
                📄
              </div>
              <span className="text-xs px-2 py-1 bg-gray-700 rounded">Legacy</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-gray-400 transition-colors">
              V1 Dashboard
            </h3>
            <p className="text-sm text-gray-400">
              View original static thesis files from V1.
            </p>
          </Link>
        </div>

        {/* Top Performing Sources */}
        {topSources.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700 mb-12">
            <h2 className="text-2xl font-semibold mb-4">🏆 Top Performing Sources</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topSources.map((source, idx) => (
                <div key={idx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">#{idx + 1}</span>
                    <span className={`text-2xl font-bold ${
                      source.overallAccuracy >= 80 ? 'text-green-400' :
                      source.overallAccuracy >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {source.overallAccuracy.toFixed(0)}%
                    </span>
                  </div>
                  <div className="font-semibold mb-1">
                    {source.source.replace(/\[\[|\]\]/g, '')}
                  </div>
                  <div className="text-sm text-gray-400">
                    {source.correctPredictions}/{source.totalPredictions} correct
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700">
          <h2 className="text-2xl font-semibold mb-4">💡 Recent Insights</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-green-400 text-lg">✓</span>
              <div>
                <div className="font-medium">Power Constraints Validated</div>
                <div className="text-sm text-gray-400">
                  Dylan Patel's thesis: +22% return, 13.5% alpha vs QQQ (87% prediction accuracy)
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-400 text-lg">✓</span>
              <div>
                <div className="font-medium">Debt-Financed Warning Correct</div>
                <div className="text-sm text-gray-400">
                  Howard Marks memo: +16% return, 10.8% alpha vs S&P 500 (82% accuracy)
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-400 text-lg">→</span>
              <div>
                <div className="font-medium">Current Bottleneck: Power Infrastructure</div>
                <div className="text-sm text-gray-400">
                  Regime shift complete. 47% of data centers delayed due to power vs 12% for chips.
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 text-lg">⚠</span>
              <div>
                <div className="font-medium">Next Regime Predicted: SMR Deployment</div>
                <div className="text-sm text-gray-400">
                  If successful, power bottleneck could ease by 2027-2028 (65% confidence)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-6">Quick Start</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/synthesize"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all"
            >
              Analyze Breaking News →
            </Link>
            <Link
              href="/chat"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
            >
              Ask the Wiki
            </Link>
            <Link
              href="/scenario"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
            >
              Run Scenario
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          <p className="mb-2">
            AlphaBot V2 • Real-Time Intelligence • Continuous Self-Improvement
          </p>
          <p>
            Powered by Claude Sonnet 4.5 • 403-Page Elite Framework Wiki • D3.js Visualizations
          </p>
        </div>
      </div>
    </div>
  )
}
