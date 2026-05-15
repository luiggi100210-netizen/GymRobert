const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

function esFechaValida(str) {
  if (!FECHA_RE.test(str)) return false;
  const d = new Date(str);
  if (isNaN(d.getTime())) return false;
  const [, mm] = str.split('-');
  return d.getUTCMonth() + 1 === parseInt(mm, 10);
}

module.exports = { esFechaValida };
