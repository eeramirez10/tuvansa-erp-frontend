# Cuentas por cobrar: Catálogo de clientes

## Alcance

La ruta `/cuentas-por-cobrar/clientes/:clientId?` reproduce la pantalla
**Cuentas por cobrar > Catálogo de clientes** de OMNIS. Comparte con Inventarios
PT la navegación superior, la tarjeta contextual del módulo, la barra de
mantenimiento, la densidad tipográfica y el componente de ventanas de datos.

Esta versión de Tuvansa no incluye fotografías de clientes. Por esa razón el
botón **Foto**, su modal y cualquier indicador relacionado se omiten
deliberadamente del frontend.

## Ficha principal

La ficha consume `GET /accounts-receivable/clients/:clientId` y presenta las
secciones visibles de OMNIS:

- **Catálogo de clientes:** identificación, domicilio, contacto y datos fiscales.
- **Condiciones:** lista, descuentos, plazo, crédito, revisión, pagos y cuenta contable.
- **Acumulados:** plazo real, últimas operaciones, saldos, crédito disponible y ventas.

La tarjeta superior cambia a **Clientes · CXC** y utiliza el color azul de
Cuentas x Cobrar. El indicador `Eventos *` se muestra cuando la API devuelve
`indicators.hasEvents=true`.

## Barra de navegación y mantenimiento

| Control | Operación | Endpoint |
| --- | --- | --- |
| Flecha izquierda | Cliente anterior | `GET /accounts-receivable/clients/:clientId/previous` |
| Lupa | Encuentra cliente | `GET /accounts-receivable/clients?q=...&status=all` |
| Flecha derecha | Cliente siguiente | `GET /accounts-receivable/clients/:clientId/next` |
| Papel nuevo | Alta | `POST /accounts-receivable/clients` |
| Papel/eliminar | Baja | `DELETE /accounts-receivable/clients/:clientId` |
| Papel con lápiz | Cambio | `PATCH /accounts-receivable/clients/:clientId` |

**Encuentra cliente** permite buscar por Cliente, Razón social o R.F.C. y
muestra las tres columnas en la lista de resultados. Alta y Cambio utilizan
React Hook Form, Zod y los mismos grupos de datos de la ficha. La baja conserva
la confirmación y presenta el error de relaciones que devuelva la API.

## Acciones

| Botón visible | Endpoint | Contenido del modal |
| --- | --- | --- |
| Clasificar | `GET /accounts-receivable/clients/:clientId/actions/classifications` | Nueve clasificaciones y opciones disponibles de agente |
| Enviar a | `GET /accounts-receivable/clients/:clientId/actions/destinations` | Estado no disponible y razón confirmada por la captura |
| Bloquear | `GET /accounts-receivable/clients/:clientId/actions/block-status` | Estado actual y evento de bloqueo |
| Descuentos | `GET /accounts-receivable/clients/:clientId/actions/discounts` | Descuentos, vigencia y rangos |
| Eventos * | `GET /accounts-receivable/clients/:clientId/actions/events` | Eventos, seguimiento y responsables |
| Sucursales | `GET /accounts-receivable/clients/:clientId/actions/branches` | Código y nombre de sucursal |
| Contactos | `GET /accounts-receivable/clients/:clientId/actions/contacts` | Contacto, puesto, teléfonos y preferencias |

## Consultas

| Botón visible | Endpoint |
| --- | --- |
| Saldo | `GET /accounts-receivable/clients/:clientId/balance` |
| Movimientos | `GET /accounts-receivable/clients/:clientId/movements` |
| Facturas | `GET /accounts-receivable/clients/:clientId/invoices` |
| Pedidos | `GET /accounts-receivable/clients/:clientId/orders` |
| Productos pedidos | `GET /accounts-receivable/clients/:clientId/products/ordered` |
| Productos cotizados | `GET /accounts-receivable/clients/:clientId/products/quoted` |
| Productos vendidos | `GET /accounts-receivable/clients/:clientId/products/sold` |
| Ventas desglosadas | `GET /accounts-receivable/clients/:clientId/products/sold-detail` |
| Ventas anuales | `GET /accounts-receivable/clients/:clientId/sales/annual` |
| Ventas anuales resumen | `GET /accounts-receivable/clients/:clientId/sales/annual-summary` |
| Ventas por sucursal | `GET /accounts-receivable/clients/:clientId/sales/by-branch` |
| Ventas E.D.I. | `GET /accounts-receivable/clients/:clientId/sales/edi` |
| W.I.P. | `GET /accounts-receivable/clients/:clientId/work-in-progress` |
| CT · Productos pedidos | `GET /accounts-receivable/clients/:clientId/ct/products/ordered` |
| CT · Productos vendidos | `GET /accounts-receivable/clients/:clientId/ct/products/sold` |
| CT · W.I.P. | `GET /accounts-receivable/clients/:clientId/ct/work-in-progress` |

Todas las ventanas utilizan `ErpDataDialog`, conservan encabezado con cliente,
razón social y saldo, y permiten desplazamiento horizontal y vertical. Saldo y
Movimientos muestran sus totales debajo de la tabla. Los botones internos se
mantienen visuales; por ahora no agregan operaciones que la API no publique.

## Validación

La integración se comprobó con el cliente `000001` (`CLISEQ=15331`). Se
validaron respuestas reales para cada endpoint; además se revisaron visualmente
la ficha, Encuentra cliente, Saldo y Clasificar. Los importes pueden diferir de
la base antigua de OMNIS porque el frontend consume la base de desarrollo actual.
