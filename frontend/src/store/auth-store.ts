import { createWithEqualityFn } from 'zustand/traditional'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AuthUser {
  email: string
  displayName: string
}

export interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  hydrated: boolean
  setAuth: (payload: { accessToken: string; user: AuthUser }) => void
  clearAuth: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = createWithEqualityFn<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hydrated: false,
      setAuth: (payload) => set(payload),
      clearAuth: () => set({ accessToken: null, user: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'gymtrack-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
  Object.is,
)

export const selectAuthStatus = (state: AuthState) => ({
  accessToken: state.accessToken,
  hydrated: state.hydrated,
})

export const selectAuthControls = (state: AuthState) => ({
  user: state.user,
  clearAuth: state.clearAuth,
})

export const selectSetAuth = (state: AuthState) => state.setAuth

export const selectAuthSlice = (state: AuthState) => ({
  accessToken: state.accessToken,
  user: state.user,
  hydrated: state.hydrated,
  clearAuth: state.clearAuth,
  setAuth: state.setAuth,
})
