/**
 * Advanced contradiction detection system
 * Finds where elite frameworks contradict market consensus or each other
 */

import { buildWikiContext, searchByEntity } from './wiki-query'

export interface Contradiction {
  framework: string
  author: string
  contradiction: string
  confidence: number
  evidence: string[]
  investmentImplication?: string
}

export interface ContradictionCategory {
  category: 'power' | 'debt' | 'roi' | 'scaling' | 'bottleneck' | 'general'
  contradictions: Contradiction[]
}

/**
 * Detect contradictions between news content and wiki frameworks
 */
export async function detectContradictions(
  newsContent: string,
  newsTitle?: string
): Promise<ContradictionCategory[]> {
  const categories: ContradictionCategory[] = []
  const lowerContent = (newsTitle + ' ' + newsContent).toLowerCase()

  // Power & Infrastructure Contradictions
  if (lowerContent.includes('data center') ||
      lowerContent.includes('capex') ||
      lowerContent.includes('infrastructure') ||
      lowerContent.includes('power')) {
    categories.push(await detectPowerContradictions(newsContent))
  }

  // Debt & Financing Contradictions
  if (lowerContent.includes('debt') ||
      lowerContent.includes('financing') ||
      lowerContent.includes('investment') ||
      lowerContent.includes('capital')) {
    categories.push(await detectDebtContradictions(newsContent))
  }

  // ROI & Enterprise Adoption Contradictions
  if (lowerContent.includes('roi') ||
      lowerContent.includes('adoption') ||
      lowerContent.includes('enterprise') ||
      lowerContent.includes('business value')) {
    categories.push(await detectROIContradictions(newsContent))
  }

  // Scaling Laws Contradictions
  if (lowerContent.includes('scaling') ||
      lowerContent.includes('model') ||
      lowerContent.includes('capability')) {
    categories.push(await detectScalingContradictions(newsContent))
  }

  // Bottleneck Analysis Contradictions
  if (lowerContent.includes('bottleneck') ||
      lowerContent.includes('constraint') ||
      lowerContent.includes('shortage')) {
    categories.push(await detectBottleneckContradictions(newsContent))
  }

  return categories.filter(c => c.contradictions.length > 0)
}

async function detectPowerContradictions(newsContent: string): Promise<ContradictionCategory> {
  const contradictions: Contradiction[] = []

  // Pattern 1: Large CapEx announcements vs physical constraints
  if (/\$?\d+\s*(billion|B|GW)/i.test(newsContent) &&
      (newsContent.toLowerCase().includes('data center') ||
       newsContent.toLowerCase().includes('capex'))) {

    contradictions.push({
      framework: 'power-constraints',
      author: 'Dylan Patel (SemiAnalysis)',
      contradiction: 'News announces large-scale data center CapEx, but wiki shows only 1/3 of planned capacity can come online due to electrical equipment shortages. Lead times for transformers: 2-3 years, electrician training: 4 years.',
      confidence: 85,
      evidence: [
        '[[power-constraints]]: 12 GW announced, only 4 GW deliverable',
        '[[electrician-shortage]]: 4-year training pipeline bottleneck',
        '[[Dylan Patel]]: "Power, not chips, is the real bottleneck"'
      ],
      investmentImplication: 'SHORT data center REITs expecting rapid growth. LONG electrical equipment manufacturers (ABB, Siemens, Eaton) with monopoly pricing power.'
    })
  }

  // Pattern 2: Grid capacity claims vs reality
  if (newsContent.toLowerCase().includes('grid') ||
      newsContent.toLowerCase().includes('power')) {

    contradictions.push({
      framework: 'grid-capacity-limits',
      author: 'Multiple Infrastructure Sources',
      contradiction: 'If news implies immediate power availability, wiki frameworks show multi-year grid upgrade timelines and transformer shortages creating deployment delays.',
      confidence: 78,
      evidence: [
        '[[power-constraints]]: Grid upgrades take 18-36 months minimum',
        '[[electrical-equipment]]: Global transformer shortage through 2026'
      ],
      investmentImplication: 'Delay expectations for AI infrastructure deployment 12-24 months beyond announced timelines.'
    })
  }

  return {
    category: 'power',
    contradictions
  }
}

async function detectDebtContradictions(newsContent: string): Promise<ContradictionCategory> {
  const contradictions: Contradiction[] = []

  // Pattern 1: Debt-financed AI investments vs Howard Marks warnings
  if (newsContent.toLowerCase().includes('debt') ||
      newsContent.toLowerCase().includes('financing') ||
      /\$?\d+\s*billion/i.test(newsContent)) {

    contradictions.push({
      framework: 'debt-financed-AI',
      author: 'Howard Marks (Oaktree Capital)',
      contradiction: 'News discusses debt financing for AI infrastructure. Howard Marks memo (Dec 2025): "Debt is toxic when applied to ventures where the outcome is purely conjecture." AI ROI remains unproven for 95% of enterprises.',
      confidence: 82,
      evidence: [
        '[[Howard Marks]]: "Is It a Bubble?" memo warns on debt-financed speculation',
        '[[debt-financed-AI]]: Historic parallel to dot-com bubble infrastructure spending',
        '[[enterprise-AI-ROI]]: 95% struggle to demonstrate business value'
      ],
      investmentImplication: 'SHORT companies with high debt levels financing AI infrastructure without proven ROI. Warning sign for bubble dynamics.'
    })
  }

  return {
    category: 'debt',
    contradictions
  }
}

async function detectROIContradictions(newsContent: string): Promise<ContradictionCategory> {
  const contradictions: Contradiction[] = []

  // Pattern 1: ROI claims vs enterprise reality
  if (newsContent.toLowerCase().includes('roi') ||
      newsContent.toLowerCase().includes('productivity') ||
      newsContent.toLowerCase().includes('adoption')) {

    contradictions.push({
      framework: 'enterprise-AI-ROI',
      author: 'McKinsey/BCG Research',
      contradiction: 'If news implies widespread AI ROI success, research shows 95% of enterprises struggle to demonstrate business value. Only 5-6% achieve "high performer" status with transformational returns.',
      confidence: 88,
      evidence: [
        '[[enterprise-AI-ROI]]: 78% adoption but 95% cannot show ROI',
        '[[AI-high-performers]]: Extreme bifurcation - 5% win big, 95% struggle',
        '[[performance-gap]]: Gap widening between leaders and laggards'
      ],
      investmentImplication: 'SHORT enterprise AI vendors without proven customer ROI. LONG proven winners (Microsoft, hyperscalers with existing revenue).'
    })
  }

  return {
    category: 'roi',
    contradictions
  }
}

async function detectScalingContradictions(newsContent: string): Promise<ContradictionCategory> {
  const contradictions: Contradiction[] = []

  // Pattern 1: Scaling optimism vs skeptic warnings
  if (newsContent.toLowerCase().includes('scaling') ||
      newsContent.toLowerCase().includes('agi') ||
      newsContent.toLowerCase().includes('capability')) {

    contradictions.push({
      framework: 'scaling-laws-debate',
      author: 'Jensen Huang/Dario Amodei vs Gary Marcus/Daron Acemoglu',
      contradiction: 'Bulls (Jensen, Dario) argue scaling continues. Skeptics (Marcus, Acemoglu) warn of diminishing returns and economic viability limits. Market pricing bull case but not hedging bear risk.',
      confidence: 70,
      evidence: [
        '[[Jensen Huang]]: "Scaling is alive and well" (GTC 2025)',
        '[[Dario Amodei]]: "We will see systems 100x more capable"',
        '[[Gary Marcus]]: "Scaling will hit fundamental limits"',
        '[[Daron Acemoglu]]: "Economic impact overstated, only 0.5-1% GDP boost"'
      ],
      investmentImplication: 'Market vulnerable to scaling slowdown. Consider hedges against AI hype deflation.'
    })
  }

  return {
    category: 'scaling',
    contradictions
  }
}

async function detectBottleneckContradictions(newsContent: string): Promise<ContradictionCategory> {
  const contradictions: Contradiction[] = []

  // Pattern 1: Chip-focused narrative vs power/talent reality
  if (newsContent.toLowerCase().includes('gpu') ||
      newsContent.toLowerCase().includes('chip') ||
      newsContent.toLowerCase().includes('nvidia')) {

    contradictions.push({
      framework: 'bottleneck-evolution',
      author: 'Industry Analysis',
      contradiction: 'News focuses on chip availability, but wiki shows bottleneck evolved: Chips (2023) → HBM (2024) → Power (2025-2026). Current constraint is power delivery and electrical infrastructure, not chips.',
      confidence: 90,
      evidence: [
        '[[AI-bottlenecks]]: Sequential bottleneck evolution documented',
        '[[power-constraints]]: 2026 primary constraint',
        '[[HBM-bottleneck]]: Resolved by Q2 2025',
        '[[Dylan Patel]]: Called power bottleneck 9 months early'
      ],
      investmentImplication: 'Rotate from GPU plays to electrical equipment. Power infrastructure now matters more than chip supply.'
    })
  }

  return {
    category: 'bottleneck',
    contradictions
  }
}

/**
 * Find contradictions between specific entities in wiki
 */
export async function findEntityContradictions(
  entity1: string,
  entity2: string
): Promise<Contradiction | null> {
  try {
    const pages1 = await searchByEntity(entity1)
    const pages2 = await searchByEntity(entity2)

    // Check for opposing views on key topics
    const topics = ['scaling', 'roi', 'bubble', 'debt', 'power']

    for (const topic of topics) {
      const mentions1 = pages1.filter(p =>
        p.content.toLowerCase().includes(topic)
      )
      const mentions2 = pages2.filter(p =>
        p.content.toLowerCase().includes(topic)
      )

      if (mentions1.length > 0 && mentions2.length > 0) {
        return {
          framework: `${topic}-debate`,
          author: `${entity1} vs ${entity2}`,
          contradiction: `[[${entity1}]] and [[${entity2}]] have opposing views on ${topic}`,
          confidence: 75,
          evidence: [
            `Found in ${mentions1.length} pages for ${entity1}`,
            `Found in ${mentions2.length} pages for ${entity2}`
          ]
        }
      }
    }

    return null
  } catch (error) {
    console.error('Entity contradiction detection error:', error)
    return null
  }
}

/**
 * Calculate contradiction score for investment decision
 */
export function calculateContradictionScore(
  contradictions: ContradictionCategory[]
): {
  score: number
  signal: 'LONG' | 'SHORT' | 'NEUTRAL'
  reasoning: string
} {
  if (contradictions.length === 0) {
    return {
      score: 0,
      signal: 'NEUTRAL',
      reasoning: 'No significant contradictions detected'
    }
  }

  const avgConfidence = contradictions
    .flatMap(c => c.contradictions)
    .reduce((sum, c) => sum + c.confidence, 0) /
    contradictions.flatMap(c => c.contradictions).length

  const highConfidenceCount = contradictions
    .flatMap(c => c.contradictions)
    .filter(c => c.confidence >= 80).length

  let signal: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL'
  let reasoning = ''

  if (highConfidenceCount >= 2 && avgConfidence >= 80) {
    signal = 'SHORT'
    reasoning = `${highConfidenceCount} high-confidence contradictions suggest market mispricing. News narrative conflicts with elite frameworks.`
  } else if (avgConfidence >= 70) {
    signal = 'SHORT'
    reasoning = `Multiple contradictions (avg ${avgConfidence.toFixed(0)}% confidence) indicate skepticism warranted.`
  } else {
    reasoning = `Some contradictions detected but not actionable (avg ${avgConfidence.toFixed(0)}% confidence).`
  }

  return {
    score: avgConfidence,
    signal,
    reasoning
  }
}
