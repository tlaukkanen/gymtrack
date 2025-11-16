import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastPayload {
  title: string
  description?: string
  tone?: ToastTone
  id?: string
}

interface ToastContextValue {
  push: (toast: ToastPayload) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastPayload[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast: ToastPayload) => {
      const id = toast.id ?? crypto.randomUUID()
      const tone = toast.tone ?? 'info'
      setToasts((prev) => [...prev, { ...toast, id, tone }])
      setTimeout(() => remove(id), 4000)
    },
    [remove],
  )

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            <strong>{toast.title}</strong>
            {toast.description && <p>{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
