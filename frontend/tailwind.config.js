import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#38bdf8',
          dark: '#0ea5e9',
          light: '#7dd3fc',
        },
        surface: {
          DEFAULT: '#0f172a',
          muted: '#1e293b',
          darkest: '#060b1b',
        },
        text: {
          primary: '#f1f5f9',
          muted: '#cbd5f5',
        },
        success: '#4ade80',
        danger: '#f87171',
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 20px 60px rgba(2, 6, 23, 0.6)',
      },
    },
  },
  plugins: [],
}

