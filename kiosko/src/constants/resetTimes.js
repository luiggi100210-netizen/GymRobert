// Tiempos de auto-reset según estado del kiosk
// Fuente única de verdad: usada por App.jsx (ms) y pantallas Countdown (s)

export const RESET_MS = {
  entrada:  4000,
  salida:   4000,
  denegado: 5000,
  ignorado: 800,
}

export const RESET_S = {
  entrada:  4,
  salida:   4,
  denegado: 5,
}
