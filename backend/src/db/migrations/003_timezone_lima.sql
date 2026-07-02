-- Migración 003: fijar zona horaria America/Lima en la base de datos
-- Postgres corre en UTC por defecto: a partir de las 7pm hora de Lima,
-- CURRENT_DATE ya es "mañana", lo que rompe asistencias, vigencia de
-- membresías el último día y reportes diarios.
-- Ejecutar manualmente: psql -U postgres -d robertgym -f migrations/003_timezone_lima.sql

DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET timezone = %L', current_database(), 'America/Lima');
END $$;

-- Nota: aplica a conexiones NUEVAS. Reiniciar el backend tras ejecutarla.
