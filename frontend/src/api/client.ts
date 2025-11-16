import axios from 'axios'
import { useAuthStore } from '../store/auth-store'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
    }
    return Promise.reject(error)
  },
)
