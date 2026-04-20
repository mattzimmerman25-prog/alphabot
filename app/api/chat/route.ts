import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildWikiContext } from '@/lib/wiki-query'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { question, history = [] } = await req.json()

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        const sendSSE = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          // Extract key terms from question
          const entities = extractEntitiesFromQuestion(question)

          // Query wiki for relevant context
          const wikiContext = await queryWikiForQuestion(question, entities)

          // Build conversation history for Claude
          const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
            ...history.map((msg: Message) => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: buildChatPrompt(question, wikiContext)
            }
          ]

          // Stream Claude's response
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            temperature: 0.3,
            system: `You are AlphaBot V2, an AI research analyst with access to a 403-page wiki of elite AI frameworks.

Your wiki contains:
- **Entities**: Howard Marks, Jensen Huang, Dario Amodei, Sam Altman, Dylan Patel, Gary Marcus, and more
- **Concepts**: power-constraints, scaling laws, enterprise-AI-ROI, debt-financed-AI, HBM bottlenecks, CoWoS capacity, etc.
- **Sources**: Transcripts, memos, interviews, papers from 2024-2026

Your job:
1. Answer questions using ONLY wiki knowledge
2. Cite every claim with [[wikilink]] format
3. When sources disagree, present both views
4. Identify contradictions between thinkers
5. Be specific with examples and quotes

Output format:
- Write in crisp, analytical prose
- Use [[Entity Name]] and [[concept-name]] for citations
- When presenting debates, show both sides
- Highlight contradictions with "🚨"
- End with "Sources: [[page1]], [[page2]], [[page3]]"`,
            messages
          })

          let fullResponse = ''
          const citationSet = new Set<string>()

          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              fullResponse += text

              // Extract citations as they stream
              const citationMatches = text.matchAll(/\[\[(.+?)\]\]/g)
              for (const match of citationMatches) {
                citationSet.add(match[1])
              }

              sendSSE({
                type: 'content_chunk',
                data: text
              })
            }
          }

          // Send final citations
          sendSSE({
            type: 'citations',
            data: Array.from(citationSet)
          })

          sendSSE({ type: 'complete' })
          controller.close()

        } catch (error) {
          console.error('Chat error:', error)
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
      { error: 'Failed to process chat' },
      { status: 500 }
    )
  }
}

function extractEntitiesFromQuestion(question: string): string[] {
  const entities = new Set<string>()

  // People
  const people = [
    'Howard Marks', 'Jensen Huang', 'Dario Amodei', 'Sam Altman',
    'Satya Nadella', 'Sundar Pichai', 'Mark Zuckerberg', 'Elon Musk',
    'Lisa Su', 'Pat Gelsinger', 'Dylan Patel', 'Gary Marcus',
    'Daron Acemoglu', 'Geoffrey Hinton', 'Yann LeCun', 'Andrew Ng'
  ]

  // Companies
  const companies = [
    'Microsoft', 'Google', 'Meta', 'Amazon', 'Apple', 'NVIDIA', 'AMD',
    'OpenAI', 'Anthropic', 'Tesla', 'Oracle', 'Salesforce', 'TSMC',
    'SK Hynix', 'Micron', 'Intel', 'ABB', 'Siemens', 'Eaton',
    'Schneider', 'GE Vernova', 'Equinix', 'Digital Realty'
  ]

  // Concepts
  const concepts = [
    'power constraints', 'electrical equipment', 'HBM', 'CoWoS',
    'scaling laws', 'transformer', 'GPU', 'data center', 'CapEx',
    'ROI', 'enterprise adoption', 'inference', 'training', 'debt',
    'bubble', 'bottleneck', 'electrician shortage'
  ]

  const allTerms = [...people, ...companies, ...concepts]
  const lowerQuestion = question.toLowerCase()

  for (const term of allTerms) {
    if (lowerQuestion.includes(term.toLowerCase())) {
      entities.add(term)
    }
  }

  return Array.from(entities)
}

async function queryWikiForQuestion(
  question: string,
  entities: string[]
): Promise<string> {
  try {
    // Extract concepts from question
    const concepts: string[] = []
    const lowerQuestion = question.toLowerCase()

    if (lowerQuestion.includes('power') || lowerQuestion.includes('constraint')) {
      concepts.push('power-constraints', 'electrician-shortage')
    }
    if (lowerQuestion.includes('debt') || lowerQuestion.includes('financing')) {
      concepts.push('debt-financed-AI')
    }
    if (lowerQuestion.includes('roi') || lowerQuestion.includes('adoption') || lowerQuestion.includes('enterprise')) {
      concepts.push('enterprise-AI-ROI', 'AI-high-performers')
    }
    if (lowerQuestion.includes('scaling') || lowerQuestion.includes('law')) {
      concepts.push('scaling-laws')
    }
    if (lowerQuestion.includes('bottleneck')) {
      concepts.push('AI-bottlenecks', 'power-constraints', 'HBM-bottleneck')
    }
    if (lowerQuestion.includes('hbm') || lowerQuestion.includes('memory')) {
      concepts.push('HBM-bottleneck')
    }

    // Query real wiki
    const wikiData = await buildWikiContext(entities, concepts)

    // Return formatted context (already formatted by buildWikiContext)
    return wikiData.formattedContext || 'No wiki context found for this query.'
  } catch (error) {
    console.error('Wiki query error:', error)
    // Fallback to basic context
    return `## Wiki Query Failed\nFallback context: ${entities.length} entities detected, question about: ${question.substring(0, 100)}`
  }
}

function buildChatPrompt(question: string, wikiContext: string): string {
  return `Question: ${question}

${wikiContext}

---

Using ONLY the wiki context above, answer this question. Cite every claim with [[wikilinks]]. If sources disagree, present both views. Be specific and analytical.`
}
