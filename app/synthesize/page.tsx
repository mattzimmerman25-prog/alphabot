'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  type: 'status' | 'entities' | 'wiki_context' | 'contradictions' | 'synthesis_chunk' | 'complete' | 'error'
  message?: string
  data?: any
}

export default function SynthesizePage() {
  const [newsTitle, setNewsTitle] = useState('')
  const [newsContent, setNewsContent] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStatus, setCurrentStatus] = useState('')
  const [entities, setEntities] = useState<string[]>([])
  const [contradictions, setContradictions] = useState<any[]>([])
  const [synthesis, setSynthesis] = useState('')
  const synthesisRef = useRef<HTMLDivElement>(null)

  const handleAnalyze = async () => {
    if (!newsTitle || !newsContent) return

    setIsAnalyzing(true)
    setCurrentStatus('Starting analysis...')
    setEntities([])
    setContradictions([])
    setSynthesis('')

    try {
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsTitle, newsContent })
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6)) as Message

            switch (data.type) {
              case 'status':
                setCurrentStatus(data.message || '')
                break

              case 'entities':
                setEntities(data.data || [])
                break

              case 'contradictions':
                setContradictions(data.data || [])
                break

              case 'synthesis_chunk':
                setSynthesis(prev => prev + data.data)
                break

              case 'complete':
                setIsAnalyzing(false)
                setCurrentStatus('Analysis complete')
                break

              case 'error':
                console.error('Analysis error:', data.message)
                setCurrentStatus(`Error: ${data.message}`)
                setIsAnalyzing(false)
                break
            }
          } catch (e) {
            console.error('Parse error:', e)
          }
        }
      }
    } catch (error) {
      console.error('Synthesis error:', error)
      setCurrentStatus('Error during analysis')
      setIsAnalyzing(false)
    }
  }

  // Auto-scroll synthesis as it streams
  useEffect(() => {
    if (synthesisRef.current) {
      synthesisRef.current.scrollTop = synthesisRef.current.scrollHeight
    }
  }, [synthesis])

  // Example news items
  const examples = [
    {
      title: 'Microsoft Announces $10B Data Center Expansion',
      content: 'Microsoft today announced plans to build 5 new data centers with 3 GW of total power capacity, representing a $10B investment in AI infrastructure over the next 18 months.'
    },
    {
      title: 'Oracle Reports $20B AI Infrastructure Shortfall',
      content: 'Oracle announced layoffs of 8,000 employees and scaled back data center plans, citing $20B shortfall in expected AI infrastructure deployment. CFO noted challenges with power delivery and electrical equipment availability.'
    },
    {
      title: 'NVIDIA H200 Demand Exceeds Supply 10x',
      content: 'NVIDIA CEO Jensen Huang reported that H200 GPU demand exceeds supply by 10x, with customers placing orders 18 months in advance. Company raising CapEx by $5B to expand production capacity.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AlphaBot V2: Real-Time Intelligence
          </h1>
          <p className="text-gray-300">
            Synthesize news with 403 pages of elite AI frameworks. Find contradictions. Generate alpha.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">📰 News Input</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">News Title</label>
                  <input
                    type="text"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    placeholder="e.g., Microsoft Announces $10B Data Center Expansion"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">News Content</label>
                  <textarea
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    placeholder="Paste news article content here..."
                    rows={8}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !newsTitle || !newsContent}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    '🚀 Analyze with AlphaBot'
                  )}
                </button>

                {/* Status */}
                {currentStatus && (
                  <div className="flex items-center space-x-2 text-sm text-blue-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>{currentStatus}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Examples */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">💡 Try These Examples</h3>
              <div className="space-y-2">
                {examples.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNewsTitle(example.title)
                      setNewsContent(example.content)
                    }}
                    className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                  >
                    {example.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-4">
            {/* Entities */}
            {entities.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3">🏢 Entities Detected</h3>
                <div className="flex flex-wrap gap-2">
                  {entities.map((entity, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm"
                    >
                      {entity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contradictions */}
            {contradictions.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-red-700">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <span className="text-red-400 mr-2">🚨</span>
                  Contradictions Detected (Where Alpha Lives)
                </h3>
                <div className="space-y-3">
                  {contradictions.map((c, idx) => (
                    <div key={idx} className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-red-300">{c.framework}</span>
                        <span className="text-sm text-red-400">{c.confidence}% confidence</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-1">
                        <span className="text-gray-400">Source:</span> {c.author}
                      </p>
                      <p className="text-sm text-gray-200">{c.contradiction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Synthesis */}
            {synthesis && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3">📊 Investment Thesis</h3>
                <div
                  ref={synthesisRef}
                  className="prose prose-invert max-w-none overflow-y-auto max-h-[600px] text-sm"
                  dangerouslySetInnerHTML={{
                    __html: synthesis
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\[\[(.+?)\]\]/g, '<span class="text-blue-400">&#91;&#91;$1&#93;&#93;</span>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>
            )}

            {!isAnalyzing && !synthesis && (
              <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-gray-400">Enter news above to begin analysis</p>
                <p className="text-sm text-gray-500 mt-2">
                  AlphaBot will query 403 wiki pages, detect contradictions, and generate an investment thesis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
