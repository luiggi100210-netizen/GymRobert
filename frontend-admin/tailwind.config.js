/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gym: {
          red:      '#c53030',
          'red-dark': '#9b2c2c',
          'red-light': '#fc8181',
          black:    '#111111',
          sidebar:  '#ffffff',
          card:     '#ffffff',
          border:   '#e5e7eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
