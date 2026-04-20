'use client'

import { useState, useRef, useEffect } from 'react'

interface ScenarioResult {
  type: 'status' | 'analysis_chunk' | 'complete' | 'error'
  message?: string
  data?: any
}

const PREDEFINED_SCENARIOS = [
  {
    name: 'TSMC 2x CoWoS Capacity',
    description: 'What if TSMC doubles advanced packaging capacity by Q4 2026?',
    scenario: 'TSMC announces successful 2x expansion of CoWoS packaging capacity, eliminating HBM bottleneck earlier than expected.',
    category: 'bottleneck'
  },
  {
    name: 'SMR Deployment Success',
    description: 'What if Small Modular Reactors deploy on schedule?',
    scenario: 'Multiple tech companies successfully deploy SMR nuclear reactors for data centers by 2027, solving power constraints.',
    category: 'power'
  },
  {
    name: 'AI Winter / Bubble Pop',
    description: 'What if enterprise ROI remains elusive and funding dries up?',
    scenario: 'By 2027, 95% of enterprises still cannot demonstrate AI ROI. VC funding for AI infrastructure collapses. Debt-financed projects default.',
    category: 'market'
  },
  {
    name: 'GPT-6 Scaling Breakthrough',
    description: 'What if GPT-6 demonstrates AGI-level capabilities?',
    scenario: 'OpenAI releases GPT-6 with unprecedented reasoning abilities, validating scaling laws and sparking $10T market revaluation.',
    category: 'scaling'
  },
  {
    name: 'China Taiwan Conflict',
    description: 'What if TSMC supply is disrupted?',
    scenario: 'Geopolitical tensions disrupt TSMC operations, causing severe chip shortage affecting all AI infrastructure.',
    category: 'geopolitical'
  },
  {
    name: 'Regulation Clampdown',
    description: 'What if governments heavily regulate AI?',
    scenario: 'US/EU implement strict AI regulation requiring licensing, auditing, and limiting compute for frontier models.',
    category: 'regulatory'
  }
]

export default function ScenarioPage() {
  const [customScenario, setCustomScenario] = useState('')
  const [selectedPredefined, setSelectedPredefined] = useState<typeof PREDEFINED_SCENARIOS[0] | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStatus, setCurrentStatus] = useState('')
  const [analysis, setAnalysis] = useState('')
  const analysisRef = useRef<HTMLDivElement>(null)

  const handleAnalyze = async (scenario: string) => {
    if (!scenario) return

    setIsAnalyzing(true)
    setCurrentStatus('Running scenario through wiki frameworks...')
    setAnalysis('')

    try {
      const response = await fetch('/api/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          category: selectedPredefined?.category || 'general'
        })
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6)) as ScenarioResult

            switch (data.type) {
              case 'status':
                setCurrentStatus(data.message || '')
                break

              case 'analysis_chunk':
                setAnalysis(prev => prev + data.data)
                break

              case 'complete':
                setIsAnalyzing(false)
                setCurrentStatus('Analysis complete')
                break

              case 'error':
                console.error('Analysis error:', data.message)
                setCurrentStatus(`Error: ${data.message}`)
                setIsAnalyzing(false)
                break
            }
          } catch (e) {
            console.error('Parse error:', e)
          }
        }
      }
    } catch (error) {
      console.error('Scenario analysis error:', error)
      setCurrentStatus('Error during analysis')
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    if (analysisRef.current) {
      analysisRef.current.scrollTop = analysisRef.current.scrollHeight
    }
  }, [analysis])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Scenario Simulator
          </h1>
          <p className="text-gray-300">
            Run "what if" scenarios through 403-page wiki. See downstream effects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            {/* Predefined Scenarios */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">🎯 Predefined Scenarios</h2>
              <div className="space-y-2">
                {PREDEFINED_SCENARIOS.map((scenario, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPredefined(scenario)
                      setCustomScenario('')
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedPredefined?.name === scenario.name
                        ? 'bg-blue-900/50 border-blue-600'
                        : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold mb-1">{scenario.name}</div>
                    <div className="text-sm text-gray-400">{scenario.description}</div>
                    <div className="mt-2">
                      <span className="px-2 py-1 bg-gray-600 rounded text-xs capitalize">
                        {scenario.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Scenario */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">✏️ Custom Scenario</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Describe your "what if" scenario
                  </label>
                  <textarea
                    value={customScenario}
                    onChange={(e) => {
                      setCustomScenario(e.target.value)
                      setSelectedPredefined(null)
                    }}
                    placeholder="What if... (e.g., 'What if Anthropic releases Claude Opus 5 with 10x better reasoning?')"
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  onClick={() => handleAnalyze(selectedPredefined?.scenario || customScenario)}
                  disabled={isAnalyzing || (!customScenario && !selectedPredefined)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Simulating...
                    </span>
                  ) : (
                    '🔮 Run Scenario'
                  )}
                </button>

                {currentStatus && (
                  <div className="flex items-center space-x-2 text-sm text-blue-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>{currentStatus}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-700 text-sm">
              <h3 className="font-semibold mb-2">How it works:</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• AlphaBot queries wiki for relevant frameworks</li>
                <li>• Applies scenario to each framework</li>
                <li>• Identifies downstream effects</li>
                <li>• Generates investment implications</li>
                <li>• Shows probability and risk factors</li>
              </ul>
            </div>
          </div>

          {/* Analysis Panel */}
          <div>
            {analysis ? (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-6">
                <h3 className="text-lg font-semibold mb-3">📊 Scenario Analysis</h3>
                <div
                  ref={analysisRef}
                  className="prose prose-invert max-w-none overflow-y-auto max-h-[700px] text-sm"
                  dangerouslySetInnerHTML={{
                    __html: analysis
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\[\[(.+?)\]\]/g, '<span class="text-blue-400">&#91;&#91;$1&#93;&#93;</span>')
                      .replace(/### (.+)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                      .replace(/## (.+)/g, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 h-full flex items-center justify-center sticky top-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔮</div>
                  <p className="text-gray-400">Select a scenario to begin simulation</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Or write your own "what if" scenario
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Example Output */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">💡 Example Output Format</h2>
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-semibold text-blue-400 mb-1">Scenario Impact Assessment</div>
              <div className="text-gray-300">Likelihood: [0-100]% | Timeframe: [timeline]</div>
            </div>
            <div>
              <div className="font-semibold text-blue-400 mb-1">Downstream Effects</div>
              <div className="text-gray-300">• Primary bottleneck shift (with evidence from wiki)</div>
              <div className="text-gray-300">• Secondary market reactions</div>
              <div className="text-gray-300">• Tertiary supply chain impacts</div>
            </div>
            <div>
              <div className="font-semibold text-blue-400 mb-1">Investment Implications</div>
              <div className="text-gray-300">LONG opportunities | SHORT opportunities | Risk factors</div>
            </div>
            <div>
              <div className="font-semibold text-blue-400 mb-1">Wiki Framework Analysis</div>
              <div className="text-gray-300">Which frameworks support/contradict this scenario with citations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
