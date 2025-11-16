import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, selectAuthStatus } from '../../store/auth-store'

interface Props {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: Props) => {
  const location = useLocation()
  const { accessToken, hydrated } = useAuthStore(selectAuthStatus)

  if (!hydrated) {
    return <div className="main-content">Loading...</div>
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
