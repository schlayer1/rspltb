/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jena: {
          blue: '#002f6c',
          gold: '#c29b38',
          light: '#f4f6f9',
          accent: '#1e40af'
        }
      }
    },
  },
  plugins: [],
}
