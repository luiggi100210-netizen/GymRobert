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
          sidebar:  '#0f0f0f',
          card:     '#1a1a1a',
          border:   '#2a2a2a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
