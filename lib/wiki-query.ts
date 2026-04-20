/**
 * Runtime wiki query utilities
 * Loads and searches the pre-built wiki index
 */

import { cache } from './cache'

interface WikiPage {
  path: string
  type: 'entity' | 'concept' | 'source' | 'synthesis'
  name: string
  content: string
  entities: string[]
  concepts: string[]
  metadata: {
    date?: string
    author?: string
    source_type?: string
  }
}

interface WikiIndex {
  pages: WikiPage[]
  entities: { [key: string]: string[] }
  concepts: { [key: string]: string[] }
  totalPages: number
  lastBuilt: string
}

let cachedIndex: WikiIndex | null = null

/**
 * Load the wiki index (cached after first load)
 */
export async function loadWikiIndex(): Promise<WikiIndex> {
  if (cachedIndex) return cachedIndex

  try {
    const response = await fetch('/wiki-index.json')
    if (!response.ok) {
      throw new Error('Wiki index not found')
    }
    const data = await response.json()
    cachedIndex = data
    return data as WikiIndex
  } catch (error) {
    console.error('Failed to load wiki index:', error)
    // Return empty index as fallback
    const fallbackIndex: WikiIndex = {
      pages: [],
      entities: {},
      concepts: {},
      totalPages: 0,
      lastBuilt: new Date().toISOString()
    }
    return fallbackIndex
  }
}

/**
 * Search wiki by entity name (with caching)
 */
export async function searchByEntity(entityName: string): Promise<WikiPage[]> {
  const cacheKey = `entity:${entityName}`
  const cached = cache.get<WikiPage[]>(cacheKey)

  if (cached) return cached

  const index = await loadWikiIndex()
  const pagePaths = index.entities[entityName] || []
  const result = index.pages.filter(p => pagePaths.includes(p.path))

  // Cache for 15 minutes
  cache.set(cacheKey, result, 15 * 60 * 1000)

  return result
}

/**
 * Search wiki by concept (with caching)
 */
export async function searchByConcept(conceptName: string): Promise<WikiPage[]> {
  const cacheKey = `concept:${conceptName}`
  const cached = cache.get<WikiPage[]>(cacheKey)

  if (cached) return cached

  const index = await loadWikiIndex()
  const pagePaths = index.concepts[conceptName] || []
  const result = index.pages.filter(p => pagePaths.includes(p.path))

  // Cache for 15 minutes
  cache.set(cacheKey, result, 15 * 60 * 1000)

  return result
}

/**
 * Get a specific wiki page by name (with caching)
 */
export async function getPageByName(name: string): Promise<WikiPage | null> {
  const cacheKey = `page:${name}`
  const cached = cache.get<WikiPage | null>(cacheKey)

  if (cached !== null) return cached

  const index = await loadWikiIndex()
  const normalized = name.toLowerCase().replace(/\s+/g, ' ').trim()
  const result = index.pages.find(p =>
    p.name.toLowerCase().replace(/\s+/g, ' ').trim() === normalized
  ) || null

  // Cache for 15 minutes
  cache.set(cacheKey, result, 15 * 60 * 1000)

  return result
}

/**
 * Search wiki content (simple text search, with caching)
 */
export async function searchContent(query: string): Promise<WikiPage[]> {
  const cacheKey = `search:${query.toLowerCase()}`
  const cached = cache.get<WikiPage[]>(cacheKey)

  if (cached) return cached

  const index = await loadWikiIndex()
  const lowerQuery = query.toLowerCase()
  const result = index.pages.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.content.toLowerCase().includes(lowerQuery)
  ).slice(0, 20) // Limit results

  // Cache search results for 10 minutes
  cache.set(cacheKey, result, 10 * 60 * 1000)

  return result
}

/**
 * Get all entities mentioned in wiki
 */
export async function getAllEntities(): Promise<string[]> {
  const index = await loadWikiIndex()
  return Object.keys(index.entities).sort()
}

/**
 * Get all concepts in wiki
 */
export async function getAllConcepts(): Promise<string[]> {
  const index = await loadWikiIndex()
  return Object.keys(index.concepts).sort()
}

/**
 * Get wiki stats
 */
export async function getWikiStats(): Promise<{
  totalPages: number
  entityCount: number
  conceptCount: number
  lastBuilt: string
}> {
  const index = await loadWikiIndex()
  return {
    totalPages: index.totalPages,
    entityCount: Object.keys(index.entities).length,
    conceptCount: Object.keys(index.concepts).length,
    lastBuilt: index.lastBuilt
  }
}

/**
 * Find contradictions between wiki pages
 * Returns pages that mention the same entities/concepts but may have different perspectives
 */
export async function findRelatedPages(
  entities: string[],
  concepts: string[]
): Promise<WikiPage[]> {
  const index = await loadWikiIndex()
  const relatedPaths = new Set<string>()

  // Find all pages mentioning these entities
  entities.forEach(entity => {
    const paths = index.entities[entity] || []
    paths.forEach(p => relatedPaths.add(p))
  })

  // Find all pages mentioning these concepts
  concepts.forEach(concept => {
    const paths = index.concepts[concept] || []
    paths.forEach(p => relatedPaths.add(p))
  })

  return index.pages.filter(p => relatedPaths.has(p.path))
}

/**
 * Build context for synthesis
 * Returns formatted wiki content for Claude prompts
 */
export async function buildWikiContext(
  entities: string[],
  concepts: string[]
): Promise<{
  entityPages: WikiPage[]
  conceptPages: WikiPage[]
  formattedContext: string
}> {
  const entityPages = (await Promise.all(
    entities.map(e => searchByEntity(e))
  )).flat()

  const conceptPages = (await Promise.all(
    concepts.map(c => searchByConcept(c))
  )).flat()

  // Format for Claude
  const context: string[] = []

  if (entityPages.length > 0) {
    context.push('## Relevant Wiki Entities')
    entityPages.slice(0, 10).forEach(page => {
      context.push(`\n### [[${page.name}]]`)
      context.push(`Type: ${page.type}`)
      if (page.metadata.author) context.push(`Author: ${page.metadata.author}`)
      if (page.metadata.date) context.push(`Date: ${page.metadata.date}`)
      context.push(`\n${page.content.substring(0, 1000)}...\n`)
    })
  }

  if (conceptPages.length > 0) {
    context.push('\n## Relevant Wiki Concepts')
    conceptPages.slice(0, 10).forEach(page => {
      context.push(`\n### [[${page.name}]]`)
      context.push(`Type: ${page.type}`)
      context.push(`\n${page.content.substring(0, 1000)}...\n`)
    })
  }

  return {
    entityPages,
    conceptPages,
    formattedContext: context.join('\n')
  }
}
