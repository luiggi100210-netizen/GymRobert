// Iconos de línea propios — consistentes en grosor y tamaño, sin dependencias.
// Todos aceptan className para controlar tamaño/color desde el consumidor.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
}

export function IconPanel(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

export function IconMiembros(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 5" />
      <path d="M17.5 15.2c1.9.6 3.1 2.1 3.5 4.3" />
    </svg>
  )
}

export function IconAsistencia(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M9 13l2.2 2.2L15.5 11" />
    </svg>
  )
}

export function IconPagos(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9.5h.01M18 14.5h.01" />
    </svg>
  )
}

export function IconReportes(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </svg>
  )
}

export function IconPlanes(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11.5V5a2 2 0 0 1 2-2h6.5L21 12.5a2 2 0 0 1 0 2.8L15.3 21a2 2 0 0 1-2.8 0L3 11.5z" />
      <circle cx="8" cy="8" r="1.3" />
    </svg>
  )
}

export function IconMaquinas(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7.5 12h9" />
      <rect x="3.5" y="8" width="3" height="8" rx="1" />
      <rect x="17.5" y="8" width="3" height="8" rx="1" />
      <path d="M2 10.5v3M22 10.5v3" />
    </svg>
  )
}

export function IconTienda(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 8h14l-1 12.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20.5L5 8z" />
      <path d="M9 10.5V6a3 3 0 0 1 6 0v4.5" />
    </svg>
  )
}

export function IconWhatsapp(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.5-1.5-2-1.5-1 .8a4.2 4.2 0 0 1-1.8-1.8l.8-1-1.5-2L9 9.5z" />
    </svg>
  )
}
