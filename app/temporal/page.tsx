'use client'

import { useState, useEffect } from 'react'
import {
  getCredibilityLeaderboard,
  getRegimeHistory,
  getCurrentBottleneck,
  predictNextRegime,
  getAccuracyStats,
  getPredictionsBySource,
  type SourceCredibility,
  type RegimeChange,
  type Prediction
} from '@/lib/temporal-tracker'

export default function TemporalPage() {
  const [leaderboard, setLeaderboard] = useState<SourceCredibility[]>([])
  const [regimes, setRegimes] = useState<RegimeChange[]>([])
  const [currentBottleneck, setCurrentBottleneck] = useState<RegimeChange | null>(null)
  const [nextRegime, setNextRegime] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [sourcePredictions, setSourcePredictions] = useState<Prediction[]>([])

  useEffect(() => {
    setLeaderboard(getCredibilityLeaderboard())
    setRegimes(getRegimeHistory())
    setCurrentBottleneck(getCurrentBottleneck())
    setNextRegime(predictNextRegime())
    setStats(getAccuracyStats())
  }, [])

  const handleSourceClick = (source: string) => {
    setSelectedSource(source)
    setSourcePredictions(getPredictionsBySource(source))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Temporal Analysis: Predictions vs Reality
          </h1>
          <p className="text-gray-300">
            Track which frameworks are most accurate. Learn from prediction outcomes.
          </p>
        </div>

        {/* Overall Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">{stats.totalPredictions}</div>
              <div className="text-sm text-gray-400">Total Predictions</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl font-bold text-green-400">{stats.verified}</div>
              <div className="text-sm text-gray-400">Verified</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-yellow-700">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-2xl font-bold text-purple-400">{stats.overallAccuracy.toFixed(0)}%</div>
              <div className="text-sm text-gray-400">Overall Accuracy</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Credibility Leaderboard */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">📊 Source Credibility Leaderboard</h2>
            <p className="text-sm text-gray-400 mb-4">
              Ranked by prediction accuracy. Click to see details.
            </p>

            <div className="space-y-3">
              {leaderboard.map((source, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSourceClick(source.source)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedSource === source.source
                      ? 'bg-blue-900/50 border-blue-600'
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg font-semibold">#{idx + 1}</span>
                        <span className="font-medium">{source.source.replace(/\[\[|\]\]/g, '')}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{source.totalPredictions} predictions</span>
                        <span>•</span>
                        <span className="text-green-400">✓ {source.correctPredictions}</span>
                        <span className="text-red-400">✗ {source.incorrectPredictions}</span>
                        {source.leadTime > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400">{source.leadTime}mo lead</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`text-2xl font-bold ${
                        source.overallAccuracy >= 80 ? 'text-green-400' :
                        source.overallAccuracy >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {source.overallAccuracy.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Category breakdown */}
                  {selectedSource === source.source && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="text-sm text-gray-400 mb-2">Category Accuracy:</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(source.categoryAccuracy)
                          .filter(([_, acc]) => acc > 0)
                          .map(([cat, acc]) => (
                            <div key={cat} className="flex justify-between">
                              <span className="text-gray-300 capitalize">{cat}:</span>
                              <span className={`font-semibold ${
                                acc >= 80 ? 'text-green-400' :
                                acc >= 60 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {acc.toFixed(0)}%
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Current Bottleneck & Next Regime */}
          <div className="space-y-6">
            {/* Current Bottleneck */}
            {currentBottleneck && (
              <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg p-6 border border-red-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2">🔥</span>
                  Current Bottleneck
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Regime Change</div>
                    <div className="text-lg font-semibold">
                      {currentBottleneck.from} → <span className="text-red-400">{currentBottleneck.to}</span>
                    </div>
                    <div className="text-sm text-gray-400">Since {currentBottleneck.date}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Evidence:</div>
                    <ul className="space-y-1">
                      {currentBottleneck.evidence.map((e, idx) => (
                        <li key={idx} className="text-sm text-gray-300">• {e}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-red-800">
                    <div className="text-sm text-gray-400 mb-1">Investment Implication:</div>
                    <div className="text-sm font-medium text-yellow-300">
                      {currentBottleneck.investmentImplication}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Significance:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                          style={{ width: `${currentBottleneck.significance}%` }}
                        />
                      </div>
                      <span className="font-semibold">{currentBottleneck.significance}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Regime Prediction */}
            {nextRegime && (
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2">🔮</span>
                  Next Regime Prediction
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Likely Next Bottleneck</div>
                    <div className="text-lg font-semibold text-blue-300">
                      {nextRegime.likely}
                    </div>
                    <div className="text-sm text-gray-400">Timeframe: {nextRegime.timeframe}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Evidence:</div>
                    <ul className="space-y-1">
                      {nextRegime.evidence.map((e: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-300">• {e}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-3 border-t border-blue-800">
                    <span className="text-gray-400">Prediction Confidence:</span>
                    <span className="font-semibold text-blue-300">{nextRegime.confidence}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Regime Change Timeline */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">📈 Bottleneck Evolution Timeline</h2>
          <p className="text-sm text-gray-400 mb-6">
            Track how AI infrastructure constraints evolved over time
          </p>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-700 ml-4" />

            {/* Timeline events */}
            <div className="space-y-6">
              {regimes.map((regime, idx) => (
                <div key={idx} className="relative pl-12">
                  {/* Dot */}
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    idx === regimes.length - 1 ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                    <span className="text-xs font-bold">{idx + 1}</span>
                  </div>

                  {/* Content */}
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm text-gray-400">{regime.date}</div>
                        <div className="font-semibold">
                          {regime.from} → <span className="text-blue-400">{regime.to}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 capitalize">
                        {regime.category}
                      </div>
                    </div>

                    <div className="text-sm text-gray-300 mb-2">
                      💰 {regime.investmentImplication}
                    </div>

                    <div className="text-xs text-gray-400">
                      Significance: {regime.significance}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Source Predictions Detail */}
        {selectedSource && sourcePredictions.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Predictions: {selectedSource.replace(/\[\[|\]\]/g, '')}
              </h2>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {sourcePredictions.map((pred, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    pred.outcome === 'correct' ? 'bg-green-900/20 border-green-700' :
                    pred.outcome === 'incorrect' ? 'bg-red-900/20 border-red-700' :
                    'bg-yellow-900/20 border-yellow-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm text-gray-400">{pred.date}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-700 capitalize">
                          {pred.category}
                        </span>
                        {pred.outcome && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            pred.outcome === 'correct' ? 'bg-green-600' :
                            pred.outcome === 'incorrect' ? 'bg-red-600' :
                            'bg-yellow-600'
                          }`}>
                            {pred.outcome}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium mb-2">{pred.claim}</div>
                      {pred.verificationEvidence && (
                        <div className="text-xs text-gray-400">
                          Verified ({pred.verificationDate}): {pred.verificationEvidence}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Confidence</div>
                        <div className="font-semibold">{pred.confidence}%</div>
                        {pred.accuracyScore !== undefined && (
                          <>
                            <div className="text-xs text-gray-400 mt-1">Score</div>
                            <div className={`font-semibold ${
                              pred.accuracyScore >= 80 ? 'text-green-400' :
                              pred.accuracyScore >= 60 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {pred.accuracyScore}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
