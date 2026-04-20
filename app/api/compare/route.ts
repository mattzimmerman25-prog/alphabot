import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildWikiContext } from '@/lib/wiki-query'
import { detectContradictions, calculateContradictionScore } from '@/lib/contradiction-detector'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface NewsArticle {
  title: string
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { articles } = await req.json() as { articles: NewsArticle[] }

    if (!articles || articles.length < 2) {
      return Response.json({ error: 'At least 2 articles required' }, { status: 400 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        const sendSSE = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          sendSSE({ type: 'status', message: `Analyzing ${articles.length} news articles...` })

          // Extract entities from all articles combined
          const combinedText = articles.map(a => a.title + ' ' + a.content).join(' ')
          const entities = extractEntitiesFromText(combinedText)

          sendSSE({ type: 'status', message: 'Detecting contradictions across articles...' })

          // Detect contradictions for each article
          const allContradictions = []
          for (let i = 0; i < articles.length; i++) {
            const articleContradictions = await detectContradictions(
              articles[i].content,
              articles[i].title
            )
            allContradictions.push({
              articleIndex: i,
              title: articles[i].title,
              contradictions: articleContradictions
            })
          }

          sendSSE({ type: 'status', message: 'Querying wiki for context...' })

          // Build comprehensive wiki context
          const concepts: string[] = []
          if (combinedText.toLowerCase().includes('power') || combinedText.toLowerCase().includes('data center')) {
            concepts.push('power-constraints', 'electrician-shortage')
          }
          if (combinedText.toLowerCase().includes('debt') || combinedText.toLowerCase().includes('financing')) {
            concepts.push('debt-financed-AI')
          }
          if (combinedText.toLowerCase().includes('roi') || combinedText.toLowerCase().includes('adoption')) {
            concepts.push('enterprise-AI-ROI', 'AI-high-performers')
          }
          if (combinedText.toLowerCase().includes('scaling')) {
            concepts.push('scaling-laws')
          }

          const wikiContext = await buildWikiContext(entities, concepts)

          sendSSE({ type: 'status', message: 'Synthesizing comparative analysis...' })

          // Build comprehensive prompt
          const prompt = buildComparisonPrompt(articles, allContradictions, wikiContext)

          // Stream Claude's comparative synthesis
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 6000,
            temperature: 0.3,
            system: `You are AlphaBot V2, comparing multiple news articles through the lens of elite AI frameworks.

Your job: Find contradictions BETWEEN articles and WITHIN each article vs wiki frameworks.

Output format:

## Executive Summary
[Which articles agree? Which contradict? What's the market missing?]

## Article-by-Article Analysis
For each article:
- Key claims
- Contradictions with other articles
- Contradictions with wiki frameworks
- Investment implications

## Cross-Article Synthesis
- Where do articles agree? (Consensus view)
- Where do they contradict? (Debate/uncertainty)
- What does the wiki say? (Elite frameworks)
- Where is alpha? (Mispricing opportunities)

## Unified Investment Thesis
- LONG opportunities with tickers
- SHORT opportunities with tickers
- Overall confidence score
- Risk factors

Cite every claim with [[wikilinks]].`,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })

          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta') {
              sendSSE({
                type: 'synthesis_chunk',
                data: chunk.delta.text
              })
            }
          }

          sendSSE({ type: 'complete' })
          controller.close()

        } catch (error) {
          console.error('Comparison error:', error)
          sendSSE({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    return Response.json(
      { error: 'Failed to compare articles' },
      { status: 500 }
    )
  }
}

function extractEntitiesFromText(text: string): string[] {
  const entities = new Set<string>()

  const companies = [
    'Microsoft', 'Google', 'Meta', 'Amazon', 'Apple', 'NVIDIA', 'AMD',
    'OpenAI', 'Anthropic', 'Tesla', 'Oracle', 'Salesforce', 'TSMC',
    'SK Hynix', 'Micron', 'Intel', 'ABB', 'Siemens', 'Eaton',
    'Schneider', 'GE Vernova', 'Equinix', 'Digital Realty'
  ]

  const people = [
    'Jensen Huang', 'Dario Amodei', 'Sam Altman', 'Satya Nadella',
    'Sundar Pichai', 'Mark Zuckerberg', 'Elon Musk', 'Howard Marks',
    'Andy Jassy', 'Lisa Su', 'Pat Gelsinger', 'Dylan Patel',
    'Gary Marcus', 'Daron Acemoglu'
  ]

  const allTerms = [...companies, ...people]

  for (const term of allTerms) {
    if (text.toLowerCase().includes(term.toLowerCase())) {
      entities.add(term)
    }
  }

  return Array.from(entities)
}

function buildComparisonPrompt(
  articles: NewsArticle[],
  contradictionAnalysis: any[],
  wikiContext: any
): string {
  let prompt = `# Multi-News Comparative Analysis\n\n`

  // Add all articles
  articles.forEach((article, idx) => {
    prompt += `## Article ${idx + 1}: ${article.title}\n`
    prompt += `${article.content}\n\n`

    // Add contradictions detected for this article
    const articleContradictions = contradictionAnalysis.find(a => a.articleIndex === idx)
    if (articleContradictions && articleContradictions.contradictions.length > 0) {
      prompt += `### Contradictions Detected:\n`
      articleContradictions.contradictions.forEach((catContradictions: any) => {
        catContradictions.contradictions.forEach((c: any) => {
          prompt += `- **${c.framework}** (${c.author}, ${c.confidence}% confidence): ${c.contradiction}\n`
        })
      })
      prompt += `\n`
    }

    prompt += `---\n\n`
  })

  // Add wiki context
  prompt += `## Wiki Context (403 Pages)\n\n`
  prompt += wikiContext.formattedContext || 'Relevant wiki frameworks available for analysis.\n\n'
  prompt += `---\n\n`

  // Instructions
  prompt += `## Your Task\n\n`
  prompt += `Compare these ${articles.length} articles:\n\n`
  prompt += `1. Find contradictions BETWEEN articles (who disagrees with whom?)\n`
  prompt += `2. Find contradictions WITHIN each article vs wiki frameworks\n`
  prompt += `3. Identify consensus views (what everyone agrees on)\n`
  prompt += `4. Identify debate areas (where there's disagreement)\n`
  prompt += `5. Apply wiki frameworks to find market mispricing\n`
  prompt += `6. Generate unified investment thesis with specific tickers\n\n`
  prompt += `Focus on finding alpha where multiple contradictions align.\n\n`
  prompt += `Cite every claim with [[wiki-page-name]].`

  return prompt
}
