# TUVANSA ERP Frontend

Frontend para la migración gradual del ERP heredado en OMNIS/PROSCAI. La interfaz conservará el orden de campos, nombres visibles y flujo operativo de cada pantalla, usando componentes web accesibles y reutilizables.

## Stack

- React 19, TypeScript y Vite
- React Router en Data Mode
- Zustand para estado global del cliente
- TanStack Query para estado y caché del servidor
- Axios para peticiones HTTP
- React Hook Form y Zod para formularios y validación
- shadcn/ui con Base UI, preset Mira y Tailwind CSS 4
- Hugeicons como biblioteca de iconos del preset
- pnpm como gestor de paquetes

## Inicio local

```bash
pnpm install
copy .env.example .env
pnpm dev
```

La API se espera por defecto en `http://localhost:3000/api`. Se puede cambiar con `VITE_API_BASE_URL`.

## Comandos

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

## Arquitectura

```text
src/
├─ app/                         # Infraestructura y composición de la aplicación
│  ├─ config/                   # Variables de entorno
│  ├─ layouts/                  # Layouts generales
│  ├─ providers/                # QueryClient y providers globales
│  ├─ router/                   # Rutas Data Mode
│  ├─ App.tsx
│  └─ store.ts                  # Estado global estrictamente de UI
├─ features/
│  ├─ inventories/products/     # Catálogo y operaciones de Inventarios PT
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ services/
│  │  ├─ logic.ts
│  │  └─ model.ts
│  └─ workspace/                # Pantalla inicial y navegación del ERP
│     ├─ components/
│     ├─ pages/
│     ├─ model.ts
│     └─ workspace-route.tsx
├─ shared/
│  ├─ api/                      # Cliente Axios y errores HTTP
│  ├─ hooks/                    # Hooks transversales
│  ├─ types/                    # Contratos globales
│  ├─ ui/                       # Primitives generadas por shadcn
│  └─ utils/
└─ main.tsx
```

Cada módulo nuevo vive dentro de `src/features/<modulo>` y contiene sus propios componentes, servicios HTTP, modelo y lógica. Los datos remotos no se guardan en Zustand: pertenecen a TanStack Query. No se usan archivos índice como barrels; los imports apuntan directamente al archivo propietario.

Los componentes de `src/shared/ui` son primitives de shadcn. La composición común entre módulos vive en `src/shared/components`; los componentes que expresan reglas de negocio se conservan dentro de su feature.

## Flujo por módulo

Cada módulo se desarrolla en una rama independiente y con commits enfocados. La rama se integra a `main` únicamente después de revisión e indicación expresa. En cada pantalla se mantiene actualizado el [mapa de vistas y endpoints](docs/endpoint-map.md).

## Módulos disponibles

- **Inventarios P.T.**: `/inventarios/productos`. Incluye navegación anterior/siguiente, búsqueda, alta, baja, edición, detalle del catálogo y los paneles de Acciones, Compras/Prod y Consultas. Véase la [trazabilidad completa](docs/inventarios-catalogo-productos.md).
