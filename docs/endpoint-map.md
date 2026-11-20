# Mapa de vistas, controles y endpoints

## Comisiones por cobranza (2026-11-09)

**Reportes de Ventas → Comisiones → Reporte Comisiones x Cobranza**;
`/ventas/reportes/comisiones-por-cobranza`. Disponible en Pedidos y Facturación.
Catálogos GET `/sales/reports/collection-commissions/options`; Vista previa GET
`/sales/reports/collection-commissions?from=2026-08-01&to=2026-08-31&branch=01&agent=all`.
Periodo FAX.AFECHA y pagos PA; partidas separadas evitan multiplicar cobranza.
Incluye cobros PA y ajustes K/D/C por su propia AFECHA. Cancelación K de factura
previamente cobrada, devolución D y nota C se muestran en negativo aunque el PA
sea anterior; K positivo de D/C compensa el abono. rowKey identifica cada evento;
kind/eventDate/reviewRequired muestran tipo, fecha y REVISAR. No repite el cobro
histórico. [Alcance y costo de ajustes](comisiones-ajustes.md).
Notas C y sus reversiones se asignan al último agente que factura al mismo cliente
y compañía hasta el cierre (catálogo del cliente como alternativa), antes del filtro
Agente. creditNoteAmount/creditNotes separan **Notas de crédito** de Devoluciones;
los metadatos del agente original permiten revisión. El Excel pasa a dieciséis
columnas individuales. [Reglas y formato vigentes](comisiones-notas-credito.md).
Costo histórico/prorrateado, utilidad y LM según CUATRO.pdf/método 214.
Excluye facturas completas con servicios FINV.ITIPO=4, incluidas mixtas.
`displayPaymentAmount` y `displayPayment` muestran pagos positivos; los campos
firmados siguen disponibles para cálculo/auditoría. No cambia costo/utilidad.
Documentos y subtotales por agente en pantalla y Excel; resumen y descarga sin HTTP.
La marca actual FCLI.CLITARJETA se muestra completa y aporta 1% a Nuevo/Viejo_Reactivado
sobre el pago sin IVA; precisión por documento y redondeo por agente. Liquidación y
ajustes usa POST `/sales/reports/collection-commissions/preview` con `{criteria,settings}`
para calcular en READ ONLY, sin persistir. Permite modalidad adicional/sustitución,
planes, flete, gratificaciones y costo manual. Aplicar conserva la consulta vigente.
Libro con Ventas por agente, resumen de tres filas por vendedor y una hoja
individual de quince columnas con el resumen azul de catorce filas. Agrega
Cliente nuevo (sólo "nuevo", demás marcas vacías) y su 1% de lo pagado. Orden por
fecha de factura; sin hojas adicionales ni columnas ocultas.
[Formato y controles](liquidacion-comisiones.md).
Desde 2026-11-11, [Cliente y Agente combinables](comisiones-filtros.md): el buscador
reutiliza GET /accounts-receivable/clients?q=...&status=all&page=1&pageSize=25.
El reporte agrega customerId opcional (CLISEQ) a GET, POST preview y query key.
Excel y liquidación usan el resultado filtrado; limpiar cliente conserva los otros filtros.
Datos indefinidos se señalan, no se sustituyen por cero. La ruta contable anterior
redirige a Ventas. [Detalle](comisiones-por-cobranza.md).

## Menús por módulo (2026-11-06)

Los reportes financieros se muestran únicamente en **Contabilidad → Reportes Contabilidad →
Reportes Financieros**. Se retira el catálogo global del resto de los módulos.
El catálogo por módulo se define en `src/features/reports/model.ts`; cada módulo
puede registrar grupos y reportes propios reutilizando el mismo Dropdown Menu.
Ventas usa la etiqueta solicitada `Reportes de Ventas` para Comisiones. Por defecto el menú lleva el nombre del módulo: `Reportes <módulo>`;
los nombres de los submenús se definen por separado.
Detalles y validación: [Menús por módulo](menus-por-modulo.md).

Ventas e Inventario por familia usan ahora las rutas
`/contabilidad/reportes/ventas-por-familia` y
`/contabilidad/reportes/inventario-por-familia`. Las rutas anteriores redirigen
conservando la query string. Los endpoints y cálculos no cambian.

## Ventas por familia (2026-11-04)

Entrada existente habilitada en Reportes → Reportes Financieros → Ventas por familia.
Ruta /contabilidad/reportes/ventas-por-familia. Documento: [Ventas por familia](ventas-por-familia.md).

| Vista / control | Evento | Endpoint relativo a /api | Query key / archivo |
| --- | --- | --- | --- |
| Ventas por familia | Abrir catálogos | GET /sales/reports/by-family/options | sales,reports,by-family,options |
| Desde / Hasta / Sucursal / Familia IFAMB | Vista previa | GET /sales/reports/by-family?from=2026-08-01&to=2026-08-31&branch=01&family=all | sales,reports,by-family,{from,to,branch,family} |
| Mostrar / Detalle | Importe/metros, paginación | Sin HTTP adicional | sales-by-family-document.tsx |
| Excel / PDF | Exportar respuesta vigente | Sin HTTP adicional | sales-by-family-workbook.ts / impresión |

FINV.ITIPO=1 fijo; **ventas brutas: sólo facturas**, AICANTF × AIPRECIO, sin IVA.
Criterio vigente del 2026-11-06: MID(DNUM,1,1)='F' AND DSTATUSCFD=3 AND DESFACT=1.
Se retira el filtro de catálogo FTIPMV y el requisito AICANTF>0. Las partidas de
documentos elegibles conservan sus signos y ceros, también en cantidades/metros.
Respuesta con basis:gross, amount bruto y gross exacto por producto/sucursal.
Se usa el precio registrado sin revertir descuentos. Se conservan los filtros
de venta capturados; la selección de facturas y la agregación
por IFAMB/compañía/periodo son derivadas; no usa AICOSTO ni
modifica la base. Esta entrada sustituye el estado pendiente del menú descrito
en las secciones históricas de Inventario por familia.

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
| Inventarios PT | Consultas | Auxiliar | Abrir ventana o cargar más movimientos | `GET /inventories/products/:productId/queries/ledger?page=:page&pageSize=500` | `['inventories', 'products', 'detail', productId, 'panel', 'ledger', 'pages', filters]` | Lectura paginada con saldo acumulado |
| Inventarios PT | Auxiliar | Filtrar almacen | Clic con una fila seleccionada | Mismo GET con `warehouse` y, si Filtrar XXX ya estaba activo, `movementType=R&openingMovementType=R` | Clave de Auxiliar con filtros | Usa `data.openingStock` del almacén seleccionado |
| Inventarios PT | Auxiliar | Filtrar XXX | Clic | Mismo GET con `movementType=R` y los parámetros de almacén vigentes | Clave de Auxiliar con filtros | Conserva el saldo inicial y muestra únicamente movimientos tipo `R` |
| Inventarios PT | Consultas | Pedidos por cliente | Abrir ventana o cargar más pedidos | `GET /inventories/products/:productId/queries/customer-orders?page=:page&pageSize=500` | `['inventories', 'products', 'detail', productId, 'panel', 'customer-orders', 'pages', excludeFulfilled]` | Muestra Asignado y Total de toda la consulta con `data.customerOrdersTotals` |
| Inventarios PT | Pedidos por cliente | Filtrar pedidos surtidos | Clic | Mismo GET con `excludeFulfilled=true` | Clave de Pedidos por cliente con el filtro activo | Conserva partidas con `PLSURT < PLCANT` |
| Inventarios PT | Pedidos por cliente | Documento | Clic | Mismo GET, recorriendo todas las páginas con el filtro activo | Preparación de impresión local | Imprime el reporte de `EINV#7/495` con los totales de Pedido, Surtido y Resta |
| Inventarios PT | Consultas | Pedidos por cliente · `*` | Abrir ventana | `GET /inventories/products/:productId/queries/customer-orders/star` | `['inventories', 'products', 'detail', productId, 'panel', 'customer-orders-star', 'pages', filters]` | Lista vacía hasta elegir un clasificador |
| Inventarios PT | Pedidos por * | Clasificador o encabezado | Clic | Mismo GET con `classifier=1..9`, `sort=code\|name\|order\|date`, `page` y `pageSize` | Clave de Pedidos por * con el clasificador y orden activos | Renglones clasificados y totales de toda la consulta |
| Inventarios PT | Consultas | Cotizaciones por cliente | Abrir ventana o cargar más cotizaciones | `GET /inventories/products/:productId/queries/customer-quotes?page=:page&pageSize=500` | `['inventories', 'products', 'detail', productId, 'panel', 'customer-quotes', 'pages', excludeFulfilled]` | Conserva el título Pedidos por cliente y muestra el Total de toda la consulta |
| Inventarios PT | Cotizaciones por cliente | Filtrar pedidos surtidos | Clic | Mismo GET con `excludeFulfilled=true` | Clave de Cotizaciones por cliente con el filtro activo | Conserva partidas con `PLSURT < PLCANT` |
| Inventarios PT | Consultas | Ventas por cliente | Abrir ventana, ordenar por encabezado o cargar más ventas | `GET /inventories/products/:productId/queries/customer-sales?page=:page&pageSize=500&sort=:orden` | `['inventories', 'products', 'detail', productId, 'panel', 'customer-sales', 'pages', filters]` | Agrupa por cliente y muestra `data.customerSalesTotals` para toda la consulta |
| Inventarios PT | Consultas | Ventas por cliente · `*` | Abrir ventana y elegir clasificador u orden | `GET /inventories/products/:productId/queries/customer-sales/star` con `classifier=1..9`, `sort`, `page` y `pageSize` | `['inventories', 'products', 'detail', productId, 'panel', 'customer-sales-star', 'pages', filters]` | Lista vacía al abrir, ventas clasificadas y totales al elegir un botón |
| Inventarios PT | Consultas | Ventas por cliente · CT | Abrir ventana | `GET /inventories/products/:productId/queries/customer-sales/ct` | `['inventories', 'products', 'detail', productId, 'panel', 'customer-sales-ct']` | La lista usa `customerCode` y `customerName` para Código y Descripción |
| Inventarios PT | Consultas | Ventas desglosadas | Abrir ventana | `GET /inventories/products/:productId/queries/customer-sales/detail` | `['inventories', 'products', 'detail', productId, 'panel', 'customer-sales-detail']` | Precio US y TC Dolar usan `priceUsd` y `exchangeRate`. El pie usa `data.customerSalesTotals.quantity` de `EINV#38`. |
| Inventarios PT | Consultas | Ventas por sucursal | Abrir ventana, ordenar o cargar más ventas | `GET /inventories/products/:productId/queries/sales/by-branch` con `sort`, `page` y `pageSize` | `['inventories', 'products', 'detail', productId, 'panel', 'sales-by-branch', 'pages', filters]` | Agrupa por sucursal y cliente y conserva los totales globales |
| Inventarios PT | Consultas | Ventas anuales | Abrir ventana o cargar más ventas | `GET /inventories/products/:productId/queries/sales/annual` con `page` y `pageSize` | `['inventories', 'products', 'detail', productId, 'panel', 'annual-sales', 'pages']` | Matriz por cliente y año con `annualSalesDetails` |
| Inventarios PT | Consultas | Ventas anuales resumen | Abrir ventana o cargar más ventas | `GET /inventories/products/:productId/queries/sales/annual-summary` con `page` y `pageSize` | `['inventories', 'products', 'detail', productId, 'panel', 'annual-sales-summary', 'pages']` | Matriz por año, gráfica y `annualSalesDetails` |
| Inventarios PT | Consultas | Ordenado a proveedor | Abrir ventana, filtrar surtidos o cargar más pedidos | `GET /inventories/products/:productId/queries/supplier-orders` con `excludeFulfilled`, `page` y `pageSize` | `['inventories', 'products', 'detail', productId, 'panel', 'supplier-orders', 'pages', excludeFulfilled]` | Divide las cantidades de cada partida por su factor y usa `supplierOrdersTotals.remaining` para Por llegar |

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


### Estado de resultados: siete sucursales, consolidado y Excel

La modalidad predeterminada ahora es Todas las sucursales (Excel); se conservan México y PROSCAI.

| Vista / control | Evento | Endpoint relativo a /api | Query key | Archivo |
| --- | --- | --- | --- | --- |
| Todas las sucursales / parámetros | Abrir mes/ejercicio | GET /accounting/reports/income-statement/branches/options | accounting, reports, income-statement, branches, options | branch-income-statements-page.tsx |
| Todas las sucursales / OK | Generar siete reportes y consolidado | GET /accounting/reports/income-statement/branches?year=2026&month=8 | accounting, reports, income-statement, branches, {year, month} | income-statement-service.ts |
| Descargar Excel | Descargar archivo con nueve hojas | Sin HTTP adicional | Respuesta actual; ExcelJS diferido | download-income-statement-excel.ts, income-statement-workbook.ts |
| Imprimir / Guardar PDF | Imprimir ocho páginas | Sin HTTP adicional | Misma respuesta mostrada | financial-income-statement.css |

La lectura de saldos por lote es derivada de la proyección histórica y conserva BCCCENCOS=-1 por compañía; las siete compañías proceden de CATMULTICIA para almacenes 01..07. El consolidado suma MES y ACUMULADO y recalcula sus porcentajes. No hay nueva captura literal OMNIS. Véase [Estado de resultados](contabilidad-estado-resultados.md) y docs/modules/accounting/income-statement-branches.md del backend.


### Estado de resultados: menú shadcn y filtros unificados (2026-10-23)

| Vista / control | Evento | Endpoint relativo a /api | Estado / archivo |
| --- | --- | --- | --- |
| Encabezado global / Reportes / Reportes Financieros / Estado de resultados | Abrir desde Dropdown Menu + Submenu | Navega a /contabilidad/reportes/estado-de-resultados | features/reports/components/reports-menu.tsx; sin SQL |
| Año / Mes / Sucursal | Cargar opciones | GET /accounting/reports/income-statement/branches/options | years/defaultYear/defaultBranch y catálogo; branchIncomeStatementOptionsQuery |
| Vista previa | Generar una sucursal o todas | GET /accounting/reports/income-statement/branches?year=2026&month=8&branch=03 | Clave branches,{year,month,branch}; branch-income-statements-page.tsx |
| Salida Excel / Descargar Excel | Exportar respuesta actual | Sin HTTP adicional | Una hoja individual o nueve completas; ExcelJS |
| Salida PDF / Imprimir / Guardar PDF | Imprimir vista previa vigente | Sin HTTP adicional | Una página individual u ocho completas |

branch=all u omitido conserva el reporte completo. Una sucursal devuelve branches de longitud uno y consolidated:null. companyId no se recibe del cliente. Cambiar filtros bloquea exportación hasta regenerar; cambiar salida no cambia la caché contable. El selector Año usa sólo ejercicios soportados; actualmente 2026. Esta entrada sustituye los filtros fijos del modo gerencial anterior, conservando las modalidades México y PROSCAI.


### Estado de resultados: origen anual (2026-10-26)

Los endpoints y query keys year/month/branch no cambian. GET /accounting/reports/income-statement/branches/options ofrece years=[2026,2025,2024] y defaultYear=2026 en el servidor verificado. GET /accounting/reports/income-statement/branches?year=2025&month=8&branch=all lee tuvansa2025; 2026 conserva tuvansa. El navegador nunca recibe credenciales ni selecciona nombres SQL. El selector shadcn existente consume esa lista. Archivos ausentes/incompatibles no se ofrecen y el servidor rechaza un año ajeno sin usar saldos del vigente.

### Inventario por familia a una fecha (2026-10-29)

Entrada global: Reportes → Reportes Financieros → Inventario por familia.
Ventas por familia permanece deshabilitado, pendiente de definición.
Detalle: [Inventario por familia](inventario-por-familia.md).

| Vista / control | Evento | Endpoint relativo a /api | Query key / archivo |
| --- | --- | --- | --- |
| Inventario por familia | Abrir parámetros | GET /inventories/reports/by-family/options | inventories,reports,by-family,options |
| Inventario al / Almacén / Familia IFAMB / Vista previa | Reconstruir cantidades al corte | GET /inventories/reports/by-family?asOf=2026-09-30&warehouse=01&family=all | inventories,reports,by-family,{asOf,warehouse,family} |
| Detalle por producto | Cambiar presentación / paginar | Sin HTTP adicional | inventory-by-family-document.tsx |
| Excel / PDF | Exportar respuesta vigente | Sin HTTP adicional | inventory-by-family-workbook.ts / impresión |

SQL derivado en backend sobre FAXINV/FDOC/FINV/FFAM/FUNIDAD. AICANT firmado,
historia completa de la base configurada, fecha inclusiva y totales por UM.
Movimientos sin fecha se señalan como provisionales y no se añaden al saldo fechado.
El resumen expresa metros estimados: TR/PZ × 6.40, M × 1 y FT × 0.3048. La API
agrega meters/meterColumns/meterTotals/unconverted y conversiones por producto y
familia, sin cambiar parámetros ni SQL. Matriz de una fila por familia con
porcentajes y total general del corte elegido. El detalle conserva las UM
originales; no se elige una lista de costos ni se mezclan unidades sin equivalencia.

### Inventario: resguardos, valuación y pendientes (2026-10-30)

La actualización sustituye la presentación exclusivamente en metros. La misma
ruta acepta `scope=branch|warehouse` (predeterminado branch) e
`includeUndated=true|false` (predeterminado false). Ambos forman parte de la
query key y del bloqueo de exportación obsoleta. La sucursal incorpora sus
resguardos mediante FALMCAT.CATMULTICIA; el detalle conserva el almacén original.

Mostrar valor/metros no emite HTTP. El valor usa FINV.ILISTA4 actual en UM original,
no costo histórico confirmado. Incluir sin fecha es un escenario estimado
explícito. Ver pendientes de fecha filtra el detalle; Excel agrega la hoja
Pendientes de conciliar con entradas, salidas, saldo e importe sin fecha.
SQL derivado; no hay captura nueva de OMNIS ni escritura a la base.

### Inventario: costo de cada movimiento (2026-10-30)

Mostrar inicia en Costo histórico de movimientos. Usa historical/historicalTotals
e historicalByWarehouse del mismo GET, sin parámetros HTTP nuevos. El cálculo
backend suma AICANT × AICOSTO por movimiento. Costo actual ILISTA4 y metros son
opciones de comparación sin lecturas adicionales. Detalle y Excel agregan
entradas/salidas a su costo, netos por escenario, revaluaciones aparte y conteos
de costo cero/ausente. Excel incluye Costos históricos. No se certifica aún el
saldo contable conciliado ni se sustituye un costo faltante por el actual.
