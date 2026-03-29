/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        ios: {
          blue: '#007AFF',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          purple: '#AF52DE',
          pink: '#FF2D55',
          teal: '#5AC8FA',
          gray: '#8E8E93',
          bg: '#F2F2F7',
          card: '#FFFFFF',
          dark: {
            bg: '#000000',
            card: '#1C1C1E',
            card2: '#2C2C2E',
            text: '#FFFFFF',
            subtitle: '#98989D',
          }
        }
      }
    },
  },
  plugins: [],
}
