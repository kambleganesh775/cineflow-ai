/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cine: {
          950: '#090a0f', // deep obsidian
          900: '#0f1117', // dark charcoal
          850: '#141722', // card backdrop
          800: '#1b2030', // borders / elevated
          700: '#282f45',
          600: '#3c4664',
          400: '#8e9bb0',
          300: '#b8c4d6',
          100: '#f0f3f8',
        },
        gold: {
          400: '#f5c542',
          500: '#e5b328',
          600: '#c49618',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
