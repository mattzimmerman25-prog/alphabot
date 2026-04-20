'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input, history: messages })
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      let citations: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'content_chunk') {
              assistantContent += data.data
              setMessages(prev => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage?.role === 'assistant') {
                  lastMessage.content = assistantContent
                } else {
                  newMessages.push({ role: 'assistant', content: assistantContent, citations: [] })
                }
                return newMessages
              })
            } else if (data.type === 'citations') {
              citations = data.data
              setMessages(prev => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage?.role === 'assistant') {
                  lastMessage.citations = citations
                }
                return newMessages
              })
            }
          } catch (e) {
            console.error('Parse error:', e)
          }
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error processing your question. Please try again.'
      }])
      setIsLoading(false)
    }
  }

  const exampleQuestions = [
    "What does Howard Marks say about debt-financed AI infrastructure?",
    "Where do Jensen Huang and Dario Amodei agree on scaling laws?",
    "What are the key bottlenecks preventing AI deployment?",
    "Who predicted the power constraints issue earliest?",
    "What's the bull case vs bear case on AI spending sustainability?",
    "How do enterprise AI ROI studies contradict vendor claims?"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Chat with 403-Page AI Wiki
          </h1>
          <p className="text-gray-300">
            Ask questions. Get synthesis from elite frameworks. Every claim cited.
          </p>
        </div>

        {/* Example Questions */}
        {messages.length === 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-300">Try asking:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(q)}
                  className="text-left p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors text-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-4 min-h-[500px] max-h-[600px] overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-400 mb-2">Ask anything about AI infrastructure, bottlenecks, or elite frameworks</p>
              <p className="text-sm text-gray-500">
                403 pages indexed: Howard Marks, Jensen Huang, Dario Amodei, Dylan Patel, and more
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${
                    msg.role === 'user'
                      ? 'bg-blue-900/30 border-blue-700'
                      : 'bg-gray-700/50 border-gray-600'
                  } border rounded-lg p-4`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
                    }`}>
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="flex-1">
                      <div
                        className="prose prose-invert max-w-none text-sm"
                        dangerouslySetInnerHTML={{
                          __html: msg.content
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\[\[(.+?)\]\]/g, '<span class="text-blue-400 font-medium">&#91;&#91;$1&#93;&#93;</span>')
                            .replace(/\n/g, '<br />')
                        }}
                      />
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <p className="text-xs text-gray-400 mb-2">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((citation, cidx) => (
                              <span
                                key={cidx}
                                className="px-2 py-1 bg-gray-800 text-blue-300 rounded text-xs"
                              >
                                [[{citation}]]
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">AlphaBot is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about AI infrastructure, bottlenecks, elite frameworks..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Thinking...' : 'Ask'}
          </button>
        </form>
      </div>
    </div>
  )
}
