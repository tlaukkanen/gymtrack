import { useAuthStore, selectAuthSlice } from '../store/auth-store'

export const useAuth = () => {
  const { accessToken, user, hydrated, clearAuth, setAuth } = useAuthStore(selectAuthSlice)

  return {
    accessToken,
    user,
    hydrated,
    isAuthenticated: Boolean(accessToken),
    clearAuth,
    setAuth,
  }
}
