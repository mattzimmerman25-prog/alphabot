import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildWikiContext } from '@/lib/wiki-query'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { scenario, category = 'general' } = await req.json()

    if (!scenario) {
      return Response.json({ error: 'Scenario required' }, { status: 400 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        const sendSSE = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          sendSSE({ type: 'status', message: 'Analyzing scenario impact...' })

          // Extract relevant concepts based on scenario
          const entities: string[] = []
          const concepts: string[] = []

          const lowerScenario = scenario.toLowerCase()

          // Extract entities
          const companyNames = ['TSMC', 'NVIDIA', 'Microsoft', 'Google', 'Meta', 'Amazon', 'OpenAI', 'Anthropic', 'Oracle']
          const peopleNames = ['Jensen Huang', 'Dario Amodei', 'Sam Altman', 'Howard Marks', 'Dylan Patel']

          companyNames.forEach(name => {
            if (lowerScenario.includes(name.toLowerCase())) entities.push(name)
          })
          peopleNames.forEach(name => {
            if (lowerScenario.includes(name.toLowerCase())) entities.push(name)
          })

          // Extract concepts based on category and content
          if (category === 'power' || lowerScenario.includes('power') || lowerScenario.includes('smr') || lowerScenario.includes('nuclear')) {
            concepts.push('power-constraints', 'electrician-shortage', 'grid-capacity-limits')
          }
          if (category === 'bottleneck' || lowerScenario.includes('cowos') || lowerScenario.includes('hbm') || lowerScenario.includes('packaging')) {
            concepts.push('HBM-bottleneck', 'CoWoS-capacity', 'AI-bottlenecks')
          }
          if (category === 'market' || lowerScenario.includes('roi') || lowerScenario.includes('bubble') || lowerScenario.includes('winter')) {
            concepts.push('enterprise-AI-ROI', 'debt-financed-AI', 'AI-high-performers')
          }
          if (category === 'scaling' || lowerScenario.includes('gpt') || lowerScenario.includes('agi') || lowerScenario.includes('capability')) {
            concepts.push('scaling-laws')
          }
          if (lowerScenario.includes('regulation') || lowerScenario.includes('regulatory')) {
            concepts.push('AI-regulation')
          }

          sendSSE({ type: 'status', message: 'Querying wiki frameworks...' })

          // Build wiki context
          const wikiContext = await buildWikiContext(entities, concepts)

          sendSSE({ type: 'status', message: 'Running counterfactual analysis...' })

          // Build comprehensive prompt
          const prompt = buildScenarioPrompt(scenario, category, wikiContext)

          // Stream Claude's scenario analysis
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 5000,
            temperature: 0.4,
            system: `You are AlphaBot V2, running counterfactual scenario analysis through elite AI frameworks.

Your job: Take a "what if" scenario and analyze downstream effects using wiki knowledge.

Output format:

## Scenario Impact Assessment
- **Likelihood**: [0-100]% this scenario occurs
- **Timeframe**: When this could happen
- **Catalysts**: What would trigger this
- **Blockers**: What could prevent this

## Downstream Effects

### Primary Effects
[Immediate impact on bottleneck, market structure, etc.]

### Secondary Effects
[Ripple effects on supply chain, competition, etc.]

### Tertiary Effects
[Long-term structural changes]

## Framework Analysis

For each relevant wiki framework, explain:
- Does this framework support or contradict the scenario?
- What does [[framework-name]] predict would happen?
- Historical precedents or analogies

## Investment Implications

### If Scenario Occurs
- **LONG opportunities**: [specific tickers with rationale]
- **SHORT opportunities**: [specific tickers with rationale]
- **Confidence**: [0-100]%

### If Scenario Fails
- Alternative outcomes
- Hedging strategies

## Risk Factors
- What could invalidate this analysis?
- Probability ranges
- Black swan considerations

## Wiki Citations
List all [[framework]] and [[entity]] sources used

Be specific, quantitative when possible, and cite wiki frameworks.`,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })

          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta') {
              sendSSE({
                type: 'analysis_chunk',
                data: chunk.delta.text
              })
            }
          }

          sendSSE({ type: 'complete' })
          controller.close()

        } catch (error) {
          console.error('Scenario analysis error:', error)
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
      { error: 'Failed to analyze scenario' },
      { status: 500 }
    )
  }
}

function buildScenarioPrompt(
  scenario: string,
  category: string,
  wikiContext: any
): string {
  return `# Counterfactual Scenario Analysis

## Scenario
${scenario}

## Category
${category}

---

## Wiki Context (403 Pages)

${wikiContext.formattedContext || 'Relevant wiki frameworks loaded for analysis.'}

---

## Your Task

Run this scenario through the wiki's elite frameworks. Be thorough:

1. **Assess Likelihood**: Based on wiki evidence, how likely is this scenario? What frameworks support/contradict it?

2. **Trace Downstream Effects**:
   - Primary: Immediate bottleneck/market changes
   - Secondary: Supply chain, competitive reactions
   - Tertiary: Long-term structural shifts

3. **Apply Each Framework**: For [[power-constraints]], [[debt-financed-AI]], [[scaling-laws]], etc., explain what each predicts would happen.

4. **Investment Implications**: Specific LONG/SHORT opportunities with tickers and confidence scores.

5. **Risk Analysis**: What could invalidate this? Probability ranges?

Be specific. Use numbers. Cite [[wiki-pages]]. Think through 2nd and 3rd order effects.`
}
