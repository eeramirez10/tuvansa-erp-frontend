# Traspaso de contexto del frontend PROSCAI

Este documento permite continuar el frontend desde una sesión nueva de Codex
CLI. El procedimiento completo para observar y capturar SQL real vive en el
repositorio backend:

```text
https://github.com/eeramirez10/tuvansa-erp-api
docs/PROSCAI-MIGRATION-HANDOFF.md
```

Codex debe leer primero `AGENTS.md`. Las instrucciones permanentes se conservan
en archivos versionados porque una sesión nueva no hereda automáticamente el
historial del chat anterior.

Referencias oficiales de continuidad y configuración:

- `https://learn.chatgpt.com/es-419/docs/agent-configuration/agents-md`
- `https://learn.chatgpt.com/es-419/docs/projects`

## Propósito y repositorios

- Frontend: `https://github.com/eeramirez10/tuvansa-erp-frontend`
- Backend: `https://github.com/eeramirez10/tuvansa-erp-api`

El objetivo es reproducir el flujo operativo de PROSCAI/OMNIS con una interfaz
moderna, no rediseñar arbitrariamente el ERP. En el nuevo servidor existe una
versión de PROSCAI más reciente con algunas funciones adicionales. Primero se
documentan sus diferencias visuales y SQL; después se extienden API y frontend.

## Stack aprobado

- React 19, TypeScript y Vite.
- React Router en Data Mode.
- TanStack Query para servidor/caché.
- Zustand para estado global exclusivamente visual.
- Axios para HTTP.
- React Hook Form + Zod para formularios.
- shadcn con Base UI, preset Mira y Tailwind CSS.
- Hugeicons para iconografía.
- `react-rnd` para las ventanas movibles y redimensionables.
- `pnpm` como único gestor de paquetes.

## Arquitectura

```text
src/
  app/                 # composición, layouts, router, providers y store UI
  features/
    <domain>/<feature>/
      components/
      pages/
      services/        # Axios
      model.ts         # tipos/validación propios
      logic.ts         # query keys, query options y transformaciones
  shared/
    api/
    hooks/
    types/
    ui/                # primitives y composiciones reutilizables
    utils/
```

Los datos del backend no se copian a Zustand. Las consultas de TanStack Query
deben depender de todas las variables que cambian el resultado. Las rutas se
cargan de forma diferida para evitar bloquear la navegación por requests de
otras pantallas.

## Rutas implementadas

```text
/
/inventarios/productos/:productId?
/cuentas-por-cobrar/clientes/:clientId?
/cuentas-por-pagar/proveedores/:supplierId?
/recepciones/:purchaseReceptionId?
/ordenes-compra/:purchaseOrderId?
/pedidos/:orderId?
/facturacion/:invoiceId?
/contabilidad/polizas/:policyId?
/bancos/:bankAccountId?
```

Inventarios M.P. navega actualmente a Inventarios P.T. porque en la versión
anterior compartían la vista. Confirma si la versión nueva mantiene esa regla.

## Sistema visual compartido

La apariencia aprobada parte de OMNIS, con componentes shadcn:

- encabezado compacto con logo y grupos de botones de módulos en su distribución
  heredada;
- tarjeta contextual a la derecha con nombre e icono del módulo;
- debajo de esa tarjeta, barra contextual para anterior, búsqueda, siguiente y
  mantenimiento según el módulo;
- paneles laterales o en columnas para Acciones, Consultas, Compras/Prod y
  secciones equivalentes;
- labels e inputs compactos, con el label arriba del input en los formularios ya
  migrados;
- interruptor global que conserva tamaño original o amplía fuente y controles;
- ventanas de tamaño inicial mediano que pueden moverse, redimensionarse,
  maximizarse, minimizarse y coexistir;
- ventanas minimizadas recuperables desde la barra de tareas inferior;
- tablas anchas con scroll XY y barra horizontal al final.

Reutiliza `src/shared/ui/erp-data-dialog.tsx` y el administrador de ventanas. No
regreses a diálogos que ocupen todo el ancho ni implementes una ventana aislada
que no pueda coexistir con las demás.

## Cómo investigar una función nueva

1. Abre la pantalla exacta en la versión nueva de PROSCAI.
2. Captura visualmente la pantalla base y anota ruta, título y registro usado.
3. Compara contra el frontend y los documentos existentes.
4. Registra el texto visible y orden de todos los botones. No uses el nombre de
   la función interna si el usuario ve otra etiqueta.
5. Abre un botón a la vez y documenta tamaño, campos, columnas, orden, totales,
   botones internos, scroll y estados vacíos.
6. En el backend, sigue el runbook de `general_log` con un marcador por acción.
7. Clasifica el SQL como capturado, adaptado o derivado.
8. Actualiza primero el contrato HTTP y sus pruebas.
9. Conecta el frontend mediante model, service y logic de la feature.
10. Actualiza `docs/endpoint-map.md` y el documento de la pantalla.

Para funciones de escritura, no hagas pruebas hasta confirmar que el origen es
una copia aislada y recibir autorización. Algunas ventanas aparentemente de
consulta pueden guardar datos al abrirse o confirmarse.

## Relación botón/API obligatoria

Cada control nuevo debe documentarse así:

| Módulo | Vista | Sección | Texto visible | Evento | Método | Endpoint | Query key/mutation | Archivo | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ejemplo | Pedidos | Acciones | Comentarios | Clic | GET | `/sales/orders/:id/comments` | `[...]` | `src/features/...` | SQL capturado |

Si OMNIS no emite consulta, registra esa ausencia. No crees datos ficticios para
llenar una ventana.

## Variables y datos

El frontend espera:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

En despliegues puede apuntar a una URL pública con el mismo sufijo `/api`. No
incorpores `.env` al repositorio. Los archivos `.firebase/`, `.firebaserc` y
`firebase.json` son locales y deben quedar fuera salvo que el usuario autorice
versionarlos.

La base que alimenta la API puede ser más reciente que el respaldo abierto en
OMNIS. Por ello, cantidades y fechas pueden variar. Deben coincidir contratos,
filtros, relaciones y significado funcional, no necesariamente cada importe.

## Validación antes de entregar

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

También verifica:

- entrada directa y navegación hacia la ruta;
- carga inicial y cambio de registro;
- selección desde el buscador;
- estados loading/error/vacío;
- scroll X/Y en tablas;
- apertura simultánea, minimización y restauración de ventanas;
- tamaño original y modo ampliado.

No hagas merge a `main` hasta recibir la orden expresa.

## Prompt inicial recomendado

```text
Lee completamente AGENTS.md y docs/PROSCAI-MIGRATION-HANDOFF.md. Revisa
docs/endpoint-map.md y el documento de la pantalla antes de editar.

Este servidor contiene una versión más reciente de PROSCAI. Primero inspecciona
la UI ya abierta y documenta las diferencias. Coordina la captura SQL con el
runbook del repositorio backend. No inventes endpoints ni SQL. Reutiliza el
sistema compartido de layout, densidad y ventanas. Crea una rama por módulo y no
mezcles a main sin autorización expresa.
```

## Referencias internas

- `README.md`: stack y arquitectura.
- `docs/endpoint-map.md`: contrato vista/control/API.
- `docs/inventarios-catalogo-productos.md`: patrón de catálogo complejo.
- `docs/cuentas-por-cobrar-catalogo-clientes.md`: patrón de clientes.
- `src/shared/ui/erp-data-dialog.tsx`: ventana reutilizable.
- `src/shared/ui/desktop-window-store.ts`: estado de ventanas.
- `src/app/router/router.tsx`: rutas Data Mode.
