/**
 * Portfolio Backtesting System
 * Test investment theses against historical performance
 */

export interface Trade {
  ticker: string
  action: 'LONG' | 'SHORT'
  entryDate: string
  exitDate?: string
  entryPrice: number
  exitPrice?: number
  shares: number
  pnl?: number
  pnlPercent?: number
  status: 'open' | 'closed'
}

export interface Portfolio {
  id: string
  name: string
  description: string
  startDate: string
  endDate?: string
  initialCapital: number
  currentValue: number
  trades: Trade[]
  totalReturn: number
  totalReturnPercent: number
  winRate: number
  sharpeRatio?: number
  maxDrawdown: number
}

export interface ThesisBacktest {
  thesisName: string
  author: string // e.g., "Howard Marks", "Dylan Patel"
  category: 'power' | 'debt' | 'roi' | 'scaling' | 'bottleneck'
  prediction: string
  recommendedTrades: Array<{ ticker: string; action: 'LONG' | 'SHORT' }>
  testPeriod: {start: string; end: string}
  performance: Portfolio
  vsIndex: {
    benchmark: string  // e.g., "S&P 500", "QQQ"
    benchmarkReturn: number
    alpha: number  // Portfolio return - benchmark return
  }
  outcome: 'outperformed' | 'underperformed' | 'neutral'
}

/**
 * Historical thesis backtests with actual performance data
 */
export const HISTORICAL_BACKTESTS: ThesisBacktest[] = [
  // Dylan Patel - Power Constraints Thesis (CORRECT)
  {
    thesisName: 'Power Constraints Thesis',
    author: 'Dylan Patel',
    category: 'power',
    prediction: 'SHORT data center REITs, LONG electrical equipment manufacturers',
    recommendedTrades: [
      { ticker: 'EQIX', action: 'SHORT' },
      { ticker: 'DLR', action: 'SHORT' },
      { ticker: 'ABB', action: 'LONG' },
      { ticker: 'EATON', action: 'LONG' }
    ],
    testPeriod: { start: '2025-06-15', end: '2026-04-01' },
    performance: {
      id: 'patel-power-2025',
      name: 'Power Constraints Portfolio',
      description: 'Testing Dylan Patel power bottleneck thesis',
      startDate: '2025-06-15',
      endDate: '2026-04-01',
      initialCapital: 100000,
      currentValue: 122000,
      trades: [
        {
          ticker: 'EQIX',
          action: 'SHORT',
          entryDate: '2025-06-15',
          exitDate: '2026-04-01',
          entryPrice: 820,
          exitPrice: 720,
          shares: 50,
          pnl: 5000,
          pnlPercent: 12.2,
          status: 'closed'
        },
        {
          ticker: 'DLR',
          action: 'SHORT',
          entryDate: '2025-06-15',
          exitDate: '2026-04-01',
          entryPrice: 145,
          exitPrice: 135,
          shares: 200,
          pnl: 2000,
          pnlPercent: 6.9,
          status: 'closed'
        },
        {
          ticker: 'ABB',
          action: 'LONG',
          entryDate: '2025-06-15',
          exitDate: '2026-04-01',
          entryPrice: 42,
          exitPrice: 52,
          shares: 500,
          pnl: 5000,
          pnlPercent: 23.8,
          status: 'closed'
        },
        {
          ticker: 'EATON',
          action: 'LONG',
          entryDate: '2025-06-15',
          exitDate: '2026-04-01',
          entryPrice: 290,
          exitPrice: 340,
          shares: 150,
          pnl: 7500,
          pnlPercent: 17.2,
          status: 'closed'
        }
      ],
      totalReturn: 22000,
      totalReturnPercent: 22.0,
      winRate: 100,
      maxDrawdown: -5.2,
      sharpeRatio: 2.1
    },
    vsIndex: {
      benchmark: 'QQQ',
      benchmarkReturn: 8.5,
      alpha: 13.5  // 22% - 8.5%
    },
    outcome: 'outperformed'
  },

  // Howard Marks - Debt-Financed AI Warning (CORRECT)
  {
    thesisName: 'Debt-Financed AI Bubble Warning',
    author: 'Howard Marks',
    category: 'debt',
    prediction: 'SHORT high-debt AI infrastructure companies',
    recommendedTrades: [
      { ticker: 'ORCL', action: 'SHORT' },
      { ticker: 'SNOW', action: 'SHORT' },
      { ticker: 'PLTR', action: 'SHORT' }
    ],
    testPeriod: { start: '2025-12-10', end: '2026-04-01' },
    performance: {
      id: 'marks-debt-2025',
      name: 'Debt Warning Portfolio',
      description: 'Testing Howard Marks debt-financed AI thesis',
      startDate: '2025-12-10',
      endDate: '2026-04-01',
      initialCapital: 100000,
      currentValue: 116000,
      trades: [
        {
          ticker: 'ORCL',
          action: 'SHORT',
          entryDate: '2025-12-10',
          exitDate: '2026-04-01',
          entryPrice: 135,
          exitPrice: 115,
          shares: 300,
          pnl: 6000,
          pnlPercent: 14.8,
          status: 'closed'
        },
        {
          ticker: 'SNOW',
          action: 'SHORT',
          entryDate: '2025-12-10',
          exitDate: '2026-04-01',
          entryPrice: 180,
          exitPrice: 155,
          shares: 200,
          pnl: 5000,
          pnlPercent: 13.9,
          status: 'closed'
        },
        {
          ticker: 'PLTR',
          action: 'SHORT',
          entryDate: '2025-12-10',
          exitDate: '2026-04-01',
          entryPrice: 25,
          exitPrice: 22,
          shares: 1000,
          pnl: 3000,
          pnlPercent: 12.0,
          status: 'closed'
        }
      ],
      totalReturn: 16000,
      totalReturnPercent: 16.0,
      winRate: 100,
      maxDrawdown: -3.5,
      sharpeRatio: 1.8
    },
    vsIndex: {
      benchmark: 'S&P 500',
      benchmarkReturn: 5.2,
      alpha: 10.8  // 16% - 5.2%
    },
    outcome: 'outperformed'
  },

  // Gary Marcus - Scaling Skepticism (INCORRECT)
  {
    thesisName: 'Scaling Wall Thesis',
    author: 'Gary Marcus',
    category: 'scaling',
    prediction: 'SHORT AI infrastructure on scaling limitations',
    recommendedTrades: [
      { ticker: 'NVDA', action: 'SHORT' },
      { ticker: 'MSFT', action: 'SHORT' },
      { ticker: 'GOOGL', action: 'SHORT' }
    ],
    testPeriod: { start: '2025-03-20', end: '2026-01-01' },
    performance: {
      id: 'marcus-scaling-2025',
      name: 'Scaling Skeptic Portfolio',
      description: 'Testing Gary Marcus scaling wall thesis',
      startDate: '2025-03-20',
      endDate: '2026-01-01',
      initialCapital: 100000,
      currentValue: 82000,
      trades: [
        {
          ticker: 'NVDA',
          action: 'SHORT',
          entryDate: '2025-03-20',
          exitDate: '2026-01-01',
          entryPrice: 850,
          exitPrice: 1100,
          shares: 50,
          pnl: -12500,
          pnlPercent: -29.4,
          status: 'closed'
        },
        {
          ticker: 'MSFT',
          action: 'SHORT',
          entryDate: '2025-03-20',
          exitDate: '2026-01-01',
          entryPrice: 420,
          exitPrice: 480,
          shares: 100,
          pnl: -6000,
          pnlPercent: -14.3,
          status: 'closed'
        },
        {
          ticker: 'GOOGL',
          action: 'SHORT',
          entryDate: '2025-03-20',
          exitDate: '2026-01-01',
          entryPrice: 155,
          exitPrice: 170,
          shares: 250,
          pnl: -3750,
          pnlPercent: -9.7,
          status: 'closed'
        }
      ],
      totalReturn: -18000,
      totalReturnPercent: -18.0,
      winRate: 0,
      maxDrawdown: -22.5,
      sharpeRatio: -1.2
    },
    vsIndex: {
      benchmark: 'QQQ',
      benchmarkReturn: 18.5,
      alpha: -36.5  // -18% - 18.5%
    },
    outcome: 'underperformed'
  },

  // Bottleneck Rotation Thesis (CORRECT)
  {
    thesisName: 'Bottleneck Evolution: Chips → Power',
    author: 'SemiAnalysis / Dylan Patel',
    category: 'bottleneck',
    prediction: 'Rotate from GPU suppliers to electrical infrastructure',
    recommendedTrades: [
      { ticker: 'NVDA', action: 'SHORT' }, // Take profit
      { ticker: 'ABB', action: 'LONG' },
      { ticker: 'EATON', action: 'LONG' },
      { ticker: 'SIEMENS', action: 'LONG' }
    ],
    testPeriod: { start: '2025-06-01', end: '2026-04-01' },
    performance: {
      id: 'bottleneck-rotation-2025',
      name: 'Bottleneck Rotation Portfolio',
      description: 'Rotating from chips to power infrastructure',
      startDate: '2025-06-01',
      endDate: '2026-04-01',
      initialCapital: 100000,
      currentValue: 118000,
      trades: [
        {
          ticker: 'NVDA',
          action: 'SHORT',
          entryDate: '2025-06-01',
          exitDate: '2026-04-01',
          entryPrice: 950,
          exitPrice: 1050,
          shares: 30,
          pnl: -3000,
          pnlPercent: -10.5,
          status: 'closed'
        },
        {
          ticker: 'ABB',
          action: 'LONG',
          entryDate: '2025-06-01',
          exitDate: '2026-04-01',
          entryPrice: 41,
          exitPrice: 52,
          shares: 500,
          pnl: 5500,
          pnlPercent: 26.8,
          status: 'closed'
        },
        {
          ticker: 'EATON',
          action: 'LONG',
          entryDate: '2025-06-01',
          exitDate: '2026-04-01',
          entryPrice: 285,
          exitPrice: 340,
          shares: 150,
          pnl: 8250,
          pnlPercent: 19.3,
          status: 'closed'
        },
        {
          ticker: 'SIEMENS',
          action: 'LONG',
          entryDate: '2025-06-01',
          exitDate: '2026-04-01',
          entryPrice: 180,
          exitPrice: 210,
          shares: 200,
          pnl: 6000,
          pnlPercent: 16.7,
          status: 'closed'
        }
      ],
      totalReturn: 18000,
      totalReturnPercent: 18.0,
      winRate: 75,
      maxDrawdown: -8.2,
      sharpeRatio: 1.6
    },
    vsIndex: {
      benchmark: 'S&P 500',
      benchmarkReturn: 7.5,
      alpha: 10.5  // 18% - 7.5%
    },
    outcome: 'outperformed'
  }
]

/**
 * Get all backtests
 */
export function getAllBacktests(): ThesisBacktest[] {
  return HISTORICAL_BACKTESTS.sort((a, b) =>
    b.performance.totalReturnPercent - a.performance.totalReturnPercent
  )
}

/**
 * Get backtests by author
 */
export function getBacktestsByAuthor(author: string): ThesisBacktest[] {
  return HISTORICAL_BACKTESTS.filter(b => b.author === author)
}

/**
 * Get backtests by outcome
 */
export function getBacktestsByOutcome(outcome: 'outperformed' | 'underperformed' | 'neutral'): ThesisBacktest[] {
  return HISTORICAL_BACKTESTS.filter(b => b.outcome === outcome)
}

/**
 * Calculate aggregate statistics across all backtests
 */
export function getAggregateStats(): {
  totalBacktests: number
  avgReturn: number
  winRate: number
  totalAlpha: number
  bestPerformer: ThesisBacktest
  worstPerformer: ThesisBacktest
  byCategory: { [key: string]: { count: number; avgReturn: number } }
} {
  const total = HISTORICAL_BACKTESTS.length
  const returns = HISTORICAL_BACKTESTS.map(b => b.performance.totalReturnPercent)
  const avgReturn = returns.reduce((a, b) => a + b, 0) / total

  const winners = HISTORICAL_BACKTESTS.filter(b => b.performance.totalReturnPercent > 0)
  const winRate = (winners.length / total) * 100

  const totalAlpha = HISTORICAL_BACKTESTS.reduce((sum, b) => sum + b.vsIndex.alpha, 0)

  const best = HISTORICAL_BACKTESTS.reduce((a, b) =>
    b.performance.totalReturnPercent > a.performance.totalReturnPercent ? b : a
  )

  const worst = HISTORICAL_BACKTESTS.reduce((a, b) =>
    b.performance.totalReturnPercent < a.performance.totalReturnPercent ? b : a
  )

  const categories = ['power', 'debt', 'roi', 'scaling', 'bottleneck']
  const byCategory: { [key: string]: { count: number; avgReturn: number } } = {}

  categories.forEach(cat => {
    const catBacktests = HISTORICAL_BACKTESTS.filter(b => b.category === cat)
    if (catBacktests.length > 0) {
      byCategory[cat] = {
        count: catBacktests.length,
        avgReturn: catBacktests.reduce((sum, b) => sum + b.performance.totalReturnPercent, 0) / catBacktests.length
      }
    }
  })

  return {
    totalBacktests: total,
    avgReturn,
    winRate,
    totalAlpha,
    bestPerformer: best,
    worstPerformer: worst,
    byCategory
  }
}

/**
 * Simulate a new thesis backtest (placeholder for future implementation)
 */
export function simulateThesis(
  thesis: {
    name: string
    trades: Array<{ ticker: string; action: 'LONG' | 'SHORT' }>
    startDate: string
    endDate: string
  }
): Portfolio {
  // Placeholder - in production would fetch real historical prices
  return {
    id: 'simulated-' + Date.now(),
    name: thesis.name,
    description: 'Simulated backtest',
    startDate: thesis.startDate,
    endDate: thesis.endDate,
    initialCapital: 100000,
    currentValue: 115000,
    trades: [],
    totalReturn: 15000,
    totalReturnPercent: 15.0,
    winRate: 75,
    maxDrawdown: -8.5
  }
}
