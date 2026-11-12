import { createContext, useContext } from 'react'

export interface ToastApi {
  show: (message: string, kind?: 'success' | 'error') => void
}

export const ToastContext = createContext<ToastApi>({ show: () => {} })

export function useToast(): ToastApi {
  return useContext(ToastContext)
}
