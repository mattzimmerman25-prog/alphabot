'use client'

import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/news', label: 'News' },
    { href: '/synthesize', label: 'Synthesize' },
    { href: '/batch', label: 'Batch' },
    { href: '/compare', label: 'Compare' },
    { href: '/scenario', label: 'Scenario' },
    { href: '/chat', label: 'Chat' },
    { href: '/graph', label: 'Graph' },
    { href: '/temporal', label: 'Temporal' },
    { href: '/backtest', label: 'Backtest' },
  ]

  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4 sm:space-x-8">
                <div className="flex items-center">
                  <h1 className="text-xl sm:text-2xl font-bold text-alphabot-blue dark:text-blue-400">
                    🤖 AlphaBot
                  </h1>
                  <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    v2.0
                  </span>
                </div>
                {/* Desktop Navigation */}
                <div className="hidden lg:flex space-x-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        pathname === link.href
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
                  Wiki: 403 pages
                </span>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" title="System active"></div>
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      pathname === link.href
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
        <main>
          {children}
        </main>
        <footer className="mt-12 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>AlphaBot V2 • Real-Time Intelligence • Powered by Claude Sonnet 4.5</p>
        </footer>
      </body>
    </html>
  )
}
