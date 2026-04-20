'use client'

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component to catch React errors and display fallback UI
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo)
    // In production, send to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-gray-800 rounded-lg p-8 border border-red-700">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold mb-4 text-red-400">Something went wrong</h1>
            <p className="text-gray-300 mb-6">
              AlphaBot encountered an unexpected error. Don't worry - your data is safe.
            </p>

            {this.state.error && (
              <details className="mb-6">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
                  Technical details
                </summary>
                <div className="bg-gray-900 rounded p-4 text-xs font-mono text-red-300 overflow-auto max-h-48">
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <pre className="mt-2 text-gray-500">{this.state.error.stack}</pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.href = '/'
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Simple inline error display component
 */
export function ErrorMessage({
  title = 'Error',
  message,
  retry,
}: {
  title?: string
  message: string
  retry?: () => void
}) {
  return (
    <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
      <div className="text-4xl mb-3">❌</div>
      <h3 className="text-lg font-semibold text-red-400 mb-2">{title}</h3>
      <p className="text-sm text-gray-300 mb-4">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

/**
 * Network error component with retry
 */
export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6 text-center">
      <div className="text-4xl mb-3">🌐</div>
      <h3 className="text-lg font-semibold text-yellow-400 mb-2">Network Error</h3>
      <p className="text-sm text-gray-300 mb-4">
        Unable to connect to the server. Please check your internet connection.
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-colors"
      >
        Retry
      </button>
    </div>
  )
}

/**
 * Empty state component
 */
export function EmptyState({
  icon = '📭',
  title = 'No data',
  message = 'Nothing to display yet',
  action,
}: {
  icon?: string
  title?: string
  message?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
