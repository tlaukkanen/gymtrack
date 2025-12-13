import { useState, useCallback, type ReactNode } from 'react'
import { Box, keyframes } from '@mui/material'
import { ProgressContext } from '../../contexts/ProgressContext'

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

interface ProgressProviderProps {
  children: ReactNode
}

export const ProgressProvider = ({ children }: ProgressProviderProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const showProgress = useCallback(() => {
    setIsLoading(true)
  }, [])

  const hideProgress = useCallback(() => {
    setIsLoading(false)
  }, [])

  return (
    <ProgressContext.Provider value={{ isLoading, showProgress, hideProgress }}>
      {isLoading && <ProgressIndicator />}
      {children}
    </ProgressContext.Provider>
  )
}

const ProgressIndicator = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px',
        // Using rgba of --accent (#0ea5e9 = rgb(14, 165, 233)) with alpha for transparency
        backgroundColor: 'rgba(14, 165, 233, 0.15)',
        backdropFilter: 'blur(8px)',
        borderBottom: '2px solid rgba(14, 165, 233, 0.4)',
      }}
    >
      <Box
        sx={{
          animation: `${rotate} 1s linear infinite`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DumbbellIcon />
      </Box>
      <Box
        component="span"
        sx={{
          marginLeft: '12px',
          color: 'var(--text-primary)',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        Saving...
      </Box>
    </Box>
  )
}

const DumbbellIcon = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6.5 6L6.5 18M17.5 6L17.5 18M14.5 10L9.5 10M14.5 14L9.5 14M3 9L3 15C3 15.5523 3.44772 16 4 16C4.55228 16 5 15.5523 5 15L5 9C5 8.44772 4.55228 8 4 8C3.44772 8 3 8.44772 3 9ZM19 9L19 15C19 15.5523 19.4477 16 20 16C20.5523 16 21 15.5523 21 15L21 9C21 8.44772 20.5523 8 20 8C19.4477 8 19 8.44772 19 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
