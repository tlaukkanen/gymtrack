import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/global.css'
import { ToastProvider } from './components/feedback/ToastProvider'
import { ProgressProvider } from './components/feedback/ProgressIndicator'
import { theme } from './theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
    },
  },
})

registerSW({
  onNeedRefresh() {
    console.info('New GymTrack update available; reload to apply.')
  },
  onOfflineReady() {
    console.info('GymTrack is ready to work offline.')
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ProgressProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ProgressProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
