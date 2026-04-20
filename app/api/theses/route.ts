import { NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

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

export async function GET() {
  try {
    // Read thesis files from output directory
    const outputDir = path.join(process.cwd(), 'output', 'theses')

    try {
      const files = await readdir(outputDir)
      const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('daily_report'))

      const theses: Thesis[] = []

      // Parse markdown files (limit to 20 most recent)
      for (const file of mdFiles.slice(-20)) {
        try {
          const filePath = path.join(outputDir, file)
          const content = await readFile(filePath, 'utf-8')

          // Extract metadata from markdown
          const thesis = parseThesisMarkdown(content, file)
          if (thesis) {
            theses.push(thesis)
          }
        } catch (err) {
          console.error(`Error reading ${file}:`, err)
          continue
        }
      }

      // Sort by date (most recent first)
      theses.sort((a, b) => new Date(b.generated).getTime() - new Date(a.generated).getTime())

      return NextResponse.json({ theses })

    } catch (err) {
      // Directory doesn't exist or is empty - return empty array
      console.log('No theses directory found or empty, returning empty array')
      return NextResponse.json({ theses: [] })
    }

  } catch (error) {
    console.error('Error fetching theses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theses' },
      { status: 500 }
    )
  }
}

function parseThesisMarkdown(content: string, filename: string): Thesis | null {
  try {
    // Extract data from markdown format
    const lines = content.split('\n')

    // Extract title (first # heading)
    const titleMatch = content.match(/^# (.+)$/m)
    const title = titleMatch ? titleMatch[1] : filename

    // Extract signal type from title or filename
    let signal_type = 'NEUTRAL'
    if (filename.includes('_LONG_') || content.includes('**Signal**: LONG')) {
      signal_type = 'LONG'
    } else if (filename.includes('_SHORT_') || content.includes('**Signal**: SHORT')) {
      signal_type = 'SHORT'
    }

    // Extract confidence
    const confMatch = content.match(/\*\*Confidence\*\*:\s*(\d+)/)
    const confidence = confMatch ? parseInt(confMatch[1]) : 50

    // Extract tickers
    const tickerMatch = content.match(/\*\*Tickers\*\*:\s*(.+)$/m)
    const tickers = tickerMatch
      ? tickerMatch[1].split(',').map(t => t.trim()).filter(t => t && t !== 'N/A')
      : []

    // Extract generated date
    const dateMatch = content.match(/\*\*Generated\*\*:\s*(.+)$/m)
    const generated = dateMatch ? dateMatch[1].trim() : new Date().toISOString()

    // Extract bottlenecks
    const bottlenecks: string[] = []
    if (content.includes('POWER')) bottlenecks.push('power')
    if (content.includes('CHIPS')) bottlenecks.push('chips')
    if (content.includes('CAPITAL')) bottlenecks.push('capital')
    if (content.includes('ROI')) bottlenecks.push('roi')
    if (content.includes('TALENT')) bottlenecks.push('talent')
    if (content.includes('REGULATION')) bottlenecks.push('regulation')

    // Extract thesis (Executive Summary or first few paragraphs)
    const summaryMatch = content.match(/## Executive Summary\n\n### Thesis\n([\s\S]+?)(?=\n##|\n\*\*|$)/)
    const thesis = summaryMatch
      ? summaryMatch[1].trim()
      : content.substring(0, 500)

    // Extract news URL
    const urlMatch = content.match(/\*\*Source\*\*:\s*\[.+?\]\((.+?)\)/)
    const news_url = urlMatch ? urlMatch[1] : ''

    return {
      id: filename,
      title,
      signal_type,
      confidence,
      tickers,
      thesis,
      generated,
      bottlenecks,
      news_url,
    }

  } catch (err) {
    console.error('Error parsing thesis:', err)
    return null
  }
}
