# Robert Gym — Panel de Administración

Frontend React + Vite + TailwindCSS para la gestión del gimnasio.

## Stack

- **React 18** + React Router v6
- **Vite** (bundler)
- **TailwindCSS** (estilos)
- **Recharts** (gráficos)
- **Axios** (peticiones HTTP)
- **date-fns** (manejo de fechas)

## Instalación

```bash
cd frontend-admin
npm install
npm run dev     # http://localhost:5173
```

> El proxy de Vite redirige `/api` a `http://localhost:3000`.
> Asegúrate de tener el backend corriendo antes de iniciar el admin.

## Páginas

| Ruta               | Descripción                                  |
|--------------------|----------------------------------------------|
| `/login`           | Autenticación del administrador               |
| `/`                | Dashboard con stats, gráficos y proyección   |
| `/miembros`        | Lista con búsqueda y filtros                  |
| `/miembros/nuevo`  | Registro en 3 pasos + edición de miembro     |
| `/asistencia`      | Hoy / Historial / Reporte mensual            |
| `/pagos`           | Historial con filtro de mes/año              |
| `/reportes`        | Análisis financiero y proyecciones           |
| `/planes`          | CRUD de planes de membresía                  |

## Identidad visual

- Rojo primario: `#c53030`
- Sidebar negro: `#111111`
- Fondo: `#030712` (gray-950)
- Fuente: Inter

## Bugs corregidos

### `NuevoMiembro.jsx` y `MiembroDetalle.jsx` — fecha de vencimiento con un día de diferencia
El preview de la fecha de fin de membresía mostraba un día menos al esperado en la zona horaria de Perú (UTC-5).

**Causa:** `new Date('YYYY-MM-DD')` parsea la fecha como UTC medianoche. En UTC-5 eso equivale al día anterior a las 7pm, por lo que `addDays` operaba sobre la fecha incorrecta.

**Corrección:** se cambió a `new Date('YYYY-MM-DD' + 'T12:00:00')` para anclar al mediodía local, eliminando el desfase. La fecha guardada en el backend no estaba afectada (el cálculo se hace en SQL).
