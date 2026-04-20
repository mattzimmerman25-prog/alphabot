'use client'

import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/synthesize', label: 'Synthesize' },
    { href: '/compare', label: 'Compare' },
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
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-alphabot-blue dark:text-blue-400">
                    🤖 AlphaBot
                  </h1>
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    v2.0
                  </span>
                </div>
                <div className="hidden md:flex space-x-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Wiki: 403 pages
                </span>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" title="System active"></div>
              </div>
            </div>
          </div>
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
