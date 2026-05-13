// Badge de estado de membresía/asistencia
export default function Badge({ estado }) {
  const map = {
    activo:      'badge-verde',
    activa:      'badge-verde',
    pagado:      'badge-verde',
    completado:  'badge-verde',
    vencido:     'badge-rojo',
    vencida:     'badge-rojo',
    denegado:    'badge-rojo',
    suspendida:  'badge-rojo',
    suspendido:  'badge-rojo',
    'por vencer':'badge-amarillo',
    pendiente:   'badge-amarillo',
    'en gym':    'badge-azul',
    entrada:     'badge-azul',
    salida:      'badge-verde',
  }

  const labels = {
    activo:      'Activo',
    activa:      'Activa',
    pagado:      'Pagado',
    completado:  'Completado',
    vencido:     'Vencido',
    vencida:     'Vencida',
    denegado:    'Denegado',
    suspendida:  'Suspendida',
    suspendido:  'Suspendido',
    'por vencer':'Por vencer',
    pendiente:   'Pendiente',
    'en gym':    'En gym',
    entrada:     'Entrada',
    salida:      'Salida',
  }

  const key = estado?.toLowerCase()
  return (
    <span className={map[key] || 'badge-gris'}>
      {labels[key] || estado}
    </span>
  )
}
