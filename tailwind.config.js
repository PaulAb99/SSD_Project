/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@relume_io/relume-ui/dist/**/*.{js,ts,jsx,tsx}"
  ],
  presets: [require("@relume_io/relume-tailwind")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      colors: {
        heritage: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#e8dcc8',
          300: '#d4c0a0',
          400: '#b89b6f',
          500: '#a17c4d',
          600: '#8b6441',
          700: '#6f4e35',
          800: '#5a3f2b',
          900: '#3d2a1d',
        },
        amber: {
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
        },
      },
      maxWidth: {
        '7xl': '80rem',
      },
    },
  },
  plugins: [],
}
