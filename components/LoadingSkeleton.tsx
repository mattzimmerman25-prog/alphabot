/**
 * Loading skeleton components for better perceived performance
 * Shows placeholder content while data is loading
 */

export function CardSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
        <div className="w-20 h-6 bg-gray-700 rounded"></div>
      </div>
      <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-700 rounded w-5/6 mt-2"></div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700 animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-16 mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-24"></div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="p-4 bg-gray-800/30 rounded border border-gray-700 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-5 bg-gray-700 rounded w-32"></div>
        <div className="h-5 bg-gray-700 rounded w-20"></div>
      </div>
      <div className="h-4 bg-gray-700 rounded w-full mb-1"></div>
      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
    </div>
  )
}

export function AnalysisSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-11/12"></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-4/5"></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    </div>
  )
}

export function ChipSkeleton() {
  return (
    <div className="inline-block px-4 py-2 bg-gray-700 rounded-full animate-pulse">
      <div className="h-4 w-20 bg-gray-600 rounded"></div>
    </div>
  )
}

export function ButtonSkeleton() {
  return (
    <div className="px-6 py-3 bg-gray-700 rounded-lg animate-pulse">
      <div className="h-5 w-32 bg-gray-600 rounded"></div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  count?: number
}

/**
 * Generic skeleton with customizable shape
 */
export function Skeleton({ className = 'h-4 w-full', count = 1 }: SkeletonProps) {
  if (count === 1) {
    return <div className={`bg-gray-700 rounded animate-pulse ${className}`}></div>
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-gray-700 rounded animate-pulse ${className}`}></div>
      ))}
    </>
  )
}

/**
 * Dashboard grid skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * List skeleton
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  )
}
