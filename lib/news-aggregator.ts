/**
 * News aggregation and RSS feed parsing
 * Fetches real-time news from multiple sources
 */

export interface NewsArticle {
  id: string
  title: string
  description: string
  content: string
  url: string
  source: string
  publishedAt: Date
  category: 'ai' | 'tech' | 'finance' | 'semiconductor' | 'energy' | 'general'
  relevanceScore?: number
}

export interface NewsFeed {
  name: string
  url: string
  category: NewsArticle['category']
  type: 'rss' | 'api'
}

/**
 * Curated news feeds focused on AI infrastructure and investment
 */
export const NEWS_FEEDS: NewsFeed[] = [
  // AI & Tech
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', category: 'ai', type: 'rss' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', category: 'ai', type: 'rss' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', category: 'ai', type: 'rss' },

  // Semiconductors & Hardware
  { name: 'Tom\'s Hardware', url: 'https://www.tomshardware.com/feeds/all', category: 'semiconductor', type: 'rss' },
  { name: 'AnandTech', url: 'https://www.anandtech.com/rss/', category: 'semiconductor', type: 'rss' },

  // Finance & Markets
  { name: 'Bloomberg Tech', url: 'https://www.bloomberg.com/feed/podcast/etf-iq.xml', category: 'finance', type: 'rss' },
  { name: 'WSJ Tech', url: 'https://feeds.a.dj.com/rss/RSSWSJD.xml', category: 'tech', type: 'rss' },

  // Energy & Infrastructure
  { name: 'Energy News', url: 'https://www.energy.gov/rss/all.rss', category: 'energy', type: 'rss' },
]

/**
 * Parse RSS feed to extract articles
 */
export async function parseRSSFeed(feedUrl: string): Promise<Partial<NewsArticle>[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'AlphaBot/2.0'
      }
    })

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`)
    }

    const xmlText = await response.text()

    // Simple RSS parsing (in production, use a proper XML parser library)
    const articles: Partial<NewsArticle>[] = []

    // Extract items using regex (basic implementation)
    const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g)

    for (const match of itemMatches) {
      const itemContent = match[1]

      const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || ''
      const description = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] || ''
      const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || ''
      const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

      if (title && link) {
        articles.push({
          title: title.replace(/<[^>]*>/g, ''),
          description: description.replace(/<[^>]*>/g, ''),
          url: link.trim(),
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
        })
      }
    }

    return articles.slice(0, 10) // Limit to recent 10 articles
  } catch (error) {
    console.error('RSS parsing error:', error)
    return []
  }
}

/**
 * Calculate relevance score based on keywords
 */
export function calculateRelevanceScore(article: Partial<NewsArticle>): number {
  const text = `${article.title} ${article.description}`.toLowerCase()

  // High-value keywords from wiki frameworks
  const highValueKeywords = [
    'nvidia', 'tsmc', 'microsoft', 'openai', 'anthropic', 'google',
    'gpu', 'chip', 'semiconductor', 'data center', 'capex',
    'power', 'energy', 'smr', 'nuclear', 'grid',
    'hbm', 'cowos', 'packaging', 'bottleneck',
    'ai', 'llm', 'gpt', 'claude', 'gemini',
    'scaling', 'inference', 'training', 'compute',
    'roi', 'revenue', 'earnings', 'investment'
  ]

  let score = 0
  for (const keyword of highValueKeywords) {
    if (text.includes(keyword)) {
      score += 1
    }
  }

  // Boost for enterprise/financial keywords
  const financialKeywords = ['billion', 'revenue', 'earnings', 'investment', 'ipo', 'valuation']
  for (const keyword of financialKeywords) {
    if (text.includes(keyword)) {
      score += 2
    }
  }

  return score
}

/**
 * Fetch and aggregate news from all configured feeds
 */
export async function aggregateNews(
  categories?: NewsArticle['category'][]
): Promise<NewsArticle[]> {
  const feedsToFetch = categories
    ? NEWS_FEEDS.filter(f => categories.includes(f.category))
    : NEWS_FEEDS

  const allArticles: NewsArticle[] = []

  // Fetch feeds in parallel
  const feedPromises = feedsToFetch.map(async (feed) => {
    try {
      const articles = await parseRSSFeed(feed.url)

      return articles.map((article, idx) => ({
        id: `${feed.name}-${Date.now()}-${idx}`,
        title: article.title || 'Untitled',
        description: article.description || '',
        content: article.description || '',
        url: article.url || '',
        source: feed.name,
        publishedAt: article.publishedAt || new Date(),
        category: feed.category,
        relevanceScore: calculateRelevanceScore(article)
      } as NewsArticle))
    } catch (error) {
      console.error(`Failed to fetch ${feed.name}:`, error)
      return []
    }
  })

  const results = await Promise.all(feedPromises)

  // Flatten and sort by relevance
  results.forEach(articles => allArticles.push(...articles))

  return allArticles
    .filter(a => a.relevanceScore && a.relevanceScore > 0)
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 50) // Return top 50 most relevant
}

/**
 * Get trending topics from aggregated news
 */
export function getTrendingTopics(articles: NewsArticle[]): Map<string, number> {
  const topics = new Map<string, number>()

  const allText = articles.map(a => `${a.title} ${a.description}`).join(' ').toLowerCase()

  const keywords = [
    'nvidia', 'openai', 'microsoft', 'google', 'anthropic', 'meta',
    'gpu', 'chip', 'ai', 'llm', 'data center', 'cloud',
    'power', 'energy', 'nuclear', 'smr',
    'investment', 'revenue', 'earnings', 'ipo'
  ]

  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    const matches = allText.match(regex)
    if (matches) {
      topics.set(keyword, matches.length)
    }
  }

  return new Map([...topics.entries()].sort((a, b) => b[1] - a[1]))
}

/**
 * Filter articles by entity or concept mentioned
 */
export function filterByEntity(articles: NewsArticle[], entity: string): NewsArticle[] {
  const lowerEntity = entity.toLowerCase()
  return articles.filter(a =>
    a.title.toLowerCase().includes(lowerEntity) ||
    a.description.toLowerCase().includes(lowerEntity)
  )
}
