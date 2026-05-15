-- Migración 001: CHECK constraints para campos estado
-- Ejecutar manualmente: psql -U postgres -d robertgym -f migrations/001_add_estado_constraints.sql

ALTER TABLE miembros
  DROP CONSTRAINT IF EXISTS chk_miembros_estado,
  ADD  CONSTRAINT chk_miembros_estado
    CHECK (estado IN ('activo', 'suspendido', 'inactivo'));

ALTER TABLE membresias
  DROP CONSTRAINT IF EXISTS chk_membresias_estado,
  ADD  CONSTRAINT chk_membresias_estado
    CHECK (estado IN ('activa', 'vencida', 'suspendida'));
