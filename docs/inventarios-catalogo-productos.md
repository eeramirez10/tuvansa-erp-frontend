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

Los botones de Acciones, Compras/Prod y Consultas abren un diálogo reutilizable. La respuesta se representa en una tabla dinámica porque los campos cambian según la consulta; el diálogo conserva el nombre visible real del botón.

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
