// Manejador global de errores
function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err.message, err.stack);
  } else {
    console.error('Error:', err.message);
  }

  // Error de PostgreSQL: violación de restricción única
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor único' });
  }

  // Error de PostgreSQL: violación de clave foránea
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia inválida a registro inexistente' });
  }

  const status = err.status || 500;

  // En errores 5xx no exponer detalles internos al cliente
  const mensaje = status >= 500
    ? 'Error interno del servidor'
    : (err.message || 'Error del servidor');

  res.status(status).json({ error: mensaje });
}

module.exports = { errorHandler };
