import { useCallback, useEffect, useRef, useState } from 'react'

interface InternalTimerState {
  duration: number
  remainingMs: number
  isRunning: boolean
  expiresAt?: number
}

export interface RestTimerState {
  duration: number
  remainingMs: number
  isRunning: boolean
}

interface UseRestTimersOptions {
  onTimerComplete?: (exerciseId: string) => void
}

export const useRestTimers = (options?: UseRestTimersOptions) => {
  const [timers, setTimers] = useState<Record<string, InternalTimerState>>({})
  const intervalRef = useRef<number | null>(null)
  const onTimerCompleteRef = useRef(options?.onTimerComplete)

  // Keep callback ref up to date
  useEffect(() => {
    onTimerCompleteRef.current = options?.onTimerComplete
  }, [options?.onTimerComplete])

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setTimers((prev) => {
        let mutated = false
        const next: Record<string, InternalTimerState> = {}
        const completedTimers: string[] = []

        Object.entries(prev).forEach(([key, state]) => {
          if (!state.isRunning || !state.expiresAt) {
            next[key] = state
            return
          }

          const remainingMs = Math.max(0, state.expiresAt - Date.now())
          if (remainingMs === 0 && state.isRunning) {
            mutated = true
            next[key] = { duration: state.duration, remainingMs: 0, isRunning: false }
            completedTimers.push(key)
            return
          }

          if (Math.abs(remainingMs - state.remainingMs) > 20) {
            mutated = true
            next[key] = { ...state, remainingMs }
          } else {
            next[key] = state
          }
        })

        // Schedule callback invocations outside of state update
        if (completedTimers.length > 0) {
          queueMicrotask(() => {
            completedTimers.forEach((id) => {
              onTimerCompleteRef.current?.(id)
            })
          })
        }

        return mutated ? next : prev
      })
    }, 200)

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startTimer = useCallback((exerciseId: string, seconds: number) => {
    setTimers((prev) => ({
      ...prev,
      [exerciseId]: {
        duration: seconds,
        remainingMs: seconds * 1000,
        isRunning: true,
        expiresAt: Date.now() + seconds * 1000,
      },
    }))
  }, [])

  const pauseTimer = useCallback((exerciseId: string) => {
    setTimers((prev) => {
      const timer = prev[exerciseId]
      if (!timer) return prev
      return {
        ...prev,
        [exerciseId]: {
          duration: timer.duration,
          remainingMs: timer.remainingMs,
          isRunning: false,
        },
      }
    })
  }, [])

  const resetTimer = useCallback((exerciseId: string) => {
    setTimers((prev) => {
      if (!prev[exerciseId]) return prev
      const copy = { ...prev }
      delete copy[exerciseId]
      return copy
    })
  }, [])

  const getTimerState = useCallback(
    (exerciseId: string): RestTimerState => {
      const timer = timers[exerciseId]
      if (!timer) {
        return { duration: 0, remainingMs: 0, isRunning: false }
      }
      return { duration: timer.duration, remainingMs: timer.remainingMs, isRunning: timer.isRunning }
    },
    [timers],
  )

  return {
    timers,
    getTimerState,
    startTimer,
    pauseTimer,
    resetTimer,
  }
}
