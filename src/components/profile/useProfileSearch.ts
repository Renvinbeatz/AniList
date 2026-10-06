'use client'

import { useEffect, useRef, useState } from 'react'

type Result<T> = { results: T[] } | { error: string; code: string }

// Shared by anime and character pickers: debounce, abort and stale-response guard.
export function useProfileSearch<T>(endpoint: string, disabled: boolean) {
  const [query, updateQuery] = useState('')
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState<{ query: string; result: Result<T> | null }>({ query: '', result: null })
  const generation = useRef(0)
  const trimmed = query.trim()
  const valid = [...trimmed].length >= 2 && [...trimmed].length <= 100
  const current = state.query === trimmed ? state.result : null

  useEffect(() => {
    const id = ++generation.current
    if (!valid || disabled) return
    const controller = new AbortController()
    let requestTimeout: ReturnType<typeof setTimeout> | undefined
    const timeout = setTimeout(async () => {
      requestTimeout = setTimeout(() => {
        if (id === generation.current) {
          setState({ query: trimmed, result: { error: 'A busca demorou demais. Tente novamente.', code: 'UPSTREAM_ERROR' } })
          controller.abort()
        }
      }, 12000)
      try {
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        const result: Result<T> = await response.json()
        if (id === generation.current && !controller.signal.aborted) setState({ query: trimmed, result })
      } catch {
        if (id === generation.current && !controller.signal.aborted) {
          setState({ query: trimmed, result: { error: 'A busca falhou. Confira sua conexão e tente novamente.', code: 'UPSTREAM_ERROR' } })
        }
      } finally {
        clearTimeout(requestTimeout)
      }
    }, 350)
    return () => { controller.abort(); clearTimeout(timeout); clearTimeout(requestTimeout) }
  }, [endpoint, trimmed, valid, disabled, retry])

  return {
    query, valid, current,
    setQuery(value: string) { generation.current++; updateQuery(value) },
    retrySearch() { setState({ query: '', result: null }); setRetry((value) => value + 1) }
  }
}
