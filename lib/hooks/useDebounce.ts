import { useState, useEffect } from 'react'

/**
 * Debounces a value - useful for search inputs and real-time updates
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default: 500ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup function to cancel the timeout if value changes before delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook to detect if a value is currently being debounced
 * Useful for showing loading states during debounce
 */
export function useDebounceState<T>(value: T, delay: number = 500) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [isDebouncing, setIsDebouncing] = useState(false)

  useEffect(() => {
    setIsDebouncing(true)

    const handler = setTimeout(() => {
      setDebouncedValue(value)
      setIsDebouncing(false)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return { debouncedValue, isDebouncing }
}
