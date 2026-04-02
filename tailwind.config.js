/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255, 255, 255, 0.5)',
        'glass-dark': 'rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  variants: {
    backdropBlur: ['responsive', 'hover', 'focus'],
  },
  plugins: [],
};