-- ============================================================
-- ROBERT GYM — Club Fitness | Arequipa, Perú
-- Schema de base de datos PostgreSQL
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: planes
-- Tipos de membresía disponibles
-- ============================================================
CREATE TABLE IF NOT EXISTS planes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        VARCHAR(50)    UNIQUE NOT NULL,   -- 'Mensual', 'Trimestral', 'Anual'
  duracion_dias INT            NOT NULL,          -- 30, 90, 365
  precio        DECIMAL(8,2)   NOT NULL,          -- S/. 80.00, 210.00, 720.00
  activo        BOOLEAN        DEFAULT true,
  created_at    TIMESTAMP      DEFAULT NOW()
);

-- ============================================================
-- TABLA: miembros
-- Clientes registrados en el gimnasio
-- ============================================================
CREATE TABLE IF NOT EXISTS miembros (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dni              VARCHAR(8)     UNIQUE NOT NULL,
  nombres          VARCHAR(100)   NOT NULL,
  apellidos        VARCHAR(100)   NOT NULL,
  telefono         VARCHAR(15),                   -- para WhatsApp
  fecha_nacimiento DATE,
  huella_id        VARCHAR(100),                  -- ID del sensor biométrico
  estado           VARCHAR(20)    DEFAULT 'activo',
  fecha_registro   TIMESTAMP      DEFAULT NOW()
);

-- ============================================================
-- TABLA: membresias
-- Plan asignado a un miembro con fechas de vigencia
-- ============================================================
CREATE TABLE IF NOT EXISTS membresias (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  miembro_id   UUID           REFERENCES miembros(id) ON DELETE CASCADE,
  plan_id      UUID           REFERENCES planes(id),
  fecha_inicio DATE           NOT NULL,
  fecha_fin    DATE           NOT NULL,           -- calculado: inicio + duracion_dias
  estado       VARCHAR(20)    DEFAULT 'activa',   -- 'activa', 'vencida', 'suspendida'
  created_at   TIMESTAMP      DEFAULT NOW()
);

-- ============================================================
-- TABLA: pagos
-- Registro de cobros realizados
-- ============================================================
CREATE TABLE IF NOT EXISTS pagos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membresia_id  UUID           REFERENCES membresias(id) ON DELETE CASCADE,
  monto         DECIMAL(8,2)   NOT NULL,
  metodo_pago   VARCHAR(30),                      -- 'efectivo','yape','plin','transferencia'
  fecha_pago    DATE           DEFAULT CURRENT_DATE,
  comprobante   VARCHAR(200),
  estado        VARCHAR(20)    DEFAULT 'pagado',
  created_at    TIMESTAMP      DEFAULT NOW()
);

-- ============================================================
-- TABLA: asistencias
-- Registro biométrico de entrada/salida diaria
-- Una fila por miembro por día (UNIQUE)
-- ============================================================
CREATE TABLE IF NOT EXISTS asistencias (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  miembro_id        UUID           REFERENCES miembros(id) ON DELETE CASCADE,
  fecha             DATE           DEFAULT CURRENT_DATE,
  entrada           TIMESTAMP,                    -- 1er toque del día
  salida            TIMESTAMP,                    -- 2do toque del día
  duracion_minutos  INT,                          -- calculado al registrar salida
  membresia_valida  BOOLEAN,
  created_at        TIMESTAMP      DEFAULT NOW(),
  UNIQUE(miembro_id, fecha)                       -- solo 1 registro por miembro por día
);

-- ============================================================
-- TABLA: admin
-- Usuario administrador del sistema (cuenta única)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username     VARCHAR(50)    UNIQUE NOT NULL,
  password     VARCHAR(255)   NOT NULL,           -- bcrypt hash
  nombre       VARCHAR(100),
  created_at   TIMESTAMP      DEFAULT NOW()
);

-- ============================================================
-- TABLA: admin_sesiones
-- Sesiones activas del admin (límite de sesiones simultáneas)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_sesiones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID           NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
  jti        VARCHAR(64)    UNIQUE NOT NULL,   -- identificador único del token JWT
  created_at TIMESTAMP      DEFAULT NOW(),
  last_used  TIMESTAMP      DEFAULT NOW()
);

-- ============================================================
-- TABLA: maquinas
-- Máquinas del gimnasio (página pública escaneada por QR)
-- ============================================================
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

-- ============================================================
-- TABLA: productos_tienda
-- Productos a la venta en el gimnasio
-- ============================================================
CREATE TABLE IF NOT EXISTS productos_tienda (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     VARCHAR(100)   NOT NULL,
  precio     DECIMAL(8,2)   NOT NULL CHECK (precio >= 0),
  stock      INT            NOT NULL DEFAULT 0 CHECK (stock >= 0),
  foto_url   VARCHAR(500),
  activo     BOOLEAN        DEFAULT true,      -- soft delete
  created_at TIMESTAMP      DEFAULT NOW()
);

-- ============================================================
-- TABLA: ventas_tienda
-- Ventas registradas con descuento de stock
-- ============================================================
CREATE TABLE IF NOT EXISTS ventas_tienda (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id     UUID           NOT NULL REFERENCES productos_tienda(id),
  cantidad        INT            NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(8,2)   NOT NULL,
  total           DECIMAL(10,2)  NOT NULL,
  admin_id        UUID           REFERENCES admin(id),
  fecha           TIMESTAMPTZ    DEFAULT NOW()  -- los reportes usan AT TIME ZONE 'America/Lima'
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Planes por defecto
INSERT INTO planes (nombre, duracion_dias, precio) VALUES
  ('Mensual',     30,  80.00),
  ('Trimestral',  90, 210.00),
  ('Anual',      365, 720.00)
ON CONFLICT DO NOTHING;

-- Admin por defecto (cambiar contraseña tras el primer inicio de sesión)
INSERT INTO admin (username, password, nombre) VALUES
  ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- ÍNDICES para optimizar consultas frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_miembros_dni       ON miembros(dni);
CREATE INDEX IF NOT EXISTS idx_miembros_huella_id ON miembros(huella_id);
CREATE INDEX IF NOT EXISTS idx_membresias_miembro ON membresias(miembro_id);
CREATE INDEX IF NOT EXISTS idx_membresias_estado  ON membresias(estado);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha  ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha        ON pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_ventas_tienda_fecha    ON ventas_tienda(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_tienda_producto ON ventas_tienda(producto_id);
