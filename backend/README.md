# Robert Gym — Backend API

API REST para el sistema de gestión de Robert Gym - Club Fitness, Arequipa, Perú.

## Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Base de datos:** PostgreSQL
- **Auth:** JWT + bcryptjs
- **Driver DB:** node-postgres (pg)

## Instalación

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de PostgreSQL

# 3. Crear base de datos
psql -U postgres -c "CREATE DATABASE robertgym;"

# 4. Inicializar schema
psql -U postgres -d robertgym -f src/db/schema.sql

# 5. Iniciar servidor
npm run dev       # desarrollo con nodemon
npm start         # producción
```

## Variables de entorno

| Variable        | Descripción                  | Ejemplo              |
|----------------|------------------------------|----------------------|
| PORT           | Puerto del servidor           | 3000                 |
| DB_HOST        | Host de PostgreSQL            | localhost            |
| DB_PORT        | Puerto de PostgreSQL          | 5432                 |
| DB_NAME        | Nombre de la base de datos    | robertgym            |
| DB_USER        | Usuario de PostgreSQL         | postgres             |
| DB_PASSWORD    | Contraseña de PostgreSQL      | tu_password          |
| JWT_SECRET     | Secreto para firmar JWT       | clave_muy_segura     |
| JWT_EXPIRES_IN | Duración del token            | 8h                   |

## Credenciales por defecto

- **Usuario:** `admin`
- **Contraseña:** `admin123`

> Cambia la contraseña del admin en producción.

## Endpoints

### AUTH
| Método | Ruta               | Descripción           |
|--------|--------------------|-----------------------|
| POST   | /api/auth/login    | Login del admin       |

### MIEMBROS
| Método | Ruta                      | Descripción                     |
|--------|---------------------------|---------------------------------|
| GET    | /api/miembros             | Lista con estado de membresía   |
| GET    | /api/miembros/:id         | Detalle + historial de pagos    |
| POST   | /api/miembros             | Crear miembro + membresía + pago|
| PUT    | /api/miembros/:id         | Editar datos del miembro        |
| GET    | /api/miembros/dni/:dni    | Buscar por DNI (autollenado)    |

### MEMBRESÍAS
| Método | Ruta                          | Descripción                   |
|--------|-------------------------------|-------------------------------|
| POST   | /api/membresias               | Renovar membresía             |
| GET    | /api/membresias/vencen-pronto | Vencen en próximos 7 días     |

### PLANES
| Método | Ruta            | Descripción     |
|--------|-----------------|-----------------|
| GET    | /api/planes     | Lista de planes |
| POST   | /api/planes     | Crear plan      |
| PUT    | /api/planes/:id | Editar plan     |

### PAGOS
| Método | Ruta       | Descripción                        |
|--------|------------|------------------------------------|
| GET    | /api/pagos | Historial con filtros mes/año      |
| POST   | /api/pagos | Registrar pago                     |

### ASISTENCIA (Kiosco)
| Método | Ruta                              | Descripción                    |
|--------|-----------------------------------|--------------------------------|
| POST   | /api/asistencia/toque             | Registro entrada/salida        |
| GET    | /api/asistencia/hoy               | Asistencias del día            |
| GET    | /api/asistencia/dia/:fecha        | Asistencias de un día          |
| GET    | /api/asistencia/reporte/:mes/:anio| Reporte mensual                |

### REPORTES
| Método | Ruta                            | Descripción               |
|--------|--------------------------------|---------------------------|
| GET    | /api/reportes/dashboard        | Stats del dashboard       |
| GET    | /api/reportes/ingresos/:mes/:anio | Ingresos del mes        |
| GET    | /api/reportes/proyeccion       | Proyección siguiente mes  |

## Lógica del Kiosco Biométrico

El endpoint `POST /api/asistencia/toque` maneja automáticamente:

1. **Huella no encontrada** → `{ estado: 'denegado', motivo: 'huella_no_registrada' }`
2. **Membresía vencida** → `{ estado: 'denegado', motivo: 'membresia_vencida' }`
3. **1er toque del día** → Registra entrada → `{ estado: 'entrada' }`
4. **2do toque del día** → Registra salida + calcula duración → `{ estado: 'salida' }`
5. **Ya completó visita** → `{ estado: 'ignorado' }`

## Bugs corregidos

### `reportes.controller.js` — columna sin GROUP BY en `ingresosMes`
**Endpoint afectado:** `GET /api/reportes/ingresos/:mes/:anio`

La columna `metodo_pago` aparecía en el `SELECT` junto con funciones de agregado (`COUNT`, `SUM`) sin cláusula `GROUP BY`. PostgreSQL rechazaba la query con:
> `column "pagos.metodo_pago" must appear in the GROUP BY clause or be used in an aggregate function`

**Corrección:** se eliminó `metodo_pago` del `SELECT`. Los totales por método se calculan correctamente mediante los filtros `FILTER (WHERE metodo_pago = '...')` que sí estaban presentes.
