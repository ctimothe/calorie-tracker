
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Semantic Tokens
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          900: '#0f172a',
        },
        content: {
          DEFAULT: '#0f172a',
          subtle: '#64748b',
          inverse: '#ffffff',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      // Design System Tokens
      borderRadius: {
        'DEFAULT': '0.75rem',  // 12px - buttons, inputs
        'lg': '1rem',           // 16px - cards
        'xl': '1.5rem',         // 24px - panels
        '2xl': '2rem',          // 32px - main containers
        '3xl': '2.5rem',        // 40px - hero elements
      },
      boxShadow: {
        'card': '0 4px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'button': '0 4px 12px -2px rgba(34, 197, 94, 0.25)',
        'elevated': '0 8px 32px -8px rgba(0, 0, 0, 0.12), 0 4px 16px -4px rgba(0, 0, 0, 0.08)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}
