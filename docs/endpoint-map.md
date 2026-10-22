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
| Captura / Código | Enter o salir del campo; acepta ICOD o IEAN y muestra el ICOD canónico | GET `/sales/orders/capture/products/:identifier?warehouse=...&typeCode=P&customerCode=...` | sales/orders/capture/product/identifier/warehouse/typeCode/customerCode | order-capture-service.ts |
| Captura / Agregar partida, Tab desde Pzas. | Incorporar renglón y devolver foco a Código | Sin escritura HTTP | Borrador React Hook Form | order-capture-dialog.tsx |
| Captura / Renglón de partida | Seleccionar, cargar en la fila superior y actualizar en su posición | Sin escritura HTTP | Borrador React Hook Form | order-capture-dialog.tsx |
| Captura / OK | Abrir Comentarios | Sin escritura HTTP | Borrador | order-capture-dialog.tsx |
| Comentarios / OK | Guardar alta completa | POST `/sales/orders/capture` | saveCapturedOrder; invalida pedidos/productos/clientes | order-capture-service.ts |
| Comentarios / T.C. y Moneda de cobro | Recalcular partidas y totales en PESOS o DOLARES | POST `/sales/orders/capture` | conversión local y validación final del backend | order-capture-dialog.tsx |
| Pedidos / Comentarios / OK | Modificar T.C. o Moneda de cobro después del alta | PATCH `/sales/orders/:id/actions/comments` | updateOrderComments; invalida pedidos | order-panel-dialog.tsx |
| ¿Continuo? / Sí, No | Nueva captura o abrir resultado | Sin escritura adicional | Reiniciar borrador / detalle del registro | order-capture-dialog.tsx |
| Pedidos / Cotiz | Alternar Pedido/Cotización | POST `/sales/orders/:id/actions/quote-conversion` | toggleOrderQuote; invalida pedidos/productos | order-catalog-page.tsx |

### Pedidos: autorización, asignación y cambio de partidas

Implementación 2026-09-17 basada en `ORDERS_*` del reporte `orders-behaviors-new-version.md` del backend.

| Vista / control | Evento | Método y endpoint | Query key / mutation | Archivo |
| --- | --- | --- | --- | --- |
| Captura / Cliente | Tab con código parcial; abre una ventana ERP independiente delante de Captura de pedido, con filtros Código/Nombre/RFC | GET `/sales/orders/capture/customers?code=...&name=...&taxId=...` | customer-matches | order-customer-matches-dialog.tsx |
| Captura / Código de producto inexistente | Tab o Enter; abre Encuentra producto delante de Captura de pedido, con filtros Código/IEAN, Descripción y Cod Prv | GET `/sales/orders/capture/products?warehouse=01&code=...&description=...&supplierCode=...` | product-matches | order-product-matches-dialog.tsx |
| Captura / Precio | Blur o agregar partida; pesos contra lista 5, dólares contra lista 6 | Validación local y validación del POST | `ORDER_PRICE_BELOW_COST` | order-capture-dialog.tsx |
| Pedidos / Autorizar | Clic o Ctrl+A | POST `/sales/orders/:id/actions/authorization` | setOrderAuthorization | order-catalog-page.tsx |
| Pedidos / Asignar todo | Clic o Ctrl+P | POST `/sales/orders/:id/actions/assignment` | setOrderAssignment | order-assignment-dialog.tsx |
| Pedidos / Editar | Clic; selecciona renglones. Tab desde Pzas. agrega/actualiza o elimina si el código quedó vacío y devuelve foco a Código/IEAN | PATCH `/sales/orders/:id` | updateOrder; reemplazo del detalle completo | order-form-dialog.tsx |
| Pedidos / Cotiz | Clic en Pedido o Cotización | POST `/sales/orders/:id/actions/quote-conversion` | toggleOrderQuote | order-catalog-page.tsx |

Las escrituras quedan en PostgreSQL/Neon. La lectura MySQL determina autorización con `PEPAR9='O.K.'`. La interfaz bloquea asignación sin autorización, edición autorizada y desautorización con cantidades asignadas; el servidor repite las validaciones.

En las ventanas ERP de Ventas, Enter ejecuta el botón habilitado cuyo texto visible es **OK** y Escape ejecuta **Cancelar**. El manejo compartido vive en `erp-data-dialog.tsx`; no intercepta Enter en textarea, select, botones ni formularios con submit propio.

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

### Coincidencias de producto en Captura y Cambio de pedido (2026-09-30)

| Vista / control | Evento | Endpoint | Query key | Archivo |
| --- | --- | --- | --- | --- |
| Captura / Cambio de pedido: Código / IEAN | Escribir prefijo; sugerencias, flechas y Enter/Tab o clic para cargar | GET /sales/orders/capture/products?warehouse=...&code=... | product-matches, almacén canónico, código, descripción, proveedor | order-product-code-input.tsx |
| Captura / Cambio de pedido: Buscar producto | Código sin resolver, ambiguo, botón del campo o F2 | GET /sales/orders/capture/products | product-matches | order-product-matches-dialog.tsx |
| Encuentra producto: fila / OK | Doble clic o OK; validar referencia y agregar al borrador | GET /sales/orders/capture/products/:code | capture/product, código, almacén, tipo y cliente | order-capture-dialog.tsx, order-form-dialog.tsx |

El SQL del buscador es derivado. No se efectuó una nueva captura OMNIS. El almacén procede del pedido (1 equivale a 01) y las lecturas no aplican la restricción de alta. La escritura final continúa por POST /sales/orders/capture o PATCH /sales/orders/:id; conserva el bloqueo de precio bajo costo.


### Contabilidad: Estado de resultados (2026-10-22)

Detalle: [Estado de resultados y PDF](contabilidad-estado-resultados.md). Evidencia del backend: docs/modules/accounting/income-statement.md; captura ACCOUNTING_INCOME_STATEMENT_ACCOUNTS8_MONTH22_LEVEL3_SCREEN.

| Vista / control | Evento | Método y endpoint | Query key / estado | Archivo |
| --- | --- | --- | --- | --- |
| Contabilidad / Reportes / Estado de resultados | Abrir parámetros | GET /accounting/reports/income-statement/options | [accounting, reports, income-statement, options] | income-statement-page.tsx |
| Estado de resultados / OK | Generar vista previa | GET /accounting/reports/income-statement?accounts=8&month=22&level=3 | [accounting, reports, income-statement, {accounts, month, level}] | income-statement-service.ts |
| Vista previa / Parámetros | Cambiar mes o nivel | La misma consulta al confirmar OK | Clave dependiente de todos los parámetros | income-statement-page.tsx |
| Vista previa / Imprimir / Guardar PDF | Abrir impresión del navegador | Sin petición adicional | Documento carta de la respuesta actual | income-statement-document.tsx, income-statement.css |

Lectura de saldos adaptada de FCCBENC + FBENC; calendario y composición del reporte derivados y contrastados con PDF. No genera escrituras ni requiere migraciones. Ruta directa /contabilidad/reportes/estado-de-resultados.


### Estado de resultados: formato gerencial del Excel

| Vista / control | Evento | Método y endpoint | Caché / estado | Archivo |
| --- | --- | --- | --- | --- |
| Formato / Gerencial (Excel) | Seleccionar presentación | Sin petición; usa financial de GET /accounting/reports/income-statement | Misma clave del reporte; formato local React | financial-income-statement-document.tsx |
| Formato / PROSCAI | Seleccionar presentación anterior | Sin petición | Misma respuesta rows/totals | income-statement-document.tsx |
| Imprimir / Guardar PDF | Imprimir el formato seleccionado | Sin petición | Mismo documento, sin controles de aplicación | financial-income-statement.css / income-statement.css |

El contrato se amplía con financial; no cambia la clave ni el endpoint. El mapeo y los porcentajes son derivados, documentados en el backend. Fuente: FCCBENC + FBENC de la lectura adaptada existente; no hay nueva captura OMNIS. El Excel se utiliza como plantilla visual, sin copiar errores de fórmula ni ajustes manuales. Detalle y límites fiscales: [Estado de resultados](contabilidad-estado-resultados.md).


### Estado de resultados: sólo México, archivo actualizado

Esta entrada sustituye el acceso predeterminado Gerencial (Excel) descrito arriba por México (Excel). El reporte histórico PROSCAI conserva su contrato.

| Vista / control | Evento | Endpoint relativo a /api | Query key | Archivo |
| --- | --- | --- | --- | --- |
| México / parámetros | Abrir ventana con sucursal/ejercicio fijos | GET /accounting/reports/income-statement/mexico/options | accounting, reports, income-statement, mexico, options | mexico-income-statement-page.tsx |
| México / Mes / OK | Generar | GET /accounting/reports/income-statement/mexico?year=2026&month=8 | accounting, reports, income-statement, mexico, {year, month} | income-statement-service.ts |
| Formato / México (Excel) o PROSCAI | Cambiar modalidad y abrir sus propios parámetros | Opciones y reporte de cada modalidad | Claves separadas; calendarios independientes | income-statement-toolbar.tsx, income-statement-page.tsx |
| Imprimir / Guardar PDF | Imprimir el formato seleccionado | Sin HTTP adicional | Respuesta mostrada | financial-income-statement-document.tsx |

México usa la compañía asociada a almacén 01 mediante CATMULTICIA, centro consolidado -1 y meses 1..12 del ejercicio CIAPERIODO. Sólo se publica México; parámetros de otra sucursal son rechazados. Provisiones vacías del Excel se toman como cero con nota explícita. La descripción completa y las 54 comparaciones de importes están en [Estado de resultados](contabilidad-estado-resultados.md).
