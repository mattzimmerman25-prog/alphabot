/**
 * Build-time script to index the 403-page wiki
 * Generates wiki-index.json for runtime queries
 */

import fs from 'fs'
import path from 'path'

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
  entities: { [key: string]: string[] } // entity name -> page paths
  concepts: { [key: string]: string[] } // concept name -> page paths
  totalPages: number
  lastBuilt: string
}

const WIKI_ROOT = path.join(process.cwd(), '..', 'wiki')

function findWikiFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      // Skip _templates directory
      if (file !== '_templates' && file !== '.git') {
        findWikiFiles(filePath, fileList)
      }
    } else if (file.endsWith('.md') && file !== 'index.md' && file !== 'log.md') {
      fileList.push(filePath)
    }
  })

  return fileList
}

function parseWikiPage(filePath: string): WikiPage | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const relativePath = path.relative(WIKI_ROOT, filePath)

    // Extract type from directory structure
    let type: WikiPage['type'] = 'synthesis'
    if (relativePath.includes('entities')) type = 'entity'
    else if (relativePath.includes('concepts')) type = 'concept'
    else if (relativePath.includes('sources')) type = 'source'

    // Extract name from filename (remove extension, convert dashes to spaces)
    const fileName = path.basename(filePath, '.md')
    const name = fileName.replace(/-/g, ' ')

    // Extract metadata from YAML frontmatter
    const metadata: WikiPage['metadata'] = {}
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (yamlMatch) {
      const yaml = yamlMatch[1]
      const dateMatch = yaml.match(/date:\s*(\S+)/)
      if (dateMatch) metadata.date = dateMatch[1]

      const authorMatch = yaml.match(/(?:author|speaker_author):\s*(.+)/)
      if (authorMatch) metadata.author = authorMatch[1].trim()

      const sourceTypeMatch = yaml.match(/source_type:\s*(\S+)/)
      if (sourceTypeMatch) metadata.source_type = sourceTypeMatch[1]
    }

    // Extract wikilinks
    const entities: string[] = []
    const concepts: string[] = []

    const wikiLinkRegex = /\[\[(.+?)\]\]/g
    let match
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      const link = match[1]
      // Heuristic: capitalized links are entities, lowercase/kebab-case are concepts
      if (link.match(/^[A-Z]/) || link.includes(' ')) {
        entities.push(link)
      } else {
        concepts.push(link)
      }
    }

    return {
      path: relativePath,
      type,
      name,
      content: content.substring(0, 5000), // Store first 5000 chars
      entities: [...new Set(entities)],
      concepts: [...new Set(concepts)],
      metadata
    }
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error)
    return null
  }
}

function buildWikiIndex(): WikiIndex {
  console.log('Building wiki index...')
  console.log('Wiki root:', WIKI_ROOT)

  if (!fs.existsSync(WIKI_ROOT)) {
    console.error('Wiki directory not found at:', WIKI_ROOT)
    console.log('Creating empty index...')
    return {
      pages: [],
      entities: {},
      concepts: {},
      totalPages: 0,
      lastBuilt: new Date().toISOString()
    }
  }

  const wikiFiles = findWikiFiles(WIKI_ROOT)
  console.log(`Found ${wikiFiles.length} wiki files`)

  const pages: WikiPage[] = []
  const entityIndex: { [key: string]: string[] } = {}
  const conceptIndex: { [key: string]: string[] } = {}

  wikiFiles.forEach(filePath => {
    const page = parseWikiPage(filePath)
    if (page) {
      pages.push(page)

      // Index entities
      page.entities.forEach(entity => {
        if (!entityIndex[entity]) entityIndex[entity] = []
        entityIndex[entity].push(page.path)
      })

      // Index concepts
      page.concepts.forEach(concept => {
        if (!conceptIndex[concept]) conceptIndex[concept] = []
        conceptIndex[concept].push(page.path)
      })
    }
  })

  const index: WikiIndex = {
    pages,
    entities: entityIndex,
    concepts: conceptIndex,
    totalPages: pages.length,
    lastBuilt: new Date().toISOString()
  }

  console.log(`Indexed ${index.totalPages} pages`)
  console.log(`Found ${Object.keys(entityIndex).length} unique entities`)
  console.log(`Found ${Object.keys(conceptIndex).length} unique concepts`)

  return index
}

// Run the indexer
const index = buildWikiIndex()

// Save to public directory for runtime access
const outputPath = path.join(process.cwd(), 'public', 'wiki-index.json')
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2))

console.log(`Wiki index saved to: ${outputPath}`)
console.log(`Total size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`)
