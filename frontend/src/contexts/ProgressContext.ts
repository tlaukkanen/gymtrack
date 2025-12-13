import { createContext } from 'react'

interface ProgressContextType {
  isLoading: boolean
  showProgress: () => void
  hideProgress: () => void
}

export const ProgressContext = createContext<ProgressContextType | undefined>(undefined)
