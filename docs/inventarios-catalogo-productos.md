# Inventarios PT: catálogo de productos

Trazabilidad de la pantalla heredada de OMNIS/PROSCAI con la ruta web `/inventarios/productos/:productId`. Todos los endpoints son relativos a `VITE_API_URL` y reciben el identificador interno del producto en `:productId`.

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
totales, botones internos y desplazamiento X/Y; los botones internos siguen
siendo solamente visuales en esta etapa.

### Modal Auxiliar

El botón `Auxiliar` ya usa una vista específica comparada contra OMNIS, no la
tabla dinámica genérica. Consume `GET
/inventories/products/:productId/queries/ledger?page=1&pageSize=100` y presenta,
en este orden, `Fecha`, `Doc.`, `T.M.`, `Costo`, `Entradas`, `Salidas`, `Stock`,
`Alm`, `Lote`, `Usr` y `Reval`. La cantidad positiva o negativa se separa en
entradas y salidas; el stock se acumula desde el stock anterior del producto.

La ventana conserva `Stock anterior`, el renglón seleccionado y los botones
visibles `Filtrar almacen` y `Filtrar XXX`. Estos dos filtros y los controles
Minimizar/Maximizar son solamente visuales en esta etapa; Cerrar sí termina el
modal.

### Modal Pedidos por cliente

El botón `Pedidos por cliente` usa el mismo marco reutilizable del modal
Auxiliar y consume `GET
/inventories/products/:productId/queries/customer-orders?page=1&pageSize=100`.
La tabla replica el orden visible de OMNIS: `Código`, `Descripción`, `Fecha E.`,
`Núm.`, `Pedido`, `Surtido`, `Resta`, `Asignado` y `Núm ellos`; Precio y Factor
se conservan como las dos columnas finales sin encabezado visible.

El pie calcula y muestra `Asignado`, `Disponible`, `Stock`, `Total` y `Faltante`.
También conserva los botones `Filtrar pedidos surtidos`, `Asignar`, `Traspasar`
y Documento. En esta etapa los cuatro son solamente visuales.

La tabla conserva desplazamiento permanente en ambos ejes. El ancho interno es
mayor que la ventana para revisar horizontalmente Precio y Factor, mientras el
eje vertical permite recorrer todos los pedidos sin aumentar el modal. Esta es
la regla base para las siguientes ventanas tabulares: antes de implementarlas se
revisan en OMNIS tanto el extremo derecho como el último registro.

### Modal Pedidos por *

El botón pequeño `*` abre `Pedidos por *`. El resumen consume `GET
/inventories/products/:productId/queries/customer-orders/star` y los renglones
pendientes reutilizan `GET
/inventories/products/:productId/queries/customer-orders?page=1&pageSize=100`,
filtrando aquellos cuya resta sea mayor que cero.

La tabla presenta `Código`, `Nombre`, `Pedido#`, `Fecha`, `Pedido`, `Surtido`,
`Resta` y `Asignado`. El pie conserva `Asignado`, `Por Asignar`, `Stock`, `Total`
y `Faltante`, además de la matriz visual `AGENTE`, `GIRO O SECTOR`, `SUCURSAL`,
`FLETE`, `ORIGEN`, `PROYECTO` y sus espacios reservados. Los filtros todavía no
ejecutan acciones. Esta ventana usa desplazamiento vertical; el modal compartido
permite seleccionar X, Y o XY según la estructura observada en OMNIS.

### Modales restantes de Consultas

| Botón visible | Título observado en OMNIS | Presentación reproducida |
| --- | --- | --- |
| Pedidos por cliente · CT | Pedidos por cliente | Tabla de pedidos y panel CT lateral con filtros; totales y botones Pedido/Surtido/Resta/Filtrar Tipo |
| Cotizaciones por cliente | Pedidos por cliente | Tabla de cotizaciones, cinco acumulados y botones de filtro/asignación/traspaso |
| Ventas por cliente | Ventas por cliente | Acumulado por cliente con Cantidad e Importe |
| Ventas por cliente · * | Ventas por * | Acumulado por cliente y matriz AGENTE/GIRO/SUCURSAL/FLETE/ORIGEN/PROYECTO |
| Ventas por cliente · CT | Ventas por cliente | Acumulado por producto y panel CT lateral |
| Ventas desglosadas | Compras por cliente | Detalle horizontal con documento, fecha, precios, tipo de cambio, descuento y O.C. |
| Ventas por sucursal | Producto vendidos por sucursal | Acumulado por sucursal y cliente con totales |
| Ventas anuales | Ventas Anuales | Matriz cliente/año por los doce meses, renglón Totales y Documento |
| Ventas anuales resumen | Ventas Anuales resumen anual | Matriz año/mes y gráfica inferior |
| Ordenado a proveedor | Ordenado a proveedores | O.C., sucursal, unidad, pedido/surtido/resta, precio, fechas, almacén, observaciones y Stock/Por llegar/Total |
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
500 renglones por modal. `Documentos` ahora consulta movimientos del producto
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
