-- Migración 002: tablas usadas por el código que faltaban en el schema
-- + UNIQUE en planes.nombre (necesario para que el seed ON CONFLICT funcione)
-- Ejecutar manualmente: psql -U postgres -d robertgym -f migrations/002_tablas_faltantes.sql

-- Sesiones de administrador (login con límite de sesiones activas)
CREATE TABLE IF NOT EXISTS admin_sesiones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID           NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
  jti        VARCHAR(64)    UNIQUE NOT NULL,   -- identificador único del token JWT
  created_at TIMESTAMP      DEFAULT NOW(),
  last_used  TIMESTAMP      DEFAULT NOW()
);

-- Máquinas del gimnasio (página pública escaneada por QR)
CREATE TABLE IF NOT EXISTS maquinas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(100)   NOT NULL,
  descripcion TEXT,
  foto_url    VARCHAR(500),
  pdf_url     VARCHAR(500),
  video_url   VARCHAR(500),
  activo      BOOLEAN        DEFAULT true,     -- soft delete
  created_at  TIMESTAMP      DEFAULT NOW()
);

-- Productos de la tienda
CREATE TABLE IF NOT EXISTS productos_tienda (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     VARCHAR(100)   NOT NULL,
  precio     DECIMAL(8,2)   NOT NULL CHECK (precio >= 0),
  stock      INT            NOT NULL DEFAULT 0 CHECK (stock >= 0),
  foto_url   VARCHAR(500),
  activo     BOOLEAN        DEFAULT true,      -- soft delete
  created_at TIMESTAMP      DEFAULT NOW()
);

-- Ventas de la tienda
CREATE TABLE IF NOT EXISTS ventas_tienda (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id     UUID           NOT NULL REFERENCES productos_tienda(id),
  cantidad        INT            NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(8,2)   NOT NULL,
  total           DECIMAL(10,2)  NOT NULL,
  admin_id        UUID           REFERENCES admin(id),
  fecha           TIMESTAMPTZ    DEFAULT NOW()  -- TIMESTAMPTZ: los reportes usan AT TIME ZONE 'America/Lima'
);

CREATE INDEX IF NOT EXISTS idx_ventas_tienda_fecha    ON ventas_tienda(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_tienda_producto ON ventas_tienda(producto_id);

-- UNIQUE en planes.nombre: sin esto, re-ejecutar el seed de schema.sql
-- duplica los planes porque ON CONFLICT DO NOTHING no tiene restricción que atrapar
ALTER TABLE planes DROP CONSTRAINT IF EXISTS uq_planes_nombre;
ALTER TABLE planes ADD CONSTRAINT uq_planes_nombre UNIQUE (nombre);
