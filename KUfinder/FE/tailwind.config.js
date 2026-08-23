/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ku: {
          50: '#fff1f5',
          100: '#ffe4ec',
          500: '#b3083f',
          600: '#970033',
          700: '#7a0029',
          800: '#620023',
          900: '#4a001a'
        }
      },
      boxShadow: {
        soft: '0 12px 35px rgba(30, 20, 25, 0.08)'
      }
    }
  },
  plugins: []
}
