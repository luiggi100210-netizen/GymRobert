# Robert Gym — Kiosco Biométrico

Pantalla fullscreen para registro de asistencia mediante sensor biométrico de huella dactilar.

## Stack

- **React 18** + Vite
- **TailwindCSS** con animaciones personalizadas
- **Axios** para comunicación con el backend

## Instalación

```bash
cd kiosko
npm install
npm run dev     # http://localhost:5174
```

> Requiere el backend corriendo en `http://localhost:3000`.

## Estados de pantalla

| Estado     | Barra lateral | Duración  | Descripción                          |
|------------|---------------|-----------|--------------------------------------|
| `idle`     | Gris apagado  | Indefinida| Esperando huella, reloj en tiempo real|
| `scan`     | Ámbar         | ~1.2s     | Leyendo huella, animación de escaneo  |
| `entrada`  | Verde + glow  | 4 seg     | Primer toque: bienvenida + hora entrada|
| `salida`   | Azul + glow   | 4 seg     | Segundo toque: despedida + duración   |
| `denegado` | Rojo + glow   | 5 seg     | Membresía vencida o huella desconocida|
| `ignorado` | —             | 0.8 seg   | Visita completa, reset silencioso     |

## Conexión con el sensor biométrico

Editar `src/hooks/useSensor.js` y cambiar `MODO`:

### Modo WebSocket (recomendado)
```js
const MODO   = 'websocket'
const WS_URL = 'ws://localhost:8765'   // ajustar al SDK del sensor
```
El sensor debe enviar: `{ "huella_id": "FP-001" }` por WebSocket.

### Modo Demo (por defecto, sin hardware)
```js
const MODO = 'demo'
```
Controles de teclado:
- `ENTER` → simula toque de miembro activo
- `D` → simula membresía vencida
- `X` → simula huella no registrada

## Huellas de prueba (modo demo)

Para probar el flujo completo, registra estas huellas en la BD:

```sql
-- Miembro con membresía activa
UPDATE miembros SET huella_id = 'FP-DEMO-001' WHERE dni = '12345678';

-- Miembro con membresía vencida
UPDATE miembros SET huella_id = 'FP-VENCIDO-999' WHERE dni = '99999999';
```

## Configurar pantalla táctil fullscreen

Para pantalla kiosco en producción (Windows/Linux):

1. Abrir Chrome en modo kiosco:
   ```bash
   chrome.exe --kiosk http://localhost:5174
   ```
2. Deshabilitar atajos del SO o usar un kiosco manager.

## Bugs corregidos

### `App.jsx` — estado `ignorado` sin prop `onClickSensor`
`PantallaIdle` se renderizaba en el estado `ignorado` sin la prop `onClickSensor`, a diferencia del estado `idle` donde sí se pasaba. Durante los 800ms del auto-reset, el botón demo no respondía.

**Corrección:** se agregó `onClickSensor={() => handleToque('FP-DEMO-001')}` al `PantallaIdle` del estado `ignorado`, dejándolo consistente con el estado `idle`.
