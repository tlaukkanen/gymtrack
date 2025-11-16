import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38bdf8',
      dark: '#0ea5e9',
      light: '#7dd3fc',
      contrastText: '#061121',
    },
    secondary: {
      main: '#f97316',
      dark: '#ea580c',
      light: '#fdba74',
      contrastText: '#060b1b',
    },
    background: {
      default: '#060b1b',
      paper: '#0f172a',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5f5',
    },
    error: {
      main: '#f87171',
    },
    success: {
      main: '#4ade80',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
          backgroundColor: '#060b1b',
          color: '#f1f5f9',
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
