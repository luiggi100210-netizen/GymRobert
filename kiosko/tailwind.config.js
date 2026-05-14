/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        bebas: ['Bebas Neue', 'sans-serif'],
      },
      colors: {
        kiosko: {
          bg:      '#0d0d0d',
          surface: '#161616',
          border:  '#222222',
        },
      },
      keyframes: {
        // Pulso del ícono de huella en reposo
        pulse_fp: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.06)' },
        },
        // Línea de escaneo
        scan: {
          '0%':   { top: '0%',   opacity: '0' },
          '10%':  { opacity: '1' },
          '90%':  { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        // Glow lateral
        glow_green: {
          '0%, 100%': { boxShadow: '0 0 30px 6px rgba(16,185,129,0.25)' },
          '50%':      { boxShadow: '0 0 50px 12px rgba(16,185,129,0.45)' },
        },
        glow_blue: {
          '0%, 100%': { boxShadow: '0 0 30px 6px rgba(59,130,246,0.25)' },
          '50%':      { boxShadow: '0 0 50px 12px rgba(59,130,246,0.45)' },
        },
        glow_red: {
          '0%, 100%': { boxShadow: '0 0 30px 6px rgba(239,68,68,0.25)' },
          '50%':      { boxShadow: '0 0 50px 12px rgba(239,68,68,0.45)' },
        },
        // Entrada de la card del miembro
        slide_up: {
          '0%':   { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Cuenta atrás circular
        countdown: {
          from: { strokeDashoffset: '0' },
          to:   { strokeDashoffset: '220' },
        },
        // Anillo de sensor biométrico
        sensor_pulse: {
          '0%':   { transform: 'scale(1)',   opacity: '0.7' },
          '100%': { transform: 'scale(1.7)', opacity: '0' },
        },
      },
      animation: {
        pulse_fp:    'pulse_fp 2s ease-in-out infinite',
        scan:        'scan 1.4s ease-in-out infinite',
        glow_green:  'glow_green 2s ease-in-out infinite',
        glow_blue:   'glow_blue 2s ease-in-out infinite',
        glow_red:    'glow_red 2s ease-in-out infinite',
        slide_up:     'slide_up 0.4s cubic-bezier(0.16,1,0.3,1) both',
        sensor_pulse: 'sensor_pulse 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
}
