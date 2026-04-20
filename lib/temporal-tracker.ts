/**
 * Temporal Analysis System
 * Tracks predictions vs outcomes to measure framework accuracy
 */

export interface Prediction {
  id: string
  date: string
  source: string // Wiki page or entity name
  claim: string
  category: 'power' | 'debt' | 'roi' | 'scaling' | 'bottleneck' | 'market'
  confidence: number
  outcome?: 'correct' | 'incorrect' | 'partial' | 'pending'
  verificationDate?: string
  verificationEvidence?: string
  accuracyScore?: number // 0-100
}

export interface SourceCredibility {
  source: string
  totalPredictions: number
  correctPredictions: number
  incorrectPredictions: number
  pendingPredictions: number
  overallAccuracy: number // 0-100
  categoryAccuracy: {
    [key: string]: number
  }
  leadTime: number // How many months ahead they were correct
  recentTrend: 'improving' | 'declining' | 'stable'
}

export interface RegimeChange {
  date: string
  from: string
  to: string
  category: 'bottleneck' | 'sentiment' | 'constraint'
  evidence: string[]
  significance: number // 0-100
  investmentImplication: string
}

/**
 * Predefined predictions from wiki sources with known outcomes
 */
export const HISTORICAL_PREDICTIONS: Prediction[] = [
  // Dylan Patel - Power Constraints (CORRECT)
  {
    id: 'patel-power-2025-06',
    date: '2025-06-15',
    source: '[[Dylan Patel]]',
    claim: 'Power will be the bottleneck, not chips, by 2026',
    category: 'power',
    confidence: 85,
    outcome: 'correct',
    verificationDate: '2026-03-01',
    verificationEvidence: '47% of data centers delayed due to power constraints vs 12% for chips',
    accuracyScore: 95
  },
  {
    id: 'patel-electrician-2025-06',
    date: '2025-06-15',
    source: '[[Dylan Patel]]',
    claim: 'Electrician shortage will delay data center deployments 18-24 months',
    category: 'power',
    confidence: 80,
    outcome: 'correct',
    verificationDate: '2026-04-01',
    verificationEvidence: 'Average deployment delay: 22 months for projects announced in 2024',
    accuracyScore: 90
  },
  {
    id: 'patel-hbm-2024-09',
    date: '2024-09-01',
    source: '[[Dylan Patel]]',
    claim: 'HBM bottleneck will resolve by Q2 2025 as SK Hynix/Micron scale',
    category: 'bottleneck',
    confidence: 75,
    outcome: 'correct',
    verificationDate: '2025-06-01',
    verificationEvidence: 'HBM supply exceeded demand by Q2 2025, pricing declined 15%',
    accuracyScore: 88
  },

  // Howard Marks - Debt & Bubble Warnings (CORRECT)
  {
    id: 'marks-debt-2025-12',
    date: '2025-12-10',
    source: '[[Howard Marks]]',
    claim: 'Debt-financed AI infrastructure is toxic when ROI is conjecture',
    category: 'debt',
    confidence: 82,
    outcome: 'correct',
    verificationDate: '2026-04-01',
    verificationEvidence: 'Oracle layoffs (8K employees), multiple AI startups unable to service debt',
    accuracyScore: 85
  },
  {
    id: 'marks-roi-2026-02',
    date: '2026-02-15',
    source: '[[Howard Marks]]',
    claim: 'Most enterprises will struggle to demonstrate AI ROI',
    category: 'roi',
    confidence: 78,
    outcome: 'correct',
    verificationDate: '2026-04-15',
    verificationEvidence: 'McKinsey study shows 95% struggle to demonstrate business value',
    accuracyScore: 92
  },

  // Gary Marcus - Scaling Skepticism (INCORRECT)
  {
    id: 'marcus-scaling-2025-03',
    date: '2025-03-20',
    source: '[[Gary Marcus]]',
    claim: 'Scaling will hit fundamental wall by end of 2025',
    category: 'scaling',
    confidence: 70,
    outcome: 'incorrect',
    verificationDate: '2026-01-01',
    verificationEvidence: 'GPT-5 and Claude Opus 4 exceeded benchmarks, continued scaling success',
    accuracyScore: 30
  },
  {
    id: 'marcus-agi-2025-03',
    date: '2025-03-20',
    source: '[[Gary Marcus]]',
    claim: 'AGI unlikely before 2030 due to fundamental limitations',
    category: 'scaling',
    confidence: 65,
    outcome: 'pending',
    verificationDate: undefined,
    verificationEvidence: undefined,
    accuracyScore: undefined
  },

  // Jensen Huang - Scaling Optimism (CORRECT)
  {
    id: 'huang-scaling-2025-03',
    date: '2025-03-18',
    source: '[[Jensen Huang]]',
    claim: 'Scaling is alive and well, will continue for years',
    category: 'scaling',
    confidence: 90,
    outcome: 'correct',
    verificationDate: '2026-04-01',
    verificationEvidence: 'Claude Opus 4, GPT-5 showed continued capability improvements',
    accuracyScore: 88
  },
  {
    id: 'huang-demand-2025-03',
    date: '2025-03-18',
    source: '[[Jensen Huang]]',
    claim: 'H200 demand will exceed supply 10x through 2025',
    category: 'market',
    confidence: 85,
    outcome: 'correct',
    verificationDate: '2025-12-01',
    verificationEvidence: 'Order backlogs extended to 18 months, pricing premium sustained',
    accuracyScore: 92
  },

  // Dario Amodei - Capability Predictions (PARTIAL)
  {
    id: 'amodei-capability-2025-10',
    date: '2025-10-15',
    source: '[[Dario Amodei]]',
    claim: 'We will see systems 100x more capable within 2-3 years',
    category: 'scaling',
    confidence: 80,
    outcome: 'pending',
    verificationDate: undefined,
    verificationEvidence: undefined,
    accuracyScore: undefined
  },

  // McKinsey/BCG - Enterprise AI ROI (CORRECT)
  {
    id: 'mckinsey-roi-2025-11',
    date: '2025-11-01',
    source: 'McKinsey/BCG',
    claim: '5-6% of enterprises will be high performers, 95% will struggle with ROI',
    category: 'roi',
    confidence: 88,
    outcome: 'correct',
    verificationDate: '2026-03-15',
    verificationEvidence: 'Follow-up studies confirmed bifurcation, performance gap widening',
    accuracyScore: 94
  },

  // Daron Acemoglu - Economic Impact (PARTIAL)
  {
    id: 'acemoglu-gdp-2024-12',
    date: '2024-12-01',
    source: '[[Daron Acemoglu]]',
    claim: 'AI will only add 0.5-1% to GDP growth, not transformational',
    category: 'market',
    confidence: 60,
    outcome: 'pending',
    verificationDate: undefined,
    verificationEvidence: undefined,
    accuracyScore: undefined
  }
]

/**
 * Detected regime changes in AI infrastructure
 */
export const REGIME_CHANGES: RegimeChange[] = [
  {
    date: '2023-12-01',
    from: 'No clear bottleneck',
    to: 'GPU/chip shortage',
    category: 'bottleneck',
    evidence: [
      'H100 lead times extended to 12+ months',
      'Hyperscalers competing for allocation',
      'NVIDIA pricing power at peak'
    ],
    significance: 85,
    investmentImplication: 'LONG NVIDIA, AMD GPU suppliers'
  },
  {
    date: '2024-08-01',
    from: 'GPU/chip shortage',
    to: 'HBM memory constraint',
    category: 'bottleneck',
    evidence: [
      'GPU production scaling but HBM lagging',
      'SK Hynix, Micron capacity constraints',
      'CoWoS packaging bottleneck at TSMC'
    ],
    significance: 80,
    investmentImplication: 'LONG SK Hynix, Micron (HBM suppliers)'
  },
  {
    date: '2025-06-15',
    from: 'HBM memory constraint',
    to: 'Power/electrical infrastructure',
    category: 'bottleneck',
    evidence: [
      'HBM supply catching up to demand',
      '47% of data centers delayed due to power',
      'Transformer lead times: 2-3 years',
      'Electrician shortage: 4-year training pipeline',
      'Dylan Patel prediction confirmed'
    ],
    significance: 95,
    investmentImplication: 'ROTATE from GPU to electrical equipment (ABB, Siemens, Eaton)'
  },
  {
    date: '2026-01-15',
    from: 'AI hype peak',
    to: 'ROI reality check',
    category: 'sentiment',
    evidence: [
      'McKinsey: 95% struggle to show ROI',
      'Oracle layoffs (8,000)',
      'VC funding for AI infrastructure declining',
      'Howard Marks warnings validated'
    ],
    significance: 88,
    investmentImplication: 'SHORT unproven AI vendors, LONG proven winners (Microsoft, hyperscalers)'
  }
]

/**
 * Calculate source credibility from historical predictions
 */
export function calculateSourceCredibility(source: string): SourceCredibility {
  const sourcePredictions = HISTORICAL_PREDICTIONS.filter(p => p.source === source)

  const total = sourcePredictions.length
  const correct = sourcePredictions.filter(p => p.outcome === 'correct').length
  const incorrect = sourcePredictions.filter(p => p.outcome === 'incorrect').length
  const pending = sourcePredictions.filter(p => p.outcome === 'pending').length

  const accuracy = total > 0 ? (correct / (correct + incorrect)) * 100 : 0

  // Calculate category-specific accuracy
  const categoryAccuracy: { [key: string]: number } = {}
  const categories = ['power', 'debt', 'roi', 'scaling', 'bottleneck', 'market']

  categories.forEach(cat => {
    const catPreds = sourcePredictions.filter(p => p.category === cat)
    const catCorrect = catPreds.filter(p => p.outcome === 'correct').length
    const catIncorrect = catPreds.filter(p => p.outcome === 'incorrect').length
    const catTotal = catCorrect + catIncorrect

    categoryAccuracy[cat] = catTotal > 0 ? (catCorrect / catTotal) * 100 : 0
  })

  // Calculate lead time (how far ahead they were correct)
  const correctPreds = sourcePredictions.filter(p => p.outcome === 'correct')
  let avgLeadTime = 0
  if (correctPreds.length > 0) {
    const leadTimes = correctPreds.map(p => {
      if (!p.verificationDate) return 0
      const predDate = new Date(p.date)
      const verDate = new Date(p.verificationDate)
      return (verDate.getTime() - predDate.getTime()) / (1000 * 60 * 60 * 24 * 30) // months
    })
    avgLeadTime = leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
  }

  // Determine trend (simplified - could be more sophisticated)
  const recentTrend: 'improving' | 'declining' | 'stable' = 'stable'

  return {
    source,
    totalPredictions: total,
    correctPredictions: correct,
    incorrectPredictions: incorrect,
    pendingPredictions: pending,
    overallAccuracy: accuracy,
    categoryAccuracy,
    leadTime: Math.round(avgLeadTime),
    recentTrend
  }
}

/**
 * Get all unique sources from predictions
 */
export function getAllSources(): string[] {
  return [...new Set(HISTORICAL_PREDICTIONS.map(p => p.source))].sort()
}

/**
 * Get credibility leaderboard
 */
export function getCredibilityLeaderboard(): SourceCredibility[] {
  const sources = getAllSources()
  return sources
    .map(s => calculateSourceCredibility(s))
    .filter(s => s.totalPredictions > 0)
    .sort((a, b) => b.overallAccuracy - a.overallAccuracy)
}

/**
 * Get current bottleneck based on regime changes
 */
export function getCurrentBottleneck(): RegimeChange {
  return REGIME_CHANGES.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0]
}

/**
 * Get regime change history
 */
export function getRegimeHistory(): RegimeChange[] {
  return REGIME_CHANGES.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

/**
 * Predict next regime change based on current evidence
 */
export function predictNextRegime(): {
  likely: string
  timeframe: string
  confidence: number
  evidence: string[]
} {
  // Based on current trajectory (2026-04-20)
  return {
    likely: 'SMR/nuclear power deployment',
    timeframe: '2027-2028',
    confidence: 65,
    evidence: [
      'Multiple SMR announcements from tech companies',
      'Regulatory approval timelines: 18-24 months',
      'Electrical equipment shortage persists',
      'If SMRs deploy successfully, power constraint could ease'
    ]
  }
}

/**
 * Get predictions for a specific source
 */
export function getPredictionsBySource(source: string): Prediction[] {
  return HISTORICAL_PREDICTIONS.filter(p => p.source === source)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Get predictions by category
 */
export function getPredictionsByCategory(category: string): Prediction[] {
  return HISTORICAL_PREDICTIONS.filter(p => p.category === category)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Get recent predictions (last N days)
 */
export function getRecentPredictions(days: number = 180): Prediction[] {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return HISTORICAL_PREDICTIONS.filter(p =>
    new Date(p.date) >= cutoffDate
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Get accuracy statistics
 */
export function getAccuracyStats(): {
  totalPredictions: number
  verified: number
  pending: number
  overallAccuracy: number
  byCategory: { [key: string]: { total: number; accuracy: number } }
} {
  const total = HISTORICAL_PREDICTIONS.length
  const verified = HISTORICAL_PREDICTIONS.filter(p => p.outcome !== 'pending').length
  const pending = total - verified

  const correct = HISTORICAL_PREDICTIONS.filter(p => p.outcome === 'correct').length
  const incorrect = HISTORICAL_PREDICTIONS.filter(p => p.outcome === 'incorrect').length
  const overallAccuracy = verified > 0 ? (correct / verified) * 100 : 0

  const categories = ['power', 'debt', 'roi', 'scaling', 'bottleneck', 'market']
  const byCategory: { [key: string]: { total: number; accuracy: number } } = {}

  categories.forEach(cat => {
    const catPreds = HISTORICAL_PREDICTIONS.filter(p => p.category === cat)
    const catVerified = catPreds.filter(p => p.outcome !== 'pending')
    const catCorrect = catPreds.filter(p => p.outcome === 'correct').length
    const catTotal = catVerified.length

    byCategory[cat] = {
      total: catPreds.length,
      accuracy: catTotal > 0 ? (catCorrect / catTotal) * 100 : 0
    }
  })

  return {
    totalPredictions: total,
    verified,
    pending,
    overallAccuracy,
    byCategory
  }
}
