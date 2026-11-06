# Tuvansa ERP Frontend - instrucciones para Codex

## Contexto obligatorio

- Este frontend migra la interfaz del ERP PROSCAI/OMNIS a React sin cambiar el flujo operativo conocido por los usuarios.
- Antes de trabajar, lee `docs/PROSCAI-MIGRATION-HANDOFF.md`, `docs/endpoint-map.md` y el documento de la pantalla correspondiente.
- El backend y la evidencia SQL están en `https://github.com/eeramirez10/tuvansa-erp-api`.
- El SQL literal se captura y documenta primero en el backend. No inventes endpoints ni relaciones desde el frontend.

## Flujo Git

- Crea una rama por módulo o cambio independiente y usa commits enfocados.
- Indica al usuario cuando detectes una oportunidad para abrir otra rama.
- No mezcles a `main` ni publiques `main` hasta recibir una indicación expresa.
- No agregues `.firebase/`, `.firebaserc` ni `firebase.json` salvo autorización específica; actualmente son archivos locales del usuario.

## Arquitectura y stack

- Usa React + TypeScript + Vite y `pnpm`.
- Mantén Screaming Architecture bajo `src/features/<domain>/<feature>`.
- Cada feature contiene sus componentes, pages, services, `model.ts` y `logic.ts`.
- Usa React Router en Data Mode para rutas.
- Usa TanStack Query para datos remotos y caché.
- Usa Zustand sólo para estado global de interfaz; no dupliques datos remotos allí.
- Usa Axios mediante el cliente compartido para HTTP.
- Usa React Hook Form + Zod para formularios.
- Toda interfaz debe utilizar componentes de shadcn con Base UI, respetando el estilo del proyecto: preset Mira, Tailwind y Hugeicons.
- Reutiliza los componentes compartidos. Si falta un componente, incorpora el equivalente de shadcn.
- No implementes controles alternativos cuando exista un equivalente en shadcn.
- Evita barrels; importa desde el archivo propietario.

## Fidelidad funcional y visual

- Inspecciona primero la ventana real de OMNIS antes de crear o renombrar controles.
- Conserva el texto visible, orden de campos, columnas, totales, agrupaciones y flujo. El nombre visible prevalece sobre nombres internos de OMNIS.
- Mantén la densidad aprobada: fuente e inputs compactos, botones pequeños y opción global para ampliar la interfaz.
- Las etiquetas de campos van encima de los inputs donde así quedó definido en las pantallas migradas.
- Usa el encabezado compartido con navegación de módulos, tarjeta del módulo e iconos contextuales.
- Los paneles de Acciones, Consultas y secciones equivalentes deben conservar la distribución horizontal de las vistas existentes.
- Las ventanas de datos usan el sistema compartido: tamaño inicial mediano, mover, resize, maximizar, minimizar, múltiples ventanas y barra inferior de tareas.
- Si una tabla excede la ventana, habilita scroll X/Y y asegúrate de que la barra horizontal quede al final del contenido.
- Reutiliza componentes compartidos antes de crear variantes por módulo.
- Los menús del encabezado muestran sólo las opciones del módulo activo. Reutiliza Dropdown Menu y submenús de shadcn con catálogos por módulo; no propagues reportes globalmente. Los reportes financieros actuales pertenecen a Contabilidad; Comisiones por Cobranza pertenece a Ventas (Pedidos y Facturación), en `Reportes de Ventas → Comisiones → Reporte Comisiones x Cobranza`; consulta `docs/menus-por-modulo.md`.
- El menú principal de reportes se llama `Reportes <nombre del módulo>` (por ejemplo, `Reportes Contabilidad`, `Reportes Pedidos` o `Reportes Bancos`). La etiqueta explícita de Ventas es `Reportes de Ventas`. Los nombres de los submenús se definen por separado conforme se agregan.

## Integración con la API

- `VITE_API_BASE_URL` incluye el prefijo `/api`.
- Define tipos en el modelo de la feature, llamadas Axios en `services` y query options/keys en `logic.ts`.
- Al seleccionar un resultado de búsqueda, carga inmediatamente todos los datos dependientes; no obligues al usuario a pulsar anterior/siguiente para refrescar.
- La base de OMNIS usada para observar la UI y la base servida por la API pueden tener fechas distintas. Compara estructura, no importes exactos.
- Actualiza `docs/endpoint-map.md` al agregar controles o endpoints.

## Validación

- Antes de entregar ejecuta `pnpm lint`, `pnpm typecheck` y `pnpm build`.
- Verifica rutas por acceso directo y navegación del encabezado.
- Comprueba estados de carga, error, vacío, paginación y scroll.
- No incluyas secretos, `.env`, capturas con datos sensibles ni artefactos de build.
