import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0ea5e9',
          dark: '#0284c7',
          light: '#38bdf8',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f1f5f9',
          darkest: '#e2e8f0',
        },
        text: {
          primary: '#0f172a',
          muted: '#64748b',
        },
        success: '#22c55e',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 10px 40px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}

