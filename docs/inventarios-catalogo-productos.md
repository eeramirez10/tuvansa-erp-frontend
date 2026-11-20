# Inventarios PT: catálogo de productos

Trazabilidad de la pantalla heredada de OMNIS/PROSCAI con la ruta web `/inventarios/productos/:productId`. Todos los endpoints son relativos a `VITE_API_BASE_URL` y reciben el identificador interno del producto en `:productId`.

## Vista y barra de navegación

| Control visible | Operación | Endpoint | Implementación frontend |
| --- | --- | --- | --- |
| Abrir Inventarios P.T. | Cargar el primer producto activo | `GET /inventories/products?status=active&page=1&pageSize=1` | Loader de `inventory-products-route.tsx` |
| Catálogo de productos | Leer el detalle completo | `GET /inventories/products/:productId` | `product-service.ts` |
| Flecha izquierda / Producto anterior | Navegar al registro anterior | `GET /inventories/products/:productId/previous` | `product-toolbar.tsx` |
| Buscador / Buscar producto | Buscar por código o descripción | `GET /inventories/products?q=:texto&status=active&page=:page&pageSize=25` | `product-search-dialog.tsx` |
| Flecha derecha / Producto siguiente | Navegar al registro siguiente | `GET /inventories/products/:productId/next` | `product-toolbar.tsx` |
| Papel / Nuevo producto | Crear un registro | `POST /inventories/products` | `product-form-dialog.tsx` |
| Papel marcado / Eliminar producto | Eliminar o dar de baja el registro | `DELETE /inventories/products/:productId` | `product-catalog-page.tsx` |
| Papel y lápiz / Editar producto | Modificar el registro | `PATCH /inventories/products/:productId` | `product-form-dialog.tsx` |

La URL conserva el producto seleccionado para que navegación, recarga y enlaces directos muestren el mismo registro. Las consultas de detalle usan la clave `['inventories', 'products', 'detail', productId]`; búsqueda y paneles incluyen sus filtros o la clave visible del botón.

## Acciones

| Botón visible en OMNIS | Método y endpoint |
| --- | --- |
| Almacenes | `GET /inventories/products/:productId/actions/warehouses` |
| Alta CT | `GET /inventories/products/:productId/actions/color-size-registration` |
| Bloquear | `GET /inventories/products/:productId/actions/block-status` |
| Clasificar | `GET /inventories/products/:productId/actions/classifications` |
| Descr. ext. | `GET /inventories/products/:productId/actions/extended-description` |
| % Descuentos clis | `GET /inventories/products/:productId/actions/discounts/customers` |
| % Descuentos prv | `GET /inventories/products/:productId/actions/discounts/suppliers` |
| Otros | `GET /inventories/products/:productId/actions/other-data` |
| Especificaciones | `GET /inventories/products/:productId/actions/specifications` |
| Foto | `GET /inventories/products/:productId/actions/photo` |
| Inv. CT | `GET /inventories/products/:productId/actions/ct-inventory` |
| Precios | `GET /inventories/products/:productId/actions/prices` |
| SKUs | `GET /inventories/products/:productId/actions/skus` |
| Prepacks | `GET /inventories/products/:productId/actions/prepacks` |

## Compras/Prod

| Botón visible en OMNIS | Método y endpoint |
| --- | --- |
| Alternos | `GET /inventories/products/:productId/purchases-production/alternates` |
| Componentes | `GET /inventories/products/:productId/purchases-production/components` |
| Especific. Cal | `GET /inventories/products/:productId/purchases-production/quality-specifications` |
| Implosión | `GET /inventories/products/:productId/purchases-production/implosion` |
| Lotes | `GET /inventories/products/:productId/purchases-production/lots` |
| UEPS / PEPS | `GET /inventories/products/:productId/purchases-production/inventory-layers` |

## Consultas

| Botón visible en OMNIS | Método y endpoint |
| --- | --- |
| Auxiliar | `GET /inventories/products/:productId/queries/ledger` |
| Pedidos por cliente | `GET /inventories/products/:productId/queries/customer-orders` |
| Pedidos por cliente · * | `GET /inventories/products/:productId/queries/customer-orders/star` |
| Pedidos por cliente · CT | `GET /inventories/products/:productId/queries/customer-orders/ct` |
| Cotizaciones por cliente | `GET /inventories/products/:productId/queries/customer-quotes` |
| Ventas por cliente | `GET /inventories/products/:productId/queries/customer-sales` |
| Ventas por cliente · * | `GET /inventories/products/:productId/queries/customer-sales/star` |
| Ventas por cliente · CT | `GET /inventories/products/:productId/queries/customer-sales/ct` |
| Ventas desglosadas | `GET /inventories/products/:productId/queries/customer-sales/detail` |
| Ventas por sucursal | `GET /inventories/products/:productId/queries/sales/by-branch` |
| Ventas anuales | `GET /inventories/products/:productId/queries/sales/annual` |
| Ventas anuales resumen | `GET /inventories/products/:productId/queries/sales/annual-summary` |
| Ordenado a proveedor | `GET /inventories/products/:productId/queries/supplier-orders` |
| Ordenado a proveedor · CT | `GET /inventories/products/:productId/queries/supplier-orders/ct` |
| Cotizado a proveedores | `GET /inventories/products/:productId/queries/supplier-quotes` |
| Compras por proveedor | `GET /inventories/products/:productId/queries/supplier-purchases` |
| Compras por proveedor · DT | `GET /inventories/products/:productId/queries/supplier-purchases/dt` |
| Compras desglosadas | `GET /inventories/products/:productId/queries/supplier-purchases/detail` |
| Compras anuales | `GET /inventories/products/:productId/queries/purchases/annual` |
| Compras anuales resumen | `GET /inventories/products/:productId/queries/purchases/annual-summary` |
| Piezas | `GET /inventories/products/:productId/queries/pieces` |
| Piezas surtidas | `GET /inventories/products/:productId/queries/pieces/fulfilled` |
| W.I.P. | `GET /inventories/products/:productId/queries/work-in-progress` |
| W.I.P. · CT | `GET /inventories/products/:productId/queries/work-in-progress/ct` |
| E.D.I. | `GET /inventories/products/:productId/queries/edi` |
| Habilitaciones pendientes | `GET /inventories/products/:productId/queries/pending-enablements` |
| Documentos | `GET /inventories/products/:productId/queries/documents` |

Los botones de Acciones y Compras/Prod conservan el diálogo genérico. Todos los
botones de Consultas usan el marco `ErpDataDialog` de shadcn/Base UI y una vista
específica comparada contra OMNIS. Cada vista fija título, orden de columnas,
totales, botones internos y desplazamiento X/Y. Más abajo se documentan los
controles internos conectados y los que siguen pendientes.

### Modal Auxiliar

**Auxiliar** usa la ventana compartida de Inventarios y consulta
`GET /inventories/products/:productId/queries/ledger?page=:page&pageSize=500`.
Conserva las columnas `Fecha`, `Doc.`, `T.M.`, `Costo`, `Entradas`, `Salidas`,
`Stock`, `Alm`, `Lote`, `Usr` y `Reval` en el orden de Omnis 7.

**Cargar más movimientos** agrega el siguiente lote al final de la lista sin
reiniciar el saldo. Como en `EINV#10/239` de Omnis 7, el saldo comienza con
`Stock anterior` y suma la cantidad de cada movimiento en el orden recibido.
Un error al cargar el siguiente lote conserva los movimientos ya visibles y
permite reintentar. La tabla tiene desplazamiento X/Y dentro de la ventana,
que permite mover, redimensionar, minimizar, maximizar y restaurar.

**Filtrar almacen** conserva los movimientos del almacén de la fila
seleccionada. La primera fila se selecciona al abrir y se puede cambiar con
un clic o con las flechas del teclado. El saldo inicial que devuelve la API
resta la suma de los movimientos de la existencia actual de ese almacén.
Un valor vacío en `Alm` se envía como `warehouse=`.

**Filtrar XXX** conserva los movimientos tipo `R` y el saldo inicial vigente.
Si se pulsa antes de **Filtrar almacen**, la suma usada para calcular el saldo
inicial del almacén incluye sólo los movimientos tipo `R`. Ambos filtros se
aplican antes de paginar. Al cerrar y volver a abrir, se muestra el auxiliar
completo.

### Modal Pedidos por cliente

El botón `Pedidos por cliente` usa el mismo marco reutilizable del modal
Auxiliar y consume `GET
/inventories/products/:productId/queries/customer-orders?page=1&pageSize=500`.
La tabla replica el orden visible de OMNIS: `Código`, `Descripción`, `Fecha E.`,
`Núm.`, `Pedido`, `Surtido`, `Resta`, `Asignado` y `Num ellos`. Las tres
columnas finales sin encabezado visible muestran las piezas asignadas, el precio
y el factor.

**Filtrar pedidos surtidos** conserva las partidas con `PLSURT < PLCANT`,
como en `EINV#7/12` de Omnis 7. La API aplica el filtro antes de paginar
cuando recibe `excludeFulfilled=true`. Al cerrar y volver a abrir la ventana
se consulta la lista completa.

El pie muestra `Asignado` y `Total` de `data.customerOrdersTotals.assigned` y
`data.customerOrdersTotals.remaining`, calculados sobre toda la consulta
activa. `Disponible` es `Stock - Asignado`. `Faltante` es el mayor entre
`Total - Stock` y cero. `Stock` se toma de la ficha del producto.
**Cargar más pedidos** agrega la siguiente página y permite reintentar sin
perder los pedidos visibles. **Asignar** y **Traspasar** se muestran
deshabilitados mientras se valida su flujo en Omnis 7.

**Documento** abre la impresión del navegador con el código y la descripción
del producto. Como en `EINV#7/495`, el reporte muestra Código, Cliente,
Fecha E, Num, Pedido, Surtido y Resta, con los tres totales de cantidades al
pie. Antes de imprimir, consulta todas las páginas con el filtro activo y
conserva el orden de entrega. La impresión sólo incluye el reporte. Si falla
una página, se informa del error y se puede reintentar.

La tabla conserva desplazamiento permanente en ambos ejes. El ancho interno es
mayor que la ventana para revisar horizontalmente Precio y Factor, mientras el
eje vertical permite recorrer todos los pedidos sin aumentar el modal. Esta es
la regla base para las siguientes ventanas tabulares: antes de implementarlas se
revisan en OMNIS tanto el extremo derecho como el último registro.

### Modal Pedidos por *

El botón pequeño `*` abre `Pedidos por *` con la tabla vacía, como en
`EINV#7A/0` de Omnis 7. Los nueve botones seleccionan el clasificador
`CLIPAR1..9` con `GET /inventories/products/:productId/queries/customer-orders/star?classifier=:n`.
Las etiquetas de México son **AGENTE**, **GIRO O SECTOR**, **SUCURSAL**,
tres botones sin texto, **FLETE**, **ORIGEN** y **PROYECTO**.

La tabla de desplazamiento vertical presenta `Código`, `Nombre`, `Pedido#`,
`Fecha`, `Pedido`, `Surtido`, `Resta` y `Asignado`. Los cuatro primeros
encabezados ordenan toda la consulta en forma ascendente. Elegir un
clasificador vuelve al orden por fecha. Pedido, surtido y resta se muestran
como enteros truncados. Asignado lleva un asterisco cuando difiere de la resta.

El pie usa los agregados completos de la API para Asignado y Total. Por Asignar
es `Stock - Asignado` y Faltante es `Total - Stock`. La paginación conserva los
agregados de la consulta activa y permite reintentar sin perder filas.

### Modal Cotizaciones por cliente

**Cotizaciones por cliente** abre la ventana titulada **Pedidos por cliente**.
La tabla usa `GET /inventories/products/:productId/queries/customer-quotes`
y pagina en orden de entrega. **Filtrar pedidos surtidos** solicita
`excludeFulfilled=true` para conservar las partidas con `PLSURT < PLCANT`
según `EINV#47/13`. Al reabrir se muestra la lista completa.

**Total** es `data.customerOrdersTotals.remaining` para toda la lista de
cotizaciones, equivalente a la lista local `LLISTA` de Omnis 7. **Stock** toma
la existencia de la ficha. **Asignado**, **Disponible** y **Faltante** aparecen
con un guion. Omnis los deriva de la lista global `#L1` de pedidos, mientras
que esta consulta sirve la lista local `LLISTA`. **Asignar**, **Traspasar** y el
campo de destino se conservan deshabilitados.

### Modal Ventas por cliente

**Ventas por cliente** agrupa las ventas por código de cliente, como en
`EINV#6/240`. La tabla muestra Código, Cliente, Cantidad e Importe. Los
encabezados ordenan la consulta completa de forma ascendente y reproducen
`EINV#6/5–8`. Al abrir se usa Código. Los dos valores del pie proceden de
`data.customerSalesTotals` y abarcan todas las páginas. **Cargar más ventas**
mantiene los acumulados y permite reintentar la página si falla.

### Modal Ventas por *

El botón pequeño `*` junto a **Ventas por cliente** abre **Ventas por ***,
según `EINV#6BA`. La lista inicial está vacía hasta elegir uno de los nueve
clasificadores. La consulta agrupa por el código y nombre del clasificador
elegido. El encabezado de texto se muestra como **Nombre**. Al elegir un
clasificador, la consulta vuelve al orden ascendente por Código. La
paginación y los totales globales se comparten con **Ventas por cliente**.

### Modal Ventas por sucursal

**Ventas por sucursal** abre **Producto vendidos por sucursal** según
`EINV#30/240`. La consulta agrupa por sucursal y cliente. Muestra Suc.,
Código, Cliente, Cantidad e Importe. Se abre ordenada por Suc. y cada
encabezado ordena toda la consulta de forma ascendente. Los dos campos al
pie muestran los totales completos de Cantidad e Importe antes de paginar.

### Ventas anuales y Ventas anuales resumen

Las dos ventanas mantienen la matriz mensual de Omnis 7. **Ventas Anuales**
presenta cliente y año con los totales al inicio. **Ventas Anuales resumen
anual** presenta una fila por año, los totales al final de la tabla y la
gráfica. Los acumulados de los meses y el total general vienen de
`annualSalesDetails.totals`. **Desde** muestra la fecha que devuelve
`annualSalesDetails.fromDate` en formato día/mes/año cuando está configurada.
**Cargar más ventas** recorre las siguientes páginas con los mismos totales.

### Ordenado a proveedor

**Ordenado a proveedor** abre **Ordenado a proveedores**. La tabla muestra las
cantidades de Pedido, Surtido y Resta divididas por su factor y con cero
decimales. **Filtrar pedidos surtidos** conserva las partidas con
`PLSURT < PLCANT` según `EINV#12/4`. Al reabrir se muestra la lista completa.

**Por llegar** viene de `supplierOrdersTotals.remaining`, que suma las
cantidades base de toda la consulta. **Total** agrega el stock de la ficha.
**Cargar más pedidos** conserva ambos valores mientras se recorren las
páginas. **Coment** aparece deshabilitado.

### Modales restantes de Consultas

| Botón visible | Título observado en OMNIS | Presentación reproducida |
| --- | --- | --- |
| Pedidos por cliente · CT | Pedidos por cliente | Tabla de pedidos y panel CT lateral con filtros; totales y botones Pedido/Surtido/Resta/Filtrar Tipo |
| Ventas por cliente · CT | Ventas por cliente | Acumulado por cliente en Código, Descripción, Cantidad e Importe, con panel CT lateral |
| Ventas desglosadas | Compras por cliente | Detalle horizontal con documento, fecha, precios, tipo de cambio, descuento y O.C. El pie acumula la cantidad de toda la consulta. |
| Ordenado a proveedor · CT | Ordenado a proveedores | Tabla y panel CT lateral con totales y botones Pedido/Surtido/Resta |
| Cotizado a proveedores | Cotizado a proveedores | Pedido/surtido/resta y Stock/Por llegar/Total |
| Compras por proveedor | Compras por proveedor | Acumulado por proveedor con Cantidad e Importe |
| Compras por proveedor · DT | Historial de costos | Tres tablas: orden, componentes teórico/real y costos teórico/real |
| Compras desglosadas | Compras por proveedor | Detalle de documento, fecha, piezas, moneda e importe; botón Último |
| Compras anuales | Compras Anuales | Matriz proveedor/año por los doce meses y renglón Totales |
| Compras anuales resumen | Ventas Anuales resumen anual | Matriz año/mes y gráfica inferior, respetando el título heredado |
| Piezas | Piezas | Aviso `Esta version de OMNIS no contiene el modulo de PIEZAS` y botón OK |
| Piezas surtidas | Piezas (Surtidas) | Número, piezas, cantidad, almacén, referencias, fechas y botones Etiqueta/Devolución/Baja/Filtro |
| W.I.P. | W.I.P. | O.P., operación, solicitado, recibido, resta, tiempo, inicio y máquina |
| W.I.P. · CT | Ordenado a Proveedores | Tabla de producción y panel CT inferior con filtros |
| E.D.I. | Ventas anuales | Dos matrices mensuales: solicitado y surtido |
| Habilitaciones pendientes | Habilitaciones pendientes | Documento, necesario, surtido y resta con tres totales |
| Documentos | Consulta de movimientos de inventario | Cabecera de documento/cliente/fecha y detalle de entradas, salidas, U.M., costo, piezas y almacén |

Las consultas agregadas se calculan en MySQL antes de paginar para que cada
renglón coincida con la agrupación visible de OMNIS. El frontend solicita hasta
500 renglones por página. `Documentos` ahora consulta movimientos del producto
seleccionado; `Piezas` permanece intencionalmente no disponible porque así lo
declara esta versión del ERP.

## Modales de Acciones

Los 14 botones de **Acciones** usan el mismo marco compacto compartido de las
consultas, pero cada uno reproduce la distribución observada en OMNIS. Todos
consumen el endpoint GET indicado al inicio de este documento y conservan el
scroll X, Y o XY según la ventana original.

| Botón visible | Presentación reproducida |
| --- | --- |
| Almacenes | Tabla horizontal por almacén, fila TOTAL y controles inferiores |
| Alta CT | Aviso literal de Color y Talla no incluido |
| Bloquear | Confirmación No/Yes; Yes alterna el estado mediante PATCH |
| Clasificar | Selector doble con familias seleccionadas |
| Descr. ext. | Cuatro bloques de texto y Cambiar |
| % Descuentos clis/prv | Filtros, tabla de vigencias/cantidades y scroll XY |
| Otros | Formulario vertical por secciones de empaque, opciones, precios, importación y producción |
| Especificaciones | Lista vertical y Cambiar |
| Foto | Visor y modos Normal/Boceto/Boceto 2/Color/Completo |
| Inv. CT | Matriz por almacén y selector Stock/Pedido/Disponible/etc. |
| Precios | Costo, listas 1..13, moneda y plan POS |
| SKUs | Tabla L/SKU con Cancelar y Aceptar |
| Prepacks | Matriz horizontal con OK, Cancelar y Reparte |

Excepto el cierre, la selección de Bloquear y su PATCH, los botones internos
son visuales en esta etapa. Sus escrituras se conectarán cuando se capture cada
flujo de mantenimiento correspondiente.

`Yes` envía el PATCH de Bloquear y presenta cualquier error devuelto por la API.
La conexión legacy utilizada en la validación actual es de sólo lectura, así que
el cambio quedará operativo cuando se configure el repositorio escribible; la
interfaz y el contrato ya no requieren cambios para ello.

## Modales de Compras/Prod

Los seis botones de **Compras/Prod** usan el marco ERP compartido y presentan la
misma distribución compacta observada en OMNIS:

| Botón visible | Presentación reproducida |
| --- | --- |
| Alternos | Producto actual, alternos con código/descripción/stock/precio y navegación |
| Componentes | Lote, unidad, filtros, componentes, cantidad/importe, totales y comandos inferiores |
| Especific. Cal | Selector lateral y 15 pruebas con mínimo, máximo, unidad y observaciones |
| Implosión | Producto actual, productos padre, cantidad y porcentaje de costo |
| Lotes | Lotes disponibles a la izquierda y movimientos de inventario a la derecha |
| UEPS / PEPS | Capas con cantidad inicial, costo, advalorem, fecha, documento, lote, caducidad y llave |

El frontend pide hasta 500 registros por modal. En **Lotes**, la tabla derecha
reutiliza el endpoint de Auxiliar y separa cantidades positivas y negativas en
Entradas y Salidas. Los comandos internos son visuales por ahora; cerrar la
ventana sí funciona.

## Botón Buscar producto

El icono de lupa situado debajo de la tarjeta **Inventarios P.T.** abre la
ventana **Encuentra producto**, reproducida a partir de OMNIS. Incluye filtros
separados de Código, EAN y Descripción, lista vertical con código y descripción y los
botones visuales Familias, OK y Cancelar.

La búsqueda consulta `GET /inventories/products?q=...&status=all`; el backend
compara `q` contra `finv.ICOD`, `finv.IDESCR`, `finv.IEAN` y `finv.IUPC`. Selecciona
un renglón con clic, también permite abrirlo con doble clic y navega a la ficha
del producto al pulsar OK. La validación manual con `01300958` abrió
correctamente `ISEQ=13288`.

El campo EAN normaliza letras a mayúsculas y la API compara sin distinguir
mayúsculas/minúsculas. Se validó con el EAN alfanumérico `BAHF32X20` del
producto `01300067` (`ISEQ=12397`).
