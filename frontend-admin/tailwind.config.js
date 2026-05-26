/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gym: {
          red:             '#dc2626',
          'red-dark':      '#b91c1c',
          'red-light':     '#fca5a5',
          sidebar:         '#0f172a',
          'sidebar-hover': '#1e293b',
          'sidebar-border':'#1e293b',
          bg:              '#f1f5f9',
          card:            '#ffffff',
          border:          '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
      },
    },
  },
  plugins: [],
}
