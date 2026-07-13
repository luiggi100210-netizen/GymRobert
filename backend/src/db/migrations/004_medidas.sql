-- Migración 004: historial de medidas corporales (peso/estatura)
-- Para seguimiento del progreso físico del miembro. Ambos campos son
-- opcionales al inscribir; se pueden registrar nuevas medidas en el tiempo.
-- Ejecutar manualmente: psql -U postgres -d robertgym -f migrations/004_medidas.sql

CREATE TABLE IF NOT EXISTS medidas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  miembro_id  UUID NOT NULL REFERENCES miembros(id) ON DELETE CASCADE,
  fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
  peso_kg     NUMERIC(5,2) CHECK (peso_kg > 20 AND peso_kg < 400),
  estatura_cm NUMERIC(5,1) CHECK (estatura_cm > 80 AND estatura_cm < 260),
  -- al menos una medida debe venir
  CONSTRAINT medidas_alguna CHECK (peso_kg IS NOT NULL OR estatura_cm IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_medidas_miembro ON medidas(miembro_id, fecha);
