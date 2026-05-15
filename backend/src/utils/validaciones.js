const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

function esFechaValida(str) {
  return FECHA_RE.test(str) && !isNaN(Date.parse(str));
}

module.exports = { esFechaValida };
