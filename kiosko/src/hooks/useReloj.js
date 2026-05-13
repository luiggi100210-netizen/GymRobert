// Hook que actualiza la hora y fecha en tiempo real cada segundo
import { useState, useEffect } from 'react'

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function useReloj() {
  const [ahora, setAhora] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hora = ahora.toLocaleTimeString('es-PE', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const fecha = `${DIAS[ahora.getDay()]}, ${ahora.getDate()} de ${MESES[ahora.getMonth()]} ${ahora.getFullYear()}`

  return { hora, fecha }
}
