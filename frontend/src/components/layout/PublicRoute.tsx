import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore, selectAuthStatus } from '../../store/auth-store'

interface Props {
  children: ReactNode
}

export const PublicRoute = ({ children }: Props) => {
  const { accessToken, hydrated } = useAuthStore(selectAuthStatus)

  if (!hydrated) {
    return null
  }

  if (accessToken) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}
