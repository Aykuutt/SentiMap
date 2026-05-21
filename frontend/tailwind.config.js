/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#090d16',
          dark: '#0f172a',
          card: 'rgba(30, 41, 59, 0.7)',
          accent: '#06b6d4',      // Neon Cyan
          primary: '#8b5cf6',     // Violet
          secondary: '#ec4899',   // Rose
          success: '#10b981',     // Neon Green
          warning: '#f59e0b',     // Amber
          danger: '#f43f5e',      // Rose Red
          text: '#f1f5f9',        // Slate 100
          muted: '#94a3b8',       // Slate 400
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
