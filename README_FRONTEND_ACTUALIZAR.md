# RemesaSmartSV — Frontend

Interfaz web de finanzas familiares para El Salvador (gestión de remesas). SPA construida con React + Vite.

## Stack

| Tecnología | Versión |
|---|---|
| React | 18.3.1 |
| Vite | 6.0.0 |
| Node.js | 20 (Docker) |
| Nginx | latest (producción) |

> No utiliza frameworks CSS, router externo, ni librerías HTTP. Todo es vanilla React con `fetch` y `useState`.

## Estructura del proyecto

```
src/
├── main.jsx                → Punto de entrada de React
├── App.jsx                 → Componente raíz + enrutamiento manual
├── App.css                 → Estilos globales (header, nav)
├── services/
│   └── api.js              → Todas las llamadas a la API (fetch + JWT)
├── pages/
│   ├── Login.jsx + .css    → Inicio de sesión
│   ├── Register.jsx + .css → Registro de nuevo usuario
│   ├── Dashboard.jsx + .css→ Resumen financiero
│   ├── Movimientos.jsx + .css → CRUD de transacciones
│   ├── Categorias.jsx + .css  → CRUD de categorías
│   ├── Remesas.jsx + .css  → Vista de remesas (filtro de ingresos)
│   ├── Ingresos.jsx + .css → Vista de ingresos
│   └── Gastos.jsx + .css   → Vista de gastos
└── assets/
    ├── logo_remesa.png
    ├── logo_remesa-sinfondo.png
    └── hero.png
```

## Requisitos

- Node.js 18+ (para desarrollo local)
- Backend corriendo en `http://localhost:5203`

## Puesta en marcha (desarrollo)

```bash
cd frontend
npm install
npm run dev
```

El servidor de desarrollo arranca en `http://localhost:5173`.

Las llamadas a `/api/*` se proxean automáticamente al backend en `http://localhost:5203` (configurado en `vite.config.js`).

## Puesta en marcha con Docker

```bash
# Desde la carpeta backend/ (contiene el docker-compose.yml)
docker compose up --build
```

El frontend se sirve en `http://localhost:5173` vía Nginx, que proxea `/api/*` al contenedor del backend.

## Páginas

| Página | Descripción |
|---|---|
| **Login** | Inicio de sesión con correo y contraseña |
| **Register** | Registro de nuevo usuario (crea hogar automáticamente) |
| **Dashboard** | Resumen: total ingresos, gastos, remesas y balance |
| **Movimientos** | CRUD completo de todas las transacciones |
| **Categorias** | CRUD de categorías de ingreso y gasto |
| **Remesas** | Vista filtrada de ingresos con origen/emisora |
| **Ingresos** | Vista filtrada de ingresos sin origen |
| **Gastos** | Vista filtrada de gastos |

## Conceptos clave

- **Movimiento**: entidad central. Campo `tipo` define si es `"Ingreso"` o `"Gasto"`
- **Remesa**: es un ingreso donde `origenEmisora` tiene valor (dinero recibido del exterior)
- **Categorías**: tienen un `tipo` (`"Ingreso"` o `"Gasto"`) que filtra en qué formularios aparecen
- **Autenticación**: JWT almacenado en `localStorage`, restaurado al recargar la página

## API Service (`src/services/api.js`)

| Módulo | Métodos | Endpoints |
|---|---|---|
| `authApi` | `login`, `register`, `cerrarSesion` | `/api/Auth/*` |
| `categoriasApi` | `listar`, `crear`, `actualizar`, `eliminar` | `/api/Categorias/*` |
| `movimientosApi` | `listar`, `crear`, `actualizar`, `eliminar` | `/api/Movimientos/*` |

Todas las peticiones autenticadas incluyen `Authorization: Bearer <token>`.

## Docker (producción)

El `Dockerfile` usa un build multi-etapa:

1. **Build** (`node:20-alpine`): `npm ci` + `npm run build` → genera `dist/`
2. **Producción** (`nginx:alpine`): copia `dist/` y `nginx.conf`, expone puerto 80

### nginx.conf

- Sirve archivos estáticos de `/usr/share/nginx/html`
- Proxea `/api/*` a `http://backend_api:8080/api/`
- SPA fallback: todas las rutas caen en `index.html`

## Estilos

- CSS puro (sin framework)
- Colores principales: azul `#2563eb`, verde `#16a34a` (ingresos), rojo `#dc2626` (gastos), púrpura `#7c3aed` (remesas)
- Diseño responsive con breakpoint en 700px
- Layout basado en cards con sombras y border-radius 14-18px

## Pendientes

- [ ] Instalar `react-router-dom` para enrutamiento profesional
- [ ] Agregar framework CSS (Tailwind, etc.)
- [ ] Implementar páginas de presupuestos, metas de ahorro y educación financiera
- [ ] Agregar tests (Vitest)
