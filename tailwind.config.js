/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fsu: {
          blue: '#002f5d',       // Primärfarbe Dunkelblau
          blueDark: '#001a33',   // Dunkelste Nuance
          gold: '#ae9a63',       // Auszeichnungsfarbe Gold
          goldLight: '#f8f5ee',  // Sanftes Sand/Gold für Hintergründe
          goldBorder: '#d9ceb2', // Dezenter Gold-Rahmen
          lightBlue: '#648bc7',  // Auszeichnungsfarbe Lichtblau
          accent: '#378dbc',     // Fakultät Sozial- und Verhaltenswissenschaften
          surface: '#f4f6f9',    // Heller Hintergrund
        },
        jena: {
          blue: '#002f5d',
          gold: '#ae9a63',
          light: '#f4f6f9',
          accent: '#378dbc'
        }
      },
      fontFamily: {
        sans: ['Roboto', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        condensed: ['"Roboto Condensed"', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
