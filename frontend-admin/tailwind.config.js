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
          sidebar:  '#faf6f0',
          'sidebar-border': '#ede8e0',
          bg:       '#f0ece6',
          card:     '#ffffff',
          border:   '#e8e3dc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
