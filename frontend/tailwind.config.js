import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f97316', // Electric orange
          dark: '#ea580c',
          light: '#fb923c',
        },
        accent: {
          DEFAULT: '#22d3ee', // Cyan
          dark: '#06b6d4',
          light: '#67e8f9',
        },
        surface: {
          DEFAULT: '#1a1a1a', // Dark charcoal
          muted: '#262626',
          darkest: '#0f0f0f', // Near black
        },
        text: {
          primary: '#f8fafc',
          muted: '#94a3b8',
        },
        success: '#22c55e',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Manrope', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 10px 40px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(249, 115, 22, 0.3)',
      },
    },
  },
  plugins: [],
}

