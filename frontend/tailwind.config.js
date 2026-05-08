/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#12121a',
        primary: '#22d3ee',
        accent: '#a855f7',
        board: {
          brown: '#8B4513',
          lightBlue: '#87CEFA',
          pink: '#FF69B4',
          orange: '#FFA500',
          red: '#FF0000',
          yellow: '#FFD700',
          green: '#008000',
          darkBlue: '#00008B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
