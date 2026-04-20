import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AlphaBot - AI Investment Alpha Generation',
  description: 'Real-time investment thesis generation powered by LLM Wiki synthesis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-alphabot-blue dark:text-blue-400">
                  🤖 AlphaBot
                </h1>
                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                  AI Investment Alpha Generation
                </span>
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="mt-12 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>AlphaBot v1.0 • Powered by Claude Sonnet 4.5 • Built with Next.js</p>
        </footer>
      </body>
    </html>
  )
}
