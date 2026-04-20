'use client'

import { useState, useRef, useEffect } from 'react'
import { exportToPDF } from '@/lib/pdf-exporter'

interface Article {
  id: string
  title: string
  content: string
  url?: string
}

interface Message {
  type: 'status' | 'entities' | 'articles_analyzed' | 'synthesis_chunk' | 'complete' | 'error'
  message?: string
  data?: any
}

export default function BatchAnalysisPage() {
  const [articles, setArticles] = useState<Article[]>([
    { id: '1', title: '', content: '', url: '' }
  ])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStatus, setCurrentStatus] = useState('')
  const [entities, setEntities] = useState<string[]>([])
  const [articleAnalyses, setArticleAnalyses] = useState<any[]>([])
  const [synthesis, setSynthesis] = useState('')
  const synthesisRef = useRef<HTMLDivElement>(null)

  const addArticle = () => {
    if (articles.length >= 10) {
      alert('Maximum 10 articles allowed')
      return
    }
    setArticles([...articles, { id: Date.now().toString(), title: '', content: '', url: '' }])
  }

  const removeArticle = (id: string) => {
    if (articles.length === 1) return
    setArticles(articles.filter(a => a.id !== id))
  }

  const updateArticle = (id: string, field: keyof Article, value: string) => {
    setArticles(articles.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ))
  }

  const handleAnalyze = async () => {
    const validArticles = articles.filter(a => a.title && a.content)

    if (validArticles.length === 0) {
      alert('Please add at least one article with title and content')
      return
    }

    setIsAnalyzing(true)
    setCurrentStatus('Starting batch analysis...')
    setEntities([])
    setArticleAnalyses([])
    setSynthesis('')

    try {
      const response = await fetch('/api/batch-analyze', {
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
            const data = JSON.parse(line.slice(6)) as Message

            switch (data.type) {
              case 'status':
                setCurrentStatus(data.message || '')
                break

              case 'entities':
                setEntities(data.data || [])
                break

              case 'articles_analyzed':
                setArticleAnalyses(data.data || [])
                break

              case 'synthesis_chunk':
                setSynthesis(prev => prev + data.data)
                break

              case 'complete':
                setIsAnalyzing(false)
                setCurrentStatus('Batch analysis complete')
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
      console.error('Batch analysis error:', error)
      setCurrentStatus('Error during analysis')
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    if (synthesisRef.current) {
      synthesisRef.current.scrollTop = synthesisRef.current.scrollHeight
    }
  }, [synthesis])

  const exportReport = () => {
    const content = `# Batch Analysis Report

**Articles Analyzed**: ${articles.filter(a => a.title && a.content).length}
**Entities Detected**: ${entities.join(', ')}

---

## Articles

${articles.filter(a => a.title && a.content).map((a, i) => `
### Article ${i + 1}: ${a.title}
${a.url ? `Source: ${a.url}` : ''}

${a.content.substring(0, 500)}${a.content.length > 500 ? '...' : ''}
`).join('\n---\n')}

---

## Cross-Article Synthesis

${synthesis}`

    exportToPDF({
      title: 'Batch Analysis Report',
      subtitle: `${articles.filter(a => a.title && a.content).length} Articles Analyzed`,
      content,
      metadata: {
        'Generated': new Date().toLocaleString(),
        'Articles': articles.filter(a => a.title && a.content).length.toString(),
        'Entities': entities.length.toString()
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Batch Analysis Mode
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Analyze multiple articles simultaneously. Find patterns, contradictions, and investment opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">📄 Articles ({articles.length}/10)</h2>
                <button
                  onClick={addArticle}
                  disabled={articles.length >= 10}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Article
                </button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {articles.map((article, idx) => (
                  <div key={article.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold">Article {idx + 1}</span>
                      {articles.length > 1 && (
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
                        <label className="block text-xs font-medium mb-1">Title</label>
                        <input
                          type="text"
                          value={article.title}
                          onChange={(e) => updateArticle(article.id, 'title', e.target.value)}
                          placeholder="Article title..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">URL (optional)</label>
                        <input
                          type="url"
                          value={article.url}
                          onChange={(e) => updateArticle(article.id, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Content</label>
                        <textarea
                          value={article.content}
                          onChange={(e) => updateArticle(article.id, 'content', e.target.value)}
                          placeholder="Paste article content..."
                          rows={4}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || articles.filter(a => a.title && a.content).length === 0}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  `🚀 Analyze ${articles.filter(a => a.title && a.content).length} Articles`
                )}
              </button>

              {currentStatus && (
                <div className="mt-4 flex items-center space-x-2 text-sm text-blue-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>{currentStatus}</span>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-700 text-sm">
              <h3 className="font-semibold mb-2">💡 How Batch Analysis Works</h3>
              <ul className="space-y-1 text-gray-300 text-xs">
                <li>• Analyzes up to 10 articles simultaneously</li>
                <li>• Finds common themes and contradictions across articles</li>
                <li>• Cross-references all articles with wiki frameworks</li>
                <li>• Identifies consensus vs debate areas</li>
                <li>• Generates unified investment thesis</li>
                <li>• Export comprehensive PDF report</li>
              </ul>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-4">
            {/* Entities */}
            {entities.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3">🏢 Entities Across All Articles</h3>
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

            {/* Article Analyses */}
            {articleAnalyses.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3">📊 Individual Article Scores</h3>
                <div className="space-y-2">
                  {articleAnalyses.map((analysis, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">Article {idx + 1}</div>
                        <div className="text-xs text-gray-400 truncate">{analysis.title}</div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className={`text-xl font-bold ${
                          analysis.contradictionScore.score > 70 ? 'text-red-400' :
                          analysis.contradictionScore.score > 40 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {analysis.contradictionScore.score}
                        </div>
                        <div className="text-xs text-gray-400">{analysis.contradictions.length} issues</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Synthesis */}
            {synthesis && (
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">📈 Cross-Article Synthesis</h3>
                  <button
                    onClick={exportReport}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                  </button>
                </div>
                <div
                  ref={synthesisRef}
                  className="prose prose-invert max-w-none overflow-y-auto max-h-[600px] text-sm"
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
            )}

            {!synthesis && !isAnalyzing && (
              <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-400">Add articles and click analyze to begin</p>
                <p className="text-sm text-gray-500 mt-2">
                  Batch mode will find patterns and contradictions across all articles
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
