/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        board: {
          light: '#ebecd0',
          dark: '#779556',
          highlight: 'rgba(255, 255, 0, 0.4)',
          check: 'rgba(239, 68, 68, 0.65)',
        }
      }
    },
  },
  plugins: [],
}
