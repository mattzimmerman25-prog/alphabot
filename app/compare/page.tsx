'use client'

import { useState, useRef, useEffect } from 'react'

interface NewsArticle {
  id: string
  title: string
  content: string
}

interface ComparisonResult {
  type: 'status' | 'synthesis_chunk' | 'complete' | 'error'
  message?: string
  data?: any
}

export default function ComparePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([
    { id: '1', title: '', content: '' },
    { id: '2', title: '', content: '' },
  ])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStatus, setCurrentStatus] = useState('')
  const [synthesis, setSynthesis] = useState('')
  const synthesisRef = useRef<HTMLDivElement>(null)

  const addArticle = () => {
    if (articles.length < 5) {
      setArticles([...articles, { id: Date.now().toString(), title: '', content: '' }])
    }
  }

  const removeArticle = (id: string) => {
    if (articles.length > 2) {
      setArticles(articles.filter(a => a.id !== id))
    }
  }

  const updateArticle = (id: string, field: 'title' | 'content', value: string) => {
    setArticles(articles.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ))
  }

  const handleCompare = async () => {
    const validArticles = articles.filter(a => a.title && a.content)
    if (validArticles.length < 2) return

    setIsAnalyzing(true)
    setCurrentStatus('Starting multi-news analysis...')
    setSynthesis('')

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles: validArticles })
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
            const data = JSON.parse(line.slice(6)) as ComparisonResult

            switch (data.type) {
              case 'status':
                setCurrentStatus(data.message || '')
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
      console.error('Comparison error:', error)
      setCurrentStatus('Error during analysis')
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    if (synthesisRef.current) {
      synthesisRef.current.scrollTop = synthesisRef.current.scrollHeight
    }
  }, [synthesis])

  const exampleSets = [
    {
      name: 'Power Constraint Debate',
      articles: [
        {
          title: 'Microsoft Announces $10B Data Center Expansion',
          content: 'Microsoft today announced plans to build 5 new data centers with 3 GW of total power capacity, representing a $10B investment in AI infrastructure over the next 18 months.'
        },
        {
          title: 'Oracle Reports $20B AI Infrastructure Shortfall',
          content: 'Oracle announced layoffs of 8,000 employees and scaled back data center plans, citing $20B shortfall in expected AI infrastructure deployment. CFO noted challenges with power delivery and electrical equipment availability.'
        }
      ]
    },
    {
      name: 'Scaling Debate',
      articles: [
        {
          title: 'OpenAI: GPT-5 Exceeds All Benchmarks',
          content: 'OpenAI announced GPT-5 has achieved unprecedented performance on reasoning tasks, with CEO Sam Altman stating "scaling laws continue to hold, we see a clear path to AGI".'
        },
        {
          title: 'Skeptics Warn of AI Limitations',
          content: 'Researchers including Gary Marcus and Daron Acemoglu published papers warning that current AI scaling approaches face fundamental limits and economic ROI remains unproven for most use cases.'
        }
      ]
    }
  ]

  const loadExample = (exampleSet: typeof exampleSets[0]) => {
    setArticles(exampleSet.articles.map((a, idx) => ({
      id: (idx + 1).toString(),
      title: a.title,
      content: a.content
    })))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Multi-News Comparison
          </h1>
          <p className="text-gray-300">
            Compare 2-5 news articles. Find contradictions. Generate unified thesis.
          </p>
        </div>

        {/* Example Sets */}
        <div className="mb-6 flex flex-wrap gap-3">
          <span className="text-sm text-gray-400 self-center">Quick load:</span>
          {exampleSets.map((set, idx) => (
            <button
              key={idx}
              onClick={() => loadExample(set)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm border border-gray-700 transition-colors"
            >
              {set.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">📰 News Articles ({articles.length}/5)</h2>
                {articles.length < 5 && (
                  <button
                    onClick={addArticle}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                  >
                    + Add Article
                  </button>
                )}
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {articles.map((article, idx) => (
                  <div key={article.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-300">Article {idx + 1}</span>
                      {articles.length > 2 && (
                        <button
                          onClick={() => removeArticle(article.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                          type="text"
                          value={article.title}
                          onChange={(e) => updateArticle(article.id, 'title', e.target.value)}
                          placeholder="News headline..."
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Content</label>
                        <textarea
                          value={article.content}
                          onChange={(e) => updateArticle(article.id, 'content', e.target.value)}
                          placeholder="Article content..."
                          rows={4}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCompare}
                disabled={isAnalyzing || articles.filter(a => a.title && a.content).length < 2}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Comparing...
                  </span>
                ) : (
                  '🔍 Compare & Synthesize'
                )}
              </button>

              {currentStatus && (
                <div className="mt-3 flex items-center space-x-2 text-sm text-blue-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>{currentStatus}</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-sm">
              <h3 className="font-semibold mb-2">How it works:</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Add 2-5 news articles to compare</li>
                <li>• AlphaBot finds contradictions between them</li>
                <li>• Wiki frameworks provide context</li>
                <li>• Unified synthesis shows market mispricing</li>
                <li>• Investment thesis with specific tickers</li>
              </ul>
            </div>
          </div>

          {/* Synthesis Panel */}
          <div>
            {synthesis ? (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3">📊 Comparative Analysis</h3>
                <div
                  ref={synthesisRef}
                  className="prose prose-invert max-w-none overflow-y-auto max-h-[700px] text-sm"
                  dangerouslySetInnerHTML={{
                    __html: synthesis
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\[\[(.+?)\]\]/g, '<span class="text-blue-400">&#91;&#91;$1&#93;&#93;</span>')
                      .replace(/### (.+)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                      .replace(/## (.+)/g, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📰</div>
                  <p className="text-gray-400">Add articles above to begin comparison</p>
                  <p className="text-sm text-gray-500 mt-2">
                    AlphaBot will find contradictions and generate unified thesis
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
