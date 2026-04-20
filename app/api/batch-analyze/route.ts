import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildWikiContext } from '@/lib/wiki-query'
import { detectContradictions, calculateContradictionScore } from '@/lib/contradiction-detector'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface BatchArticle {
  title: string
  content: string
  url?: string
}

export async function POST(req: NextRequest) {
  try {
    const { articles } = await req.json() as { articles: BatchArticle[] }

    if (!articles || articles.length === 0) {
      return Response.json({ error: 'No articles provided' }, { status: 400 })
    }

    if (articles.length > 10) {
      return Response.json({ error: 'Maximum 10 articles allowed' }, { status: 400 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        const sendSSE = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\\n\\n`))
        }

        try {
          sendSSE({ type: 'status', message: `Analyzing ${articles.length} articles...` })

          // Extract entities from all articles
          const allEntities = new Set<string>()
          const allConcepts = new Set<string>()

          const articleAnalyses: any[] = []

          for (let i = 0; i < articles.length; i++) {
            const article = articles[i]

            sendSSE({
              type: 'status',
              message: `Processing article ${i + 1}/${articles.length}: ${article.title}`
            })

            // Extract entities and concepts
            const companyNames = ['TSMC', 'NVIDIA', 'Microsoft', 'Google', 'Meta', 'Amazon', 'OpenAI', 'Anthropic', 'Oracle', 'Apple']
            const peopleNames = ['Jensen Huang', 'Dario Amodei', 'Sam Altman', 'Satya Nadella', 'Howard Marks', 'Dylan Patel']

            companyNames.forEach(name => {
              if (article.content.includes(name) || article.title.includes(name)) {
                allEntities.add(name)
              }
            })

            peopleNames.forEach(name => {
              if (article.content.includes(name) || article.title.includes(name)) {
                allEntities.add(name)
              }
            })

            // Add concepts
            if (article.content.toLowerCase().includes('gpu') || article.content.toLowerCase().includes('chip')) {
              allConcepts.add('semiconductor-supply-chain')
            }
            if (article.content.toLowerCase().includes('power') || article.content.toLowerCase().includes('energy')) {
              allConcepts.add('power-constraints')
            }
            if (article.content.toLowerCase().includes('ai') || article.content.toLowerCase().includes('llm')) {
              allConcepts.add('scaling-laws')
            }

            // Detect contradictions for this article
            const contradictions = await detectContradictions(article.content, article.title)
            const contradictionScore = calculateContradictionScore(contradictions)

            articleAnalyses.push({
              title: article.title,
              url: article.url,
              contradictions,
              contradictionScore,
              entityCount: Array.from(allEntities).length
            })
          }

          sendSSE({
            type: 'articles_analyzed',
            data: articleAnalyses
          })

          sendSSE({
            type: 'entities',
            data: Array.from(allEntities)
          })

          sendSSE({ type: 'status', message: 'Querying wiki for context...' })

          // Build wiki context from all extracted entities/concepts
          const wikiContext = await buildWikiContext(
            Array.from(allEntities),
            Array.from(allConcepts)
          )

          sendSSE({ type: 'status', message: 'Generating cross-article synthesis...' })

          // Build batch analysis prompt
          const articlesText = articles.map((a, i) =>
            `## Article ${i + 1}: ${a.title}\\n\\n${a.content}\\n\\n---\\n`
          ).join('\\n')

          const contradictionsText = articleAnalyses.map((a, i) =>
            `### Article ${i + 1} Contradictions (Score: ${a.contradictionScore.score}/100):\\n` +
            a.contradictions.map((c: any) =>
              `- **${c.framework}** (${c.author}): ${c.contradiction}`
            ).join('\\n')
          ).join('\\n\\n')

          const prompt = `# Batch Analysis: ${articles.length} Articles

${articlesText}

## Wiki Context (403 Pages)

${wikiContext.formattedContext || 'Relevant wiki frameworks loaded.'}

## Individual Article Contradictions

${contradictionsText}

---

## Your Task: Cross-Article Synthesis

Analyze these ${articles.length} articles together and provide:

### 1. **Common Themes**
What topics/entities appear across multiple articles? What's the overarching narrative?

### 2. **Contradictions & Debates**
- Where do these articles contradict each other?
- Where do they contradict elite frameworks from the wiki?
- Which sources are more credible based on wiki evidence?

### 3. **Consensus Points**
Where do multiple articles agree? What seems to be established truth vs speculation?

### 4. **Investment Thesis**
Based on synthesizing all ${articles.length} articles with wiki frameworks:
- **Overall Signal**: LONG, SHORT, or NEUTRAL
- **Conviction**: 0-100
- **Specific Opportunities**: Tickers with rationale
- **Risk Factors**: What could invalidate this thesis?

### 5. **Framework Validation**
Which wiki frameworks are validated or contradicted by this batch of news?

### 6. **Key Takeaways**
3-5 bullet points summarizing the most important insights from this batch.

Be specific. Use numbers. Cite [[wiki-pages]]. Cross-reference articles by number.`

          // Stream Claude's batch analysis
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8000,
            temperature: 0.5,
            system: `You are AlphaBot V2 running cross-article batch analysis.

Your job: Synthesize multiple news articles together, finding patterns, contradictions, and investment opportunities.

Output comprehensive markdown analysis with clear sections.`,
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
          console.error('Batch analysis error:', error)
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
      { error: 'Failed to process batch analysis' },
      { status: 500 }
    )
  }
}
