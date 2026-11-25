# Mapa de vistas, controles y endpoints

## Bancos · Alta, Cambio, Baja y traspasos

| Control | Evento | Método y endpoint relativo a `/api` | Query key / archivo |
| --- | --- | --- | --- |
| Alta | Habilitar captura en la ficha de Bancos y enfocar Código | GET `/treasury/bank-accounts/create` | `bankAccountKeys.form(null)` |
| Alta → OK | Guardar y abrir la nueva cuenta | POST `/treasury/bank-accounts` | `bank-account-service.ts` |
| Cambio | Habilitar la ficha de la cuenta abierta y enfocar Familia | GET `/treasury/bank-accounts/:bankAccountId/edit` | `bankAccountKeys.form(accountId)` |
| Cambio → OK | Guardar la cuenta | PATCH `/treasury/bank-accounts/:bankAccountId` | `bank-account-service.ts` |
| Baja | Consultar si la cuenta admite la baja y obtener su revisión | GET `/treasury/bank-accounts/:bankAccountId/edit` | `bankAccountKeys.form(accountId)` |
| Dar de baja | Confirmar la baja con la revisión consultada | DELETE `/treasury/bank-accounts/:bankAccountId` | `bank-account-removal-dialog.tsx` |
| Traspasos entre Cuentas | Consultar la cuenta de origen, las cuentas destino y el periodo | GET `/treasury/bank-accounts/:bankAccountId/actions/transfer/capture?direction=outgoing` | `bankAccountKeys.transfer(accountId)` |
| Traspasos → OK | Registrar Cheque o Traspas desde la cuenta abierta | POST `/treasury/bank-accounts/:bankAccountId/actions/transfer` | `bank-transfer-dialog.tsx` |

En Alta y Cambio, **Acciones** muestra **OK** y **Cancelar** en la misma ficha.
Las casillas de Control y las fiscales se capturan junto con el tipo de cuenta
y los consecutivos. Sub ctas, Movs y los saldos son de consulta. Cancelar o
pulsar Escape descarta la captura. El traspaso actualiza ambas cuentas y muestra
el folio y la póliza. El modo Cheque captura el número de la cuenta emisora y
la póliza enlazada muestra el mismo número.
Al confirmar **Baja**, el catálogo abre su primera cuenta disponible.

## Bancos · Presupuesto, clasificadores, revisión y gastos

| Control | Consulta / registro | Dato guardado |
| --- | --- | --- |
| Mayor → Iguales o Cambiar | GET y PATCH `/treasury/bank-accounts/:id/actions/general-ledger` | Revisión y doce importes del primer periodo |
| Mayor C.C. → Iguales o Cambiar | GET y PATCH `/treasury/bank-accounts/:id/actions/cost-center-ledger?costCenter=:code` | Presupuesto por centro configurado |
| Clasificar → Guardar Todos | GET y PATCH `/treasury/bank-accounts/:id/actions/classifiers` | Revisión y nueve valores del catálogo |
| Revisar → Registrar | GET y PATCH `/treasury/bank-accounts/:id/actions/authorization-review` | Guarda `*` para las partidas históricas y web seleccionadas. La póliza se abre desde su número |
| Revisar → A | PATCH `/treasury/bank-accounts/:id/actions/authorization-review` | Marca `+` para el traspaso o la quita |
| Revisar → Traspasa + | POST `/treasury/bank-accounts/:id/actions/authorization-review/transfer` | Elige destino y fecha contable, y abre la póliza aplicada desde el aviso de éxito |
| Gastos por prv. | GET `/treasury/bank-accounts/:id/actions/supplier-expenses` | Consulta Compras por proveedor y totales del auxiliar |
| Gastos por prv. → Pagar recepción | GET `/treasury/bank-accounts/:id/actions/supplier-expenses/capture`, POST `/treasury/bank-accounts/:id/actions/supplier-expenses` | Pago por cheque de la recepción seleccionada desde la cuenta abierta |
| Concilia Automático → Registra | GET `/treasury/bank-accounts/:id/actions/automatic-reconciliation?asOfDate=YYYY-MM-DD`, POST `/treasury/bank-accounts/:id/actions/reconciliation` | Partidas web emparejadas desde CSV o TSV y saldo de corte validado |

En **Concilia Automático**, **Liga** permite elegir una partida pendiente con
el mismo importe y signo cuando el archivo no tiene una coincidencia única.

## Bancos · Auxiliar y pólizas

En **Auxiliar**, **Pagos**, **Depósitos** y **Aux. no aplicados**, selecciona un
movimiento para consultar el concepto de su póliza o preparar el documento.

| Control | Evento | Método y endpoint relativo a `/api` | Query key / archivo |
| --- | --- | --- | --- |
| Comentarios | Mostrar el concepto y los datos de la póliza | GET `/accounting/policies/:policyId` | `bank-auxiliary-panel.tsx` |
| Imprimir Póliza | Abrir la impresión del navegador con las partidas y totales | GET en la misma ruta | `bank-policy-print.ts` |
| Folio / Ver póliza | Abrir el detalle contable | GET en la misma ruta | `/contabilidad/polizas/:policyId` |
| Aux. no aplicados → Aplicar | Confirmar una póliza de diario web | POST `/accounting/policies/:id/actions/apply` | Actualiza la ficha y los auxiliares bancarios |

En **Pagos**, el PP original conserva su marca **X** y su fecha de conciliación
al revertirse. El movimiento **RP** queda pendiente para el siguiente corte.

## Bancos · Conciliar

**Bancos → Conciliar** muestra los movimientos pendientes. La selección de
movimientos habilitados calcula **Suma sel.** como cargos menos abonos y suma
ese importe al saldo bancario actual para mostrar el saldo proyectado.

| Control | Evento | Método y endpoint relativo a `/api` | Query key / archivo |
| --- | --- | --- | --- |
| Conciliar | Consultar pendientes y saldo bancario actual | GET `/treasury/bank-accounts/:bankAccountId/actions/reconciliation` | `bankAccountKeys.panel(accountId, "reconciliation")` |
| Sel. | Cambiar movimientos seleccionados y saldo proyectado | Borrador local | `bank-reconciliation-dialog.tsx` |
| Tránsito | Marcar o desmarcar la partida resaltada | PATCH `/treasury/bank-accounts/:bankAccountId/actions/reconciliation/transit` | `bank-account-service.ts` |
| Filtra tránsito | Mostrar sólo filas con asterisco en T | Filtro local sobre la consulta de Conciliar | `bank-reconciliation-dialog.tsx` |
| Registrar | Guardar la conciliación cotejada con el estado de cuenta | POST en la misma ruta | `bank-account-service.ts` |
| Actualizar pendientes | Recargar la consulta tras un conflicto | GET en la misma ruta | `bank-reconciliation-dialog.tsx` |
| Cancelar / Escape | Descartar la selección | Sin petición de escritura | `bank-reconciliation-dialog.tsx` |

**Registrar** envía los movimientos seleccionados, la fecha, el saldo del estado
de cuenta, el saldo bancario consultado y una clave de solicitud que se conserva
al reintentar. El saldo capturado debe coincidir al centavo con el proyectado.
El resultado actualiza Bancos y las consultas de Contabilidad.
**Auxiliar**, **Pagos** y **Depósitos** muestran **Fecha conc.** cuando la
consulta devuelve una fecha de conciliación.

La marca cambia **Saldo tránsito** en **Conciliar** y en la ficha bancaria.
Las partidas marcadas se excluyen de la selección de corte y de **Concilia
Automático**. Al quitar la marca, las partidas web pendientes vuelven a
estar disponibles para registrar un corte.

## Cuentas por cobrar · Alta, Cambio, Baja y Bloquear clientes

| Control | Evento | Método y endpoint relativo a `/api` | Resultado |
| --- | --- | --- | --- |
| Alta de clientes | Capturar en la ficha y pulsar OK | POST `/accounts-receivable/clients` | Usa los valores iniciales de lista y cuenta contable y abre la ficha guardada |
| Cambio al cliente actual | Editar en la ficha y pulsar OK | PATCH `/accounts-receivable/clients/:id` | Envía solo los campos modificados, con objetos parciales para dirección, contacto, fiscal y condiciones |
| Baja de cliente | Confirmar la baja | DELETE `/accounts-receivable/clients/:id` | La API comprueba relaciones. La confirmación conserva el mensaje si la baja se bloquea |
| Bloquear | Consultar estado del cliente y evento | GET `/accounts-receivable/clients/:id/actions/block-status` | Presenta el motivo registrado cuando el cliente ya está bloqueado |
| Bloquear o Desbloquear | Capturar motivo y confirmar el cambio | PATCH `/accounts-receivable/clients/:id/actions/block-status` con `{blocked,reason,confirmed:true}` | Actualiza la ficha y el historial de eventos |

## Cuentas por cobrar · Saldo y Cobrar

En **Clientes → Saldo**, **Cobrar** aparece en las remisiones web FAW con
saldo positivo. La consulta prepara un depósito total o parcial con cuenta
bancaria, fecha, importe, referencia bancaria y concepto.

| Control | Evento | Método y endpoint relativo a `/api` | Query key / archivo |
| --- | --- | --- | --- |
| Saldo / Movimientos → Anterior, Siguiente, Última | Consultar otra página | GET `/accounts-receivable/clients/:clientId/balance` o `/movements` con `page` y `pageSize` | `clientKeys.panel`, página |
| Cobrar | Consultar saldo y cuentas para una remisión | GET `/accounts-receivable/clients/:clientId/collections/:remissionId` | `clientKeys.collection` |
| OK | Registrar el depósito | POST en la misma ruta | `client-collection-dialog.tsx` |
| Cancelar / Escape | Cerrar la captura | Sin petición de escritura | `client-collection-dialog.tsx` |
| Bancos → Depósitos | Consultar los depósitos de la cuenta | GET `/treasury/bank-accounts/:bankAccountId/actions/deposits` | `bank-panel-dialog.tsx` |
| Facturación → Auxiliar | Consultar el cargo y los abonos de la remisión | GET `/sales/invoices/:invoiceId/actions/auxiliary` | `invoice-panel-dialog.tsx` |
| Clientes → Movimientos / Bancos → Depósitos → Revertir PA | Seleccionar un cobro web PA, consultar su estado y confirmar la reversión | GET y POST `/accounts-receivable/clients/:clientId/collections/:collectionId/reversal` | `client-collection-reversal-dialog.tsx` |
| Cobro registrado → Ver póliza / Póliza en Movimientos, Depósitos o Auxiliar | Abrir la póliza de ingresos | GET `/accounting/policies/:policyId` | `/contabilidad/polizas/:policyId` |

Al registrar el depósito se actualizan Clientes, Facturación, Bancos y
Contabilidad. El aviso muestra el folio del cobro, el recibo y la póliza de
ingresos.

La reversión del cobro muestra el motivo si está bloqueada, pide fecha, motivo
y confirmación y abre el enlace a la póliza generada. **Ver reversión** vuelve a
mostrar el resultado en el cobro original. Clientes, Facturación, Bancos y
Contabilidad se actualizan al registrar el movimiento.

Para un PA conciliado, la consulta muestra la fecha de la conciliación original,
la fecha mínima de reversión y el efecto bancario. La confirmación envía
`expectedReconciliationId`. La contrapartida aparece como movimiento pendiente
de conciliación.

## Cuentas por pagar · Alta, Cambio y Baja de proveedores

| Control | Evento | Método y endpoint relativo a `/api` | Resultado |
| --- | --- | --- | --- |
| Alta de proveedores | Abrir captura en la ficha | GET `/accounts-payable/suppliers/create` | Carga valores iniciales y disponibilidad |
| Alta / OK | Dar de alta el proveedor | POST `/accounts-payable/suppliers` | Envía `requestKey` y `fields`. Abre la ficha nueva |
| Cambio al proveedor actual | Abrir la ficha vigente | GET `/accounts-payable/suppliers/:id/edit` | Carga campos, revisión y disponibilidad de cambiar el código |
| Cambio / OK | Guardar el cambio | PATCH `/accounts-payable/suppliers/:id` | Envía `revision` y `fields`. Un conflicto de revisión conserva el borrador hasta recargar |
| Baja de proveedores | Verificar si puede darse de baja | GET `/accounts-payable/suppliers/:id/edit` | Muestra `deletionReason` o consulta la confirmación |
| Baja / Sí | Confirmar la baja | DELETE `/accounts-payable/suppliers/:id` | Envía `{revision,confirmed:true}` y vuelve al catálogo |

En Alta y Cambio, **Cancelar** descarta el borrador. Al salir de **Proveedor**,
la ficha comprueba coincidencias de código en el catálogo. Al confirmar, la
API valida el código y la cuenta contable según la configuración de la compañía.
La ficha actualiza los catálogos dependientes de Compras y Bancos.

## Cuentas por pagar · Saldo y Paga

**Paga** se habilita al seleccionar una recepción o un GA web con saldo pendiente en
**Proveedores → Saldo**. El equivalente en Omnis es **Programar pagos → Paga**
(`EPRV#25/98 → /120`).

| Control | Evento | Método y endpoint relativo a `/api` | Archivo |
| --- | --- | --- | --- |
| Paga | Consultar saldo, bancos y valores iniciales | GET `/accounts-payable/suppliers/:supplierId/payments/:receiptId` | `supplier-payment-dialog.tsx` |
| OK | Registrar pago completo o parcial de la recepción | POST en la misma ruta | `supplier-service.ts` |
| Cancelar / Escape | Cerrar la captura | Sin petición de escritura | `supplier-payment-dialog.tsx` |
| Movimientos / Revertir PP | Consultar y registrar la contrapartida de un PP web pendiente o conciliado | GET y POST `/accounts-payable/suppliers/:supplierId/payments/:paymentId/reversal` | `posting-reversal-dialog.tsx` |

**Bancos → Pagos → Revertir PP** usa las mismas rutas y abre la confirmación a partir del pago seleccionado.

Para un PP conciliado, la consulta muestra la fecha del corte original, la
fecha mínima de reversión y el efecto bancario. Al confirmar se envía
`expectedReconciliationId` para ese corte. Si la conciliación cambia durante
la captura, se vuelve a consultar y se pide confirmar otra vez.

La captura incluye cuenta bancaria, transferencia o cheque, importe, fecha y
concepto. El POST conserva la revisión de la consulta y la clave de solicitud en
los reintentos del mismo pago. Al guardar se actualizan Proveedores, Bancos,
Recepciones y Contabilidad.

## Órdenes de compra · Comentarios

**Comentarios** conserva la consulta `GET /purchasing/purchase-orders/:id/actions/comments`
y obtiene el borrador, revisión y capacidad de escritura por `GET /actions/comments/editor`
en la misma orden. **OK** guarda con `PATCH /actions/comments`. **Cancelar** y
Escape descartan el borrador. El importe con letra se deriva del guardado y
el historial de firmas se muestra aparte de la cuarta línea editable.

## Órdenes de compra · Cotiz y Gen %

**Cotiz** consulta `GET /purchasing/purchase-orders/:id/actions/quote-conversion`.
**OK** ejecuta `PATCH` en la misma ruta, con revisión, versión de origen y tipo
destino. **Cancelar** cierra la confirmación. Al guardar se actualizan la ficha,
el buscador y los acumulados de Inventarios. **Gen %** en TUVANSA muestra el
mensaje de Omnis y se cierra con **OK**.

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

### Remisión México desde Facturación

| Vista o control | Evento | Endpoint | Resultado |
|---|---|---|---|
| Facturación / Facturar | Cargar pedido autorizado y asignado | GET `/sales/invoices/from-order?orderNumber=:number` | Obtiene la revisión del pedido y el máximo que se puede remitir por partida |
| Facturación / Facturar / OK | Confirmar fecha y cantidades | POST `/sales/invoices/from-order` | Abre el folio FAW y actualiza las consultas de Facturación, Pedidos, Inventarios y Clientes |
| Facturación / Facturar / Cancelar | Cerrar | Ninguno | Descarta la selección |
| Facturación / Cancelar remisión | Consultar una remisión web FAW o una FA histórica habilitada | GET `/sales/invoices/:id/actions/cancel-remission` | Muestra la fecha, el cargo, el pedido de origen, si se puede regenerar y cualquier bloqueo |
| Facturación / Cancelar remisión / Confirmar | Registrar la cancelación | POST `/sales/invoices/:id/actions/cancel-remission` | Envía motivo, fecha, confirmación, UUID y la opción de regenerar el pedido. Actualiza Facturación, Pedidos, Inventarios y Clientes |
| Pedidos / Auxiliar | Abrir folio de la remisión | GET `/sales/orders/:id/actions/auxiliar` | Permite abrir el documento asociado en Facturación |
| Clientes / Saldo o Movimientos | Consultar el cliente | GET `/accounts-receivable/clients/:id/balance` o `/movements` | Incluye el cargo FA en el saldo del cliente |
| Facturación / Sellar | Abrir la ventana de una remisión web en pruebas | GET `/sales/invoices/:id/actions/seal` | Muestra el importe y la referencia de simulación si existe |
| Sellar / Simular timbrado | Ejecutar la prueba | POST `/sales/invoices/:id/actions/seal/simulation` | Muestra fecha y referencia `SIM-FE-…` con la leyenda **Sin validez fiscal** |
| Sellar / Cancelar | Cerrar antes de simular | Ninguno | Descarta la ventana |

El detalle habilita la cancelación de una FA histórica con
`cancellationAvailable: true`. **Ver cancelación** abre el resultado ya
registrado. La [guía de remisiones](ventas-facturacion-remisiones.md) describe
la confirmación y el pedido regenerado.

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
| Inventarios PT / MP | Catálogo de productos | Carga del catálogo | Abrir vista o elegir en el buscador | `GET /inventories/products/first`, `GET /inventories/products`, `GET /inventories/products/:productId` | `['inventories', 'products', ...]` | Ambos accesos usan la misma ficha. Alta está disponible desde el catálogo vacío |
| Inventarios PT / MP | Alta de productos | Nuevo producto | Habilitar la ficha, enfocar Código y cargar las unidades | `GET /inventories/products/create-options` | `productKeys.createOptions()` | Inicia con tipo M.P. y unidad UNO si está disponible. La API indica el motivo cuando el alta está bloqueada |
| Inventarios PT / MP | Alta y Cambio | Código | Validar el código al salir del campo y al confirmar | `GET /inventories/products/code-availability?code=:code` | `productKeys.codeAvailability(code)` | Un duplicado devuelve el foco al código. En Alta se limpia el código duplicado |
| Inventarios PT / MP | Alta de productos | OK / Cancelar | Crear el producto o descartar la captura | `POST /inventories/products` al confirmar | Invalida catálogo, reportes y buscadores dependientes y abre el producto creado | Cancelar descarta el borrador local |
| Inventarios PT / MP | Cambio de producto | Editar producto | Activar la ficha y cargar las unidades | `GET /inventories/products/:productId/edit-options` | `productKeys.editOptions(productId)` | El detalle indica la revisión y los campos habilitados, incluido Código cuando se puede cambiar |
| Inventarios PT / MP | Cambio de producto | OK / Cancelar | Confirmar o descartar la edición en la ficha | `PATCH /inventories/products/:productId` al confirmar cambios | Actualiza la ficha e invalida los datos dependientes | Envía la revisión y los campos modificados. Si la revisión cambió, conserva el borrador hasta que el usuario lo descarte o recargue |
| Inventarios PT / MP | Baja de producto | Papel marcado | Consultar restricciones y revisión | `GET /inventories/products/:productId/removal` | `productKeys.removal(productId)` | Muestra el motivo del bloqueo o la confirmación «¿Lo doy de baja?» |
| Inventarios PT / MP | Baja de producto | Sí, dar de baja | Confirmar la baja del producto | `DELETE /inventories/products/:productId` con `{code,revision}` | Abre el primer producto activo y actualiza el catálogo | Si el registro cambia, se vuelve a verificar y confirmar |
| Inventarios PT | Precios de Venta | `*` | Indicar una oferta vigente | `GET /inventories/products/:productId` | `['inventories', 'products', 'detail', productId]` | `prices.hasActiveOffer` |
| Inventarios PT | Acciones | Clasificar | Abrir Selección de parámetros | `GET /inventories/products/:productId/actions/classifications` | `['inventories', 'products', 'detail', productId, 'panel', 'classifications']` | Carga las familias, asignaciones y catálogos. La lista de opciones abre vacía hasta elegir una familia |
| Inventarios PT | Clasificar | Guardar | Clic después de pasar opciones | `PATCH /inventories/products/:productId/actions/classifications` | Actualiza la selección e invalida el detalle del producto | Envía cambios y revisión. La API habilita Guardar en productos preparados para escritura |
| Inventarios PT | Acciones | Otros | Abrir la ventana | `GET /inventories/products/:productId/actions/other-data` | `['inventories', 'products', 'detail', productId, 'panel', 'other-data']` | Carga las secciones de `EINV2#1`, sus valores y los campos habilitados |
| Inventarios PT | Otros | Cambio, OK, Cancelar | Editar, confirmar o descartar | `PATCH /inventories/products/:productId/actions/other-data` al confirmar | Actualiza Otros y vuelve a consultar la ficha del producto | Envía campos modificados y revisión en OK. Cambio y Cancelar trabajan sobre el borrador local |
| Inventarios PT | Consultas | Auxiliar | Abrir ventana o cargar más movimientos | `GET /inventories/products/:productId/queries/ledger?page=:page&pageSize=500` | `['inventories', 'products', 'detail', productId, 'panel', 'ledger', 'pages', filters]` | Lectura paginada con saldo acumulado |
| Inventarios PT | Compras/Prod | Lotes | Seleccionar un lote en la tabla izquierda | Mismo GET con `lotId` | Clave de Auxiliar con el lote seleccionado | Filtra el historial antes de paginar y devuelve el total neto del lote |
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
| Inventarios PT | Documentos | Búsqueda | Salir de un campo editado, Enter u OK | `GET /inventories/movements` con `document`, `date`, `reference`, `reference2`, `warehouse`, `supplier`, `customer`, `page` y `pageSize` | `['inventories', 'movements', 'search', filters, page]` | La ficha y el buscador abren vacíos |
| Inventarios PT | Documentos | Resultado de Búsqueda | Código exacto único, OK o doble clic en renglón | `GET /inventories/movements/:id` | `['inventories', 'movements', 'detail', id]` | Encabezado, partidas y totales del movimiento |
| Inventarios PT / MP | Documentos | Capturar movimiento | Abrir captura y cargar tipos EI/SI/TR según configuración, fecha y almacenes | `GET /inventories/movements/capture` | `movementKeys.capture()` | La consulta indica por qué se bloquea la captura |
| Inventarios PT / MP | Captura de movimientos | OK / Cancelar | Registrar entrada, salida o traspaso con productos activos y abrir su ficha | `POST /inventories/movements` | Actualiza búsquedas, existencias y reportes | Envía `requestKey`, tipo, fecha, almacén y partidas. TR agrega `destinationWarehouse`. Reintentar la misma captura conserva el UUID |
| Inventarios PT / MP | Documentos | Detalle de TR | Revisar origen, destino y partidas | `GET /inventories/movements/:id` | `movementKeys.detail(id)` | Un folio contiene una salida del origen y una entrada al destino por producto, incluido PEPS automático |
| Inventarios PT | Documentos | Cancelar | Clic y confirmación Sí | `DELETE /inventories/movements/:id` | Invalida movimientos y productos después del éxito | Disponible según `cancellationAvailable` de la ficha |

Para cancelar un TR debe quedar existencia libre suficiente en el almacén
destino. La reversión registra las dos cantidades inversas por almacén.

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


### Contabilidad · Pólizas de Diario

| Control | Evento | Método y endpoint relativo a `/api` |
| --- | --- | --- |
| Alta de póliza de diario | Cargar fecha, periodo, tipo 3 y centros de costo | GET `/accounting/policies/capture` |
| Código o Buscar cuenta | Buscar cuentas de captura por código o nombre | GET `/accounting/policies/capture/accounts?q=…` |
| Alta / OK | Registrar una póliza con cargos y abonos iguales | POST `/accounting/policies` |
| Duplicar | Consultar fecha y revisión de una póliza tipo 3 | GET `/accounting/policies/:id/actions/duplicate` |
| Duplicar / Confirmar | Guardar una copia aplicada y abrir su folio | POST `/accounting/policies/:id/actions/duplicate` |
| Comentarios | Cargar la cabecera y las seis líneas; verificar si se puede editar | GET `/accounting/policies/:id/actions/comments` |
| Comentarios / OK | Actualizar cabecera y notas de un diario web desaplicado con revisión y UUID | PATCH `/accounting/policies/:id/actions/comments` |
| Cambio, Aplicar, Des - Aplicar o Baja | Consultar permisos, revisión y motivo de restricción | GET `/accounting/policies/:id/actions/manual` |
| Cambio / OK | Guardar los datos de una póliza pendiente de aplicar | PATCH `/accounting/policies/:id` |
| Aplicar o Des - Aplicar | Confirmar la operación con revisión y UUID | POST `/accounting/policies/:id/actions/apply` o `/unapply` |
| Baja / Dar de baja | Confirmar la baja con revisión y UUID | DELETE `/accounting/policies/:id` |

La captura admite cuentas y centros de costo del catálogo en pesos. La póliza
dada de baja conserva sus renglones de auditoría. Las acciones de escritura
aparecen para las pólizas manuales de Diario y siguen las restricciones del
periodo contable y de conciliación devueltas por la API.

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

### Recepciones

La ruta web es `/recepciones/:purchaseReceptionId`. **Nueva recepción** abre el borrador por folio de una orden confirmada. **OK** registra las cantidades seleccionadas y navega a la ficha guardada. **Cancelar** descarta el borrador.

**Clasificar** usa GET y PATCH en `/purchasing/purchase-receptions/:id/actions/classifications`.
El GET trae los valores, rótulos, catálogos y revisión de los nueve clasificadores.
**Guardar** actualiza el detalle y refresca el flete en **Comentarios**.

Cuando una partida lleva PEPS, la ficha muestra su identificador en **Capa**.
El mismo identificador permite consultar el saldo y los movimientos en
**Inventarios → Lotes**. **Cancelar recepción** explica si falta saldo en la
capa de origen y actualiza los paneles al confirmar.

La ficha web muestra el número de pedimento capturado. **Pedimento** permite consultar
la fecha, la aduana, los incrementables y los cargos IMPORT históricos vinculados por folio.

Selecciona una partida de una recepción vigente para usar **Alta Piezas** o
**Edita pzas**. **Piezas** muestra las series enlazadas, permite filtrar por
el producto seleccionado y cambiar la serie de una fila. En **Inventarios →
Piezas surtidas**, la columna **Recepción** muestra el folio.

Al guardar la primera recepción de una orden con piezas, **Piezas** muestra
las series trasladadas desde la orden. La recepción puede ser parcial. El
traspaso conserva la identidad de cada pieza y la entrada usa la cantidad
confirmada en la captura.

| Vista o botón | Endpoint relativo a `/api/purchasing/purchase-receptions` |
| --- | --- |
| Nueva recepción / Buscar orden | `GET /create?orderNumber=…` |
| Nueva recepción / OK | `POST /` |
| Nueva recepción / Capturar datos de importación | `GET /create` habilita la captura por `pedimentoAvailable`. `POST /` acepta `pedimento` con número, fecha, aduana e incrementables |
| Gastos múltiples | `GET /general-expenses/create` |
| Código proveedor / gasto | `GET /general-expenses/catalog?supplierCode=…&productCode=…` |
| Gastos múltiples / OK | `POST /general-expenses` |
| Cancelar GA | `GET y POST /:id/actions/cancel-expense` |
| Cancelar recepción RW o RA histórica habilitada | `GET y POST /:id/actions/cancel-reception` |
| Ficha y partidas | `GET /:purchaseReceptionId` |
| Auxiliar | `GET /:purchaseReceptionId/actions/auxiliary` |
| Cambia Prv / Confirmar | `GET /:purchaseReceptionId/actions/change-supplier` |
| Cambia Prv / Buscar proveedor | `GET /:purchaseReceptionId/actions/change-supplier/suppliers?code=…&name=…` |
| Cambia Prv / OK | `PATCH /:purchaseReceptionId/actions/change-supplier` |
| Etiquetas | `GET /:purchaseReceptionId/actions/labels` |
| Comentarios / Abrir y OK | `GET/PATCH /:purchaseReceptionId/actions/comments` |
| Documenta / Abrir y OK | `GET/POST /:purchaseReceptionId/actions/document` |
| Pedimento | `GET /:purchaseReceptionId/actions/pedimento` |
| Reporte pedimento | `GET /:purchaseReceptionId/actions/pedimento-report` |
| Piezas | `GET /:purchaseReceptionId/actions/pieces` |
| Alta Piezas / Edita pzas | `GET, POST y PATCH /:purchaseReceptionId/actions/pieces/lines/:lineId` |
| Cambiar serie | `PATCH /:purchaseReceptionId/actions/pieces/:pieceId/serial` |

**Comentarios** actualiza la ficha. **Documenta** reparte el cargo original en
hasta cuatro folios con importes cuya suma coincide con el total. Al confirmar,
el auxiliar muestra el abono DO y los folios se muestran en **Proveedores → Saldo**.

**Etiquetas** abre la vista previa con los formatos configurados y toma las
copias de la cantidad facturada. **Mayús** limita las etiquetas a la partida
seleccionada. **Imprimir** usa la impresión del navegador.

**Reporte pedimento** abre la vista previa del pedimento, sus gastos,
IVA y partidas con prorrateo. El botón **Imprimir** de la vista previa
abre la impresión del navegador.

**Cambia Prv** pide confirmación y precarga el proveedor actual. El selector
busca por código o nombre y **OK** actualiza la ficha, Cuentas por Pagar y
los documentos de Inventarios.

**Gastos múltiples** permite capturar partidas por proveedor y referencia,
IVA, retenciones y centro de costo. La confirmación enlaza los documentos
guardados, el proveedor y la póliza aplicada. Los documentos aparecen en
la búsqueda de Recepciones y en **Proveedores → Saldo** para registrar un PP.

La ficha de una RA histórica muestra **Cancelar recepción** cuando el detalle
devuelve `cancellationAvailable: true`. El GET de la acción valida el saldo,
los pagos y las demás restricciones, y muestra el motivo cuando bloquea la
operación. El POST registra fecha, motivo y confirmación con una clave de
reintento. **Ver cancelación** conserva la consulta de la fecha, el motivo y la
póliza asociada. Al confirmar se actualizan Recepciones, Órdenes de compra,
Inventarios, Proveedores, Bancos y Contabilidad. El movimiento K de una RA
histórica enlaza la póliza inversa desde **Proveedores → Movimientos**.

### Órdenes de compra

La ruta web es `/ordenes-compra/:purchaseOrderId`. El resultado del buscador se usa para elegir un ID. La ficha carga su detalle con partidas. Las respuestas de las flechas ya incluyen las partidas.

| Vista o botón | Endpoint relativo a `/api/purchasing/purchase-orders` |
| --- | --- |
| Buscar | `GET /` |
| Ficha, partidas y totales | `GET /:purchaseOrderId` |
| Anterior y siguiente | `GET /:purchaseOrderId/previous`, `GET /:purchaseOrderId/next` |
| Auxiliar | `GET /:purchaseOrderId/actions/auxiliar` |
| Clasificar / abrir | `GET /:purchaseOrderId/actions/classifications` |
| Clasificar / Guardar | `PATCH /:purchaseOrderId/actions/classifications` |
| Comentarios | `GET /:purchaseOrderId/actions/comments` |
| CT | `GET /:purchaseOrderId/actions/ct` |
| CT / Cambio | `GET /:purchaseOrderId/actions/ct/editor`, `PATCH /:purchaseOrderId/actions/ct` |
| Div. Sucursal y Sucursal | `GET/POST /:purchaseOrderId/actions/branches` |
| Duplicar | `GET/POST /:purchaseOrderId/actions/duplicate` |
| Split | `GET/POST /:purchaseOrderId/actions/split` |
| Alta Piezas | `GET /:purchaseOrderId/actions/pieces/editor`, `PATCH /:purchaseOrderId/actions/pieces` |
| Alta Piezas / Importar TSV | `PATCH /:purchaseOrderId/actions/pieces/import` |
| Piezas | `GET /:purchaseOrderId/actions/pieces` |
| Piezas / Confirmar | `GET/PATCH /:purchaseOrderId/actions/pieces/confirmation` |
| Etiquetas | `GET /:purchaseOrderId/actions/labels` |
| Imprimir | `GET /:purchaseOrderId/actions/print` |
| Imprimir Conf. | `GET /:purchaseOrderId/actions/print-confirmation` |
| Confirmar todo / validar | `GET /:purchaseOrderId/actions/confirmation` |
| Confirmar todo o desconfirmar / Sí | `PATCH /:purchaseOrderId/actions/confirmation` |
| Autorizar / consultar O.K. A–F | `GET /:purchaseOrderId/actions/authorization` |
| O.K. A–F / autorizar o revertir | `PATCH /:purchaseOrderId/actions/authorization` |
| Autoriza O.C. / Cambia proveedor / Buscar | `GET /authorization/suppliers?code=…&name=…` |
| Autoriza O.C. / Cambia proveedor / OK | `PATCH /:purchaseOrderId/actions/authorization/supplier` |
| Acciones / Cambia Prv | `GET /:purchaseOrderId/actions/change-supplier` |
| Acciones / Cambia Prv / OK | `PATCH /:purchaseOrderId/actions/change-supplier` |

**Confirmar todo** pide confirmación antes de asignar el saldo pendiente. **Shift + clic** o **Desconfirmar todo** dentro del diálogo permiten retirar las asignaciones. El servidor valida la revisión. Al terminar se refrescan las partidas y **Asignado**, los paneles de la orden e Inventarios.

**Autorizar** abre **Autoriza O.C.** con los niveles **O.K. A–F**. Se firma con la clave personal de Compras. **Shift + clic** o **Desautorizar** revierten un nivel. La clave se envía en el encabezado `Authorization` y se vacía del formulario al firmar. La operación actualiza **Autorización** de la ficha y su historial en **Comentarios**.

**Cambia proveedor** se habilita en estado `9A` con proveedor `COMPRA` y con el permiso configurado. Abre una ventana con captura por código y un buscador separado por código o nombre. **OK** guarda con la clave personal de Compras y actualiza el proveedor de la ficha y las consultas dependientes.

**Cambia Prv** en Acciones usa el mismo selector y su propio permiso. La ventana precarga el proveedor actual y permite varios cambios consecutivos con revisiones actualizadas. Al guardar actualiza la ficha, el buscador, Comentarios e Inventarios.

Clasificar envía los nueve valores y la revisión de la ventana. El backend indica si puede guardar en PostgreSQL. Al guardar se actualizan la ficha, la consulta de clasificación y los resultados del buscador.

Comentarios reproduce la distribución de `EOC#6` de Omnis 7. Usa las etiquetas del tipo de movimiento para las cuatro líneas y el texto largo. El número del proveedor aparece en Número ellos y Pedido cliente, como en el formato nativo. OK guarda el borrador y Cancelar lo descarta.

| Editor de órdenes de compra | Endpoint relativo a `/api/purchasing/purchase-orders` |
| --- | --- |
| Lápiz / Cambio de orden de compra | `GET /:purchaseOrderId/edit` |
| Producto / Validar código / Buscar producto | `GET /:purchaseOrderId/edit/products?q=...` |
| OK y respuesta al aviso de cantidad cero | `PATCH /:purchaseOrderId` |

El editor mantiene un borrador de partidas. Tab desde **Pzas.** en la última partida abre la siguiente. Cancelar descarta el borrador. OK pregunta si debe retirar partidas existentes de cantidad cero antes de guardar. Al guardar se actualiza la ficha y se invalidan los paneles vinculados a la orden y el catálogo de Inventarios.

| Baja de órdenes de compra | Endpoint relativo a `/api/purchasing/purchase-orders` |
| --- | --- |
| Papelera / validar y abrir confirmación | `GET /:purchaseOrderId/removal` |
| Baja de orden de compra / Sí | `DELETE /:purchaseOrderId` |

**No** cierra la confirmación. **Sí** envía el folio, la revisión y la versión validados por la API. Al confirmar se cierran las ventanas de la orden, se actualizan las búsquedas y se abre la orden disponible siguiente.

| Alta de órdenes de compra | Endpoint relativo a `/api/purchasing/purchase-orders` |
| --- | --- |
| Hoja / Nueva orden de compra / Almacén | `GET /create` |
| Buscar proveedor | `GET /create/suppliers?q=...` |
| Buscar producto | `GET /create/products?supplierCode=...&q=...` |
| Nueva orden de compra / OK | `POST /` |

Cuando la configuración del alta pide una selección, **Almacén** abre primero y muestra código y descripción. OK, doble clic o Enter confirman el almacén. Cancelar aplica el predeterminado. La captura muestra el código elegido y lo envía con el encabezado.
