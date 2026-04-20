'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { aggregateNews, getTrendingTopics, filterByEntity, type NewsArticle } from '@/lib/news-aggregator'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { ListSkeleton } from '@/components/LoadingSkeleton'

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [trending, setTrending] = useState<Map<string, number>>(new Map())

  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    loadNews()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [selectedCategory, debouncedSearch, articles])

  const loadNews = async () => {
    setIsLoading(true)
    try {
      const news = await aggregateNews()
      setArticles(news)
      setFilteredArticles(news)
      setTrending(getTrendingTopics(news))
    } catch (error) {
      console.error('Failed to load news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = articles

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory)
    }

    if (debouncedSearch) {
      filtered = filterByEntity(filtered, debouncedSearch)
    }

    setFilteredArticles(filtered)
  }

  const categories = [
    { value: 'all', label: 'All News', icon: '📰' },
    { value: 'ai', label: 'AI', icon: '🤖' },
    { value: 'tech', label: 'Tech', icon: '💻' },
    { value: 'semiconductor', label: 'Semiconductors', icon: '🔬' },
    { value: 'finance', label: 'Finance', icon: '💰' },
    { value: 'energy', label: 'Energy', icon: '⚡' },
  ]

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Live News Feed
              </h1>
              <p className="text-sm sm:text-base text-gray-300">
                Real-time news aggregated from {articles.length} sources • Auto-ranked by relevance
              </p>
            </div>
            <button
              onClick={loadNews}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, entity, or keyword..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* News List */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <ListSkeleton items={10} />
            ) : filteredArticles.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-400">No articles found matching your filters</p>
              </div>
            ) : (
              filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-gray-800/50 backdrop-blur rounded-lg p-4 sm:p-6 border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs capitalize">
                          {article.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {article.source}
                        </span>
                        <span className="text-xs text-gray-500">
                          • {getTimeSince(article.publishedAt)}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-100">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {article.description}
                      </p>
                    </div>
                    {article.relevanceScore && article.relevanceScore > 5 && (
                      <div className="ml-4">
                        <div className="px-3 py-1 bg-blue-900/50 border border-blue-700 rounded-lg text-center">
                          <div className="text-lg font-bold text-blue-400">
                            {article.relevanceScore}
                          </div>
                          <div className="text-xs text-gray-400">Score</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/synthesize?url=${encodeURIComponent(article.url)}&title=${encodeURIComponent(article.title)}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Analyze Now
                    </Link>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      Read Article
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Trending Sidebar */}
          <div className="space-y-4">
            <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 sm:p-6 border border-gray-700 sticky top-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">🔥 Trending Now</h3>
              {trending.size === 0 ? (
                <p className="text-sm text-gray-400">Loading trends...</p>
              ) : (
                <div className="space-y-3">
                  {Array.from(trending.entries()).slice(0, 10).map(([topic, count]) => (
                    <button
                      key={topic}
                      onClick={() => setSearchQuery(topic)}
                      className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                      <span className="text-sm font-medium capitalize">{topic}</span>
                      <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-xs font-semibold">
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-700">
              <h3 className="font-semibold mb-2 text-sm">💡 Pro Tip</h3>
              <p className="text-xs text-gray-300">
                Articles are auto-ranked by relevance to your wiki frameworks. Higher scores mean more contradiction potential and alpha opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
