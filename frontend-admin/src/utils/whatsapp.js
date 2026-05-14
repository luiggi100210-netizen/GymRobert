/**
 * Genera un enlace de WhatsApp Web con mensaje pre-armado.
 * Número en formato peruano: 9 dígitos → prefijo 51.
 */
export function linkWhatsapp(telefono, nombre, diasRestantes, planNombre) {
  if (!telefono) return null

  // Limpiar número y agregar código de Perú
  const numero = telefono.replace(/\D/g, '')
  const completo = numero.startsWith('51') ? numero : `51${numero}`

  const mensaje = encodeURIComponent(
    `Hola ${nombre} 👋, te recordamos que tu membresía *${planNombre}* en *Robert Gym - Club Fitness* vence en *${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}*.\n\n` +
    `Renueva antes de que expire para no perder tu cupo. 💪\n\n` +
    `📍 Robert Gym - Arequipa`
  )

  return `https://wa.me/${completo}?text=${mensaje}`
}
