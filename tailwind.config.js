/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cf: {
          orange: '#F6821F',
          'orange-hover': '#E66E0A',
          'orange-light': '#FA8B28',
          'orange-subtle': 'rgba(246, 130, 31, 0.1)',
        },
        dark: {
          bg: '#0B0C0E',
          surface: '#13151A',
          card: '#1C1E24',
          border: '#282B33',
          muted: '#94A3B8',
        },
        light: {
          bg: '#FFFFFF',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
