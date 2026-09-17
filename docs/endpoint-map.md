# Mapa de vistas, controles y endpoints

Este documento es el contrato de trazabilidad entre la interfaz heredada de OMNIS/PROSCAI y el frontend. Cada pantalla implementada debe registrar el texto visible real del control, su evento, la petición HTTP y la clave de caché de TanStack Query.

## Estado inicial

### Pedidos: alta de la versión nueva

Actualización 2026-09-15: los endpoints de escritura de Pedidos ahora guardan en PostgreSQL/Neon. Los paths se conservan; la API asigna folios NP y combina versiones locales con MySQL. `Order.storage` identifica origen local, ID heredado y revisión; los paneles pueden devolver `source: postgres`. Sin `NEON_DATABASE_URL`, el guardado devuelve 503 sin intentar escribir en MySQL. Los errores por permisos MySQL mencionados abajo corresponden a las pruebas históricas anteriores a esta separación.

Detalle: [flujo, alcance y validación](ventas-pedidos-alta.md). Rutas relativas al prefijo `/api`. Evidencia SQL: `docs/modules/sales/orders-create-sql-new-version.md` del backend; marcadores `ORDERS_NEW_000001_*`.

| Vista / control | Evento | Método y endpoint | Query key / mutation | Archivo |
| --- | --- | --- | --- | --- |
| Pedidos / Nuevo (hoja) | Abrir Captura de pedido en un modal; el primer paso selecciona Almacén | GET `/sales/orders/capture/options` | sales/orders/capture/options | order-capture-dialog.tsx |
| Captura / Cliente | Enter o salir del campo | GET `/sales/orders/capture/customers/:code` | sales/orders/capture/customer/code | order-capture-service.ts |
| Captura / Código | Enter o salir del campo | GET `/sales/orders/capture/products/:code?warehouse=...&typeCode=P&customerCode=...` | sales/orders/capture/product/code/warehouse/typeCode/customerCode | order-capture-service.ts |
| Captura / Agregar partida, Tab desde Pzas. | Incorporar renglón | Sin escritura HTTP | Borrador React Hook Form | order-capture-dialog.tsx |
| Captura / OK | Abrir Comentarios | Sin escritura HTTP | Borrador | order-capture-dialog.tsx |
| Comentarios / OK | Guardar alta completa | POST `/sales/orders/capture` | saveCapturedOrder; invalida pedidos/productos/clientes | order-capture-service.ts |
| ¿Continuo? / Sí, No | Nueva captura o abrir resultado | Sin escritura adicional | Reiniciar borrador / detalle del registro | order-capture-dialog.tsx |
| Pedidos / Cotiz | Alternar Pedido/Cotización | POST `/sales/orders/:id/actions/quote-conversion` | toggleOrderQuote; invalida pedidos/productos | order-catalog-page.tsx |

### Pedidos: autorización, asignación y cambio de partidas

Implementación 2026-09-17 basada en `ORDERS_*` del reporte `orders-behaviors-new-version.md` del backend.

| Vista / control | Evento | Método y endpoint | Query key / mutation | Archivo |
| --- | --- | --- | --- | --- |
| Captura / Cliente | Tab con código parcial | GET `/sales/orders/capture/customers?query=...` | customer-matches | order-capture-dialog.tsx |
| Captura / Precio | Blur o agregar partida | Validación local y validación del POST | `ORDER_PRICE_BELOW_COST` | order-capture-dialog.tsx |
| Pedidos / Autorizar | Clic o Ctrl+A | POST `/sales/orders/:id/actions/authorization` | setOrderAuthorization | order-catalog-page.tsx |
| Pedidos / Asignar todo | Clic o Ctrl+P | POST `/sales/orders/:id/actions/assignment` | setOrderAssignment | order-assignment-dialog.tsx |
| Pedidos / Editar | Clic | PATCH `/sales/orders/:id` | updateOrder; sólo partidas | order-form-dialog.tsx |
| Pedidos / Cotiz | Clic en Pedido o Cotización | POST `/sales/orders/:id/actions/quote-conversion` | toggleOrderQuote | order-catalog-page.tsx |

Las escrituras quedan en PostgreSQL/Neon. La lectura MySQL determina autorización con `PEPAR9='O.K.'`. La interfaz bloquea asignación sin autorización, edición autorizada y desautorización con cantidades asignadas; el servidor repite las validaciones.

La UI guarda una cotización y permite convertirla con Cotiz. El primer OK difiere de OMNIS: la persistencia se aplaza al OK final para evitar altas parciales al cancelar. Los controles secundarios cuya escritura no fue validada permanecen de sólo lectura. La cuenta local actual no permite el bloqueo/escritura de FTIPMV: el guardado real devuelve 503; no se deben confundir las pruebas HTTP simuladas de éxito con una escritura real.

### Verifica fiscal: edición disponible, verificación pendiente

Prefijo: `/api/accounts-receivable/clients/:clientId/actions/fiscal-verification`.

| Vista / control | Evento | Endpoint | Caché / estado |
|---|---|---|---|
| Clientes / Verifica fiscal | Clic | POST `/verify` | 501 explícito; no verifica ni escribe |
| Clientes / Verifica fiscal | Ctrl + clic, Yes | GET `/` | clientKeys.detail(id) + fiscal-verification; sólo lectura |
| Cliente - Datos Fiscal / OK | Guardar | PATCH `/` | expectedVersion + values; invalida clientKeys.all; cambios quedan pendientes |
| Cliente - Datos Fiscal / Cancelar | Cierre | Ninguno | Descarta formulario |
| Cliente - Datos Fiscal / Act. | Deshabilitado | Ninguno | Operación pendiente de captura |

SQL y diferencias se documentan en `docs/modules/accounts-receivable/client-fiscal-verification.md` del backend. El frontend no calcula ni envía CLICFDI4CS.

La conexión al proveedor se pospuso por decisión del usuario. El servicio y la UI están preparados para mostrar el mensaje de POST `/verify`: actualmente 501 por integración pendiente; con un adaptador futuro, rechazo 422, indisponibilidad 503, conflicto 409 o validación del proveedor 200 con `legacySync: pending`. Este último resultado no marca al cliente como verificado en PROSCAI. `verificationAvailable` es booleano y actualmente false.

| Módulo | Vista de OMNIS/PROSCAI | Control visible | Evento | Método y endpoint | Query key | Estado frontend |
| --- | --- | --- | --- | --- | --- | --- |
| General | Selector de módulos | Inicio | Abrir aplicación | Sin petición | Sin caché | Implementado |
| Cuentas por cobrar | Catálogo de clientes | Carga del catálogo | Abrir vista | `GET /accounts-receivable/clients` | `['accounts-receivable', 'clients', ...]` | Implementado |
| Inventarios PT | Catálogo de productos | Carga del catálogo | Abrir vista | `GET /inventories/products` | `['inventories', 'products', ...]` | Implementado |

Los endpoints son relativos a `VITE_API_BASE_URL`, cuyo valor local predeterminado es `http://localhost:3000/api`.

El desglose de la vista, la barra de navegación y cada botón de **Acciones**, **Compras/Prod** y **Consultas** está en [Inventarios PT: catálogo de productos](inventarios-catalogo-productos.md).

El detalle equivalente de Cuentas por cobrar está en [Catálogo de clientes](cuentas-por-cobrar-catalogo-clientes.md).

## Plantilla obligatoria para nuevas pantallas

| Módulo | Vista de OMNIS/PROSCAI | Sección | Control visible | Tipo de control | Evento | Método | Endpoint | Parámetros/body | Query key o mutation | Archivo frontend | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ejemplo | Catálogo | Barra inferior | Buscar | Botón | Clic | `GET` | `/recurso` | `search`, `limit`, `offset` | `['recurso', filtros]` | `src/features/...` | Pendiente |

Si el nombre interno heredado no coincide con el texto visible —por ejemplo, una función llamada “auxiliares” presentada como botón “Movimientos”— se documenta siempre primero el nombre que ve el usuario y después la referencia interna en una nota técnica.
