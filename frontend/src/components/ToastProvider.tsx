import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastApi } from '../hooks/useToast'

interface Toast {
  id: number
  message: string
  kind: 'success' | 'error'
}

/** How long a message stays on screen. */
const TOAST_DURATION_MS = 3500

/**
 * Small pop-up messages ("Alice was added."). Any component can show one with
 * `useToast().show(message)` (see hooks/useToast.ts); this component draws them.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  // A counter that survives re-renders without causing one (unlike state), used to give each toast an id
  const nextId = useRef(1)

  // useCallback keeps the same function between renders, so components using it don't re-render needlessly
  const show = useCallback<ToastApi['show']>((message, kind = 'success') => {
    const id = nextId.current++
    // Use the "current => next" form of the setter: several toasts can be added before React re-renders
    setToasts((current) => [...current, { id, message, kind }])
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), TOAST_DURATION_MS)
  }, [])

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* aria-live: screen readers announce new messages without the user moving focus */}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
