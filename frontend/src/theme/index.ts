import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f97316', // Electric orange
      dark: '#ea580c',
      light: '#fb923c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#22d3ee', // Cyan accent
      dark: '#06b6d4',
      light: '#67e8f9',
      contrastText: '#0f172a',
    },
    background: {
      default: '#0f0f0f', // Near black
      paper: '#1a1a1a', // Dark charcoal
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#22c55e',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0f0f0f',
          color: '#f8fafc',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
  },
})

export type AppTheme = typeof theme
