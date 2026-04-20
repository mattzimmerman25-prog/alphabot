'use client'

import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Thesis {
  id: string
  title: string
  signal_type: string
  confidence: number
  tickers: string[]
  thesis: string
  generated: string
  bottlenecks: string[]
  news_url: string
}

export default function Home() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, error: fetchError, mutate } = useSWR<{ theses: Thesis[] }>(
    '/api/theses',
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  )

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_items: 5 })
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const result = await response.json()

      // Refresh the theses list
      mutate()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setGenerating(false)
    }
  }

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 80) return 'confidence-high'
    if (confidence >= 60) return 'confidence-medium'
    return 'confidence-low'
  }

  const getSignalClass = (signal: string) => {
    if (signal === 'LONG') return 'signal-long'
    if (signal === 'SHORT') return 'signal-short'
    return 'signal-neutral'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Investment Thesis Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Real-time AI infrastructure investment opportunities synthesized from 403-page LLM wiki + breaking news
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-alphabot-blue hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              '🔄 Generate New Theses'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Signals</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.theses.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">LONG Signals</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {data.theses.filter(t => t.signal_type === 'LONG').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">SHORT Signals</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {data.theses.filter(t => t.signal_type === 'SHORT').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Confidence</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(data.theses.reduce((sum, t) => sum + t.confidence, 0) / data.theses.length) || 0}
            </div>
          </div>
        </div>
      )}

      {/* Theses List */}
      <div className="space-y-4">
        {fetchError && (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Failed to load theses</p>
          </div>
        )}

        {!data && !fetchError && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-alphabot-blue mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading theses...</p>
          </div>
        )}

        {data && data.theses.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No theses generated yet</p>
            <button
              onClick={handleGenerate}
              className="px-6 py-2 bg-alphabot-blue hover:bg-blue-700 text-white font-semibold rounded-lg"
            >
              Generate Your First Thesis
            </button>
          </div>
        )}

        {data && data.theses.map((thesis) => (
          <div key={thesis.id} className="thesis-card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {thesis.title}
                </h3>
                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className={getSignalClass(thesis.signal_type)}>
                    {thesis.signal_type}
                  </span>
                  <span className={getConfidenceClass(thesis.confidence)}>
                    {thesis.confidence}% confidence
                  </span>
                  <span>
                    {new Date(thesis.generated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {thesis.tickers && thesis.tickers.length > 0 && (
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tickers: </span>
                {thesis.tickers.map(ticker => (
                  <span
                    key={ticker}
                    className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm mr-2"
                  >
                    {ticker}
                  </span>
                ))}
              </div>
            )}

            {thesis.bottlenecks && thesis.bottlenecks.length > 0 && (
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bottlenecks: </span>
                {thesis.bottlenecks.map(bottleneck => (
                  <span
                    key={bottleneck}
                    className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-2"
                  >
                    {bottleneck.toUpperCase()}
                  </span>
                ))}
              </div>
            )}

            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
              <p className="line-clamp-3">{thesis.thesis.substring(0, 300)}...</p>
            </div>

            <div className="mt-4 flex space-x-3">
              <a
                href={thesis.news_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-alphabot-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                📰 View Source
              </a>
              <button className="text-sm text-alphabot-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                📄 Full Thesis
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
