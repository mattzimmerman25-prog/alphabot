import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildWikiContext, loadWikiIndex } from '@/lib/wiki-query'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface WikiContext {
  entities: Array<{ title: string; type: string; content: string }>
  concepts: Array<{ title: string; type: string; content: string }>
  contradictions: Array<{
    framework: string
    author: string
    contradiction: string
    confidence: number
  }>
}

export async function POST(req: NextRequest) {
  try {
    const { newsTitle, newsContent } = await req.json()

    // Create a readable stream for server-sent events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        // Helper to send SSE message
        const sendSSE = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          // Step 1: Analyze news and extract entities
          sendSSE({ type: 'status', message: 'Extracting entities from news...' })

          const entities = extractEntitiesFromText(newsTitle + ' ' + newsContent)
          sendSSE({ type: 'entities', data: entities })

          // Step 2: Query wiki for context
          sendSSE({ type: 'status', message: 'Querying 403-page wiki...' })

          const wikiContext = await queryWikiContext(entities, newsContent)
          sendSSE({ type: 'wiki_context', data: wikiContext })

          // Step 3: Detect contradictions
          sendSSE({ type: 'status', message: 'Detecting contradictions...' })

          const contradictions = detectContradictions(newsContent, wikiContext)
          sendSSE({ type: 'contradictions', data: contradictions })

          // Step 4: Stream Claude synthesis
          sendSSE({ type: 'status', message: 'Synthesizing investment thesis...' })

          const prompt = buildSynthesisPrompt(
            newsTitle,
            newsContent,
            wikiContext,
            contradictions
          )

          // Stream Claude's response
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            temperature: 0.3,
            system: `You are AlphaBot V2, an elite AI investment analyst with access to 403 pages of primary sources from the smartest people in AI (Howard Marks, Jensen Huang, Dario Amodei, etc.).

Your job: Find contradictions between news and wiki frameworks. That's where alpha lives.

Output format:
## Investment Signal
[LONG/SHORT/NEUTRAL]

## Confidence
[0-100]% based on:
- Source credibility
- Wiki framework alignment
- Contradiction strength

## Alpha Thesis
[2-3 paragraphs explaining THE CONTRADICTION and why market is mispricing it]

## Recommended Trades
[Specific tickers with rationale]

## Risk Factors
[What would invalidate this]

## Wiki Citations
[All sources with [[wikilinks]]]`,
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
          console.error('Synthesis error:', error)
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
      { error: 'Failed to synthesize' },
      { status: 500 }
    )
  }
}

function extractEntitiesFromText(text: string): string[] {
  // Enhanced entity extraction
  const entities = new Set<string>()

  // Companies
  const companies = [
    'Microsoft', 'Google', 'Meta', 'Amazon', 'Apple', 'NVIDIA', 'AMD',
    'OpenAI', 'Anthropic', 'Tesla', 'Oracle', 'Salesforce', 'TSMC',
    'SK Hynix', 'Micron', 'Intel', 'ABB', 'Siemens', 'Eaton', 'Schneider',
    'GE Vernova', 'Equinix', 'Digital Realty'
  ]

  // People
  const people = [
    'Jensen Huang', 'Dario Amodei', 'Sam Altman', 'Satya Nadella',
    'Sundar Pichai', 'Mark Zuckerberg', 'Elon Musk', 'Howard Marks',
    'Andy Jassy', 'Lisa Su', 'Pat Gelsinger', 'Dylan Patel'
  ]

  // Concepts
  const concepts = [
    'power constraints', 'electrical equipment', 'HBM', 'CoWoS',
    'scaling laws', 'transformer', 'GPU', 'data center', 'CapEx',
    'ROI', 'enterprise adoption', 'inference', 'training'
  ]

  const allTerms = [...companies, ...people, ...concepts]

  for (const term of allTerms) {
    if (text.toLowerCase().includes(term.toLowerCase())) {
      entities.add(term)
    }
  }

  return Array.from(entities)
}

async function queryWikiContext(
  entities: string[],
  newsContent: string
): Promise<WikiContext> {
  try {
    // Extract concepts from news content
    const concepts: string[] = []
    const lowerContent = newsContent.toLowerCase()

    if (lowerContent.includes('power') || lowerContent.includes('constraint') || lowerContent.includes('electrical')) {
      concepts.push('power-constraints', 'electrician-shortage')
    }
    if (lowerContent.includes('debt') || lowerContent.includes('financing') || lowerContent.includes('capex')) {
      concepts.push('debt-financed-AI')
    }
    if (lowerContent.includes('roi') || lowerContent.includes('adoption') || lowerContent.includes('enterprise')) {
      concepts.push('enterprise-AI-ROI', 'AI-high-performers')
    }
    if (lowerContent.includes('scaling') || lowerContent.includes('law')) {
      concepts.push('scaling-laws')
    }
    if (lowerContent.includes('hbm') || lowerContent.includes('memory')) {
      concepts.push('HBM-bottleneck')
    }
    if (lowerContent.includes('cowos') || lowerContent.includes('packaging')) {
      concepts.push('CoWoS-capacity')
    }

    // Query real wiki for entity and concept context
    const wikiData = await buildWikiContext(entities, concepts)

    return {
      entities: wikiData.entityPages.slice(0, 5).map(p => ({
        title: p.name,
        type: p.type,
        content: p.content.substring(0, 500)
      })),
      concepts: wikiData.conceptPages.slice(0, 5).map(p => ({
        title: p.name,
        type: p.type,
        content: p.content.substring(0, 500)
      })),
      contradictions: []
    }
  } catch (error) {
    console.error('Wiki query error:', error)
    // Fallback to basic context if wiki unavailable
    return {
      entities: entities.slice(0, 5).map(e => ({
        title: e,
        type: 'entity',
        content: `Entity: ${e}`
      })),
      concepts: [
        {
          title: 'power-constraints',
          type: 'concept',
          content: 'Only 1/3 of data center capacity can come online due to electrical equipment shortages'
        }
      ],
      contradictions: []
    }
  }
}

function detectContradictions(
  newsContent: string,
  wikiContext: WikiContext
): Array<{ framework: string; author: string; contradiction: string; confidence: number }> {
  const contradictions = []

  // Pattern matching for common contradictions

  // CapEx announcements vs power constraints
  if (newsContent.toLowerCase().includes('capex') ||
      newsContent.toLowerCase().includes('data center')) {
    contradictions.push({
      framework: 'power-constraints',
      author: 'Dylan Patel',
      contradiction: 'News announces large CapEx/data center plans, but wiki shows only 1/3 can deploy due to electrical equipment shortages (2-3 year lead times)',
      confidence: 85
    })
  }

  // Debt financing vs Howard Marks
  if (newsContent.toLowerCase().includes('debt') ||
      newsContent.toLowerCase().includes('financing')) {
    contradictions.push({
      framework: 'debt-financed-AI',
      author: 'Howard Marks',
      contradiction: 'News mentions debt financing for AI infrastructure. Howard Marks warns: "Debt is toxic when applied to ventures where outcome is purely conjecture"',
      confidence: 82
    })
  }

  // ROI claims vs McKinsey/BCG studies
  if (newsContent.toLowerCase().includes('roi') ||
      newsContent.toLowerCase().includes('adoption')) {
    contradictions.push({
      framework: 'enterprise-AI-ROI',
      author: 'McKinsey/BCG',
      contradiction: 'News implies widespread ROI success, but wiki shows 95% of enterprises struggle to demonstrate business value',
      confidence: 78
    })
  }

  return contradictions
}

function buildSynthesisPrompt(
  newsTitle: string,
  newsContent: string,
  wikiContext: WikiContext,
  contradictions: any[]
): string {
  return `# Breaking News Analysis

## News Item
**Title**: ${newsTitle}
**Content**: ${newsContent}

---

## Wiki Context (403 Pages)

### Relevant Entities
${wikiContext.entities.map(e => `- [[${e.title}]] (${e.type})`).join('\n')}

### Relevant Concepts
${wikiContext.concepts.map(c => `- [[${c.title}]] (${c.type})`).join('\n')}

### 🚨 CONTRADICTIONS DETECTED
${contradictions.length > 0 ? contradictions.map(c => `
**${c.framework}** (${c.author}) - ${c.confidence}% confidence
${c.contradiction}
`).join('\n') : 'No significant contradictions detected'}

---

## Your Task

Analyze this news through the lens of the wiki's elite frameworks.

**Focus on contradictions** - that's where alpha lives. When Howard Marks, Jensen Huang, or Dario Amodei's frameworks contradict news headlines, explain:

1. What is the market consensus (implied by news)?
2. What does the wiki framework say?
3. Why is there a gap?
4. How to profit from this mispricing?

Be specific with tickers, confidence scores, and risk factors.

Cite every claim with [[wiki-page-name]].`
}
