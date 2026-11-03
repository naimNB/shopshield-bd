/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hind Siliguri"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        surface: {
          950: '#050913', // deepest background
          900: '#070c18', // primary app background
          850: '#0a1224', // elevated card surface
          800: '#0e172e', // container surface
          750: '#14203d', // hover surface
          700: '#1a294d', // highlighted surface
        },
        border: {
          subtle: '#15213b',
          muted: '#1e2e52',
          DEFAULT: '#273c68',
          strong: '#374f85',
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // primary brand teal
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem' }], // 11px
      },
    },
  },
  plugins: [],
};
