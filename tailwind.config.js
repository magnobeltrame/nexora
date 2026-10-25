/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexora: {
          bg: '#0F172A',
          card: '#1E293B',
          primary: '#10B981',
          secondary: '#06B6D4',
          text: '#F8FAFC',
          danger: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}