// Tiempos de auto-reset según estado del kiosk
// Fuente única de verdad: usada por App.jsx (ms) y pantallas Countdown (s)

export const SCAN_DELAY_MS = 1200   // duración de la animación de escaneo

export const RESET_MS = {
  entrada:  3000,
  salida:   3000,
  denegado: 4000,
  ignorado: 800,
}

export const RESET_S = {
  entrada:  3,
  salida:   3,
  denegado: 4,
}
