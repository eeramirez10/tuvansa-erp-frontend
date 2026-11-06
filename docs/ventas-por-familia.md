# Ventas por familia

Implementación del 2026-11-04. Entrada actual **Reportes Contabilidad →
Reportes Financieros → Ventas por familia**, conservando el texto.
Desde el 2026-11-06 aparece exclusivamente en Contabilidad, en la ruta
`/contabilidad/reportes/ventas-por-familia` con carga diferida. La ruta anterior
`/ventas/reportes/ventas-por-familia` redirige a la actual. Los cálculos y endpoints
siguen iguales. Detalles: [Menús por módulo](menus-por-modulo.md).

Misma distribución visual de matriz, encabezados verdes y total rojo. Ventana ERP
movible/redimensionable compartida, controles shadcn/Base UI. Desde/Hasta permiten
un mes, año u otro periodo; inicia desde enero hasta hoy y sucursal 01. Sucursal
permite una o todas; Familia IFAMB filtra el tipo de producto fijo **ITIPO=1**.

| Control | Endpoint relativo a /api | Query key / efecto |
| --- | --- | --- |
| Abrir | GET /sales/reports/by-family/options | sales,reports,by-family,options |
| Vista previa | GET /sales/reports/by-family?from=2026-08-01&to=2026-08-31&branch=01&family=all | sales,reports,by-family,{from,to,branch,family} |
| Mostrar / Detalle | Sin HTTP adicional | Importe o metros; pagina 100 productos/sucursales |
| Excel / PDF | Sin HTTP adicional | Exporta la respuesta vigente |

El importe es **ventas brutas: sólo facturas**, calculado por el backend con
AICANTF × AIPRECIO. Condición vigente indicada por el usuario el 2026-11-06:
**MID(DNUM,1,1)='F' AND DSTATUSCFD=3 AND DESFACT=1**, sin IVA ni cargos de encabezado.
Se usa AIPRECIO tal como está registrado, no
AIPREBR; no revierte ni reaplica descuentos o tipos de cambio. Cantidades y
metros usan las mismas partidas de facturas. Mantiene DEST=0, AIMES=1, cliente
existente y filtros POS capturados, además de fechas/sucursal/familia/tipo 1.
Se elimina el filtro por FTIPMV y el requisito AICANTF>0; se conservan signos
y ceros de partidas de documentos elegibles. No se restringe por DITIPMV.
La pantalla y los documentos exportados indican folio F y estado CFD 3.
No usa el costo AICOSTO del reporte de inventarios. Precio AIPRECIO nulo señala
importe incompleto; precio cero se conserva sin reemplazarlo por AIPREBR.
Presenta Ventas brutas, sin IVA ni cargos
del encabezado. No es un estado contable de ingresos. Sucursal procede de la
compañía del documento e incluye sus ventas desde resguardos. La agrupación usa
familia y tipo actuales. Detalles y evidencia: docs/modules/sales/sales-by-family.md
en el backend. El SQL agregado de este reporte es derivado, no una captura nueva.

Mostrar permite importe o metros sin otra lectura. TR/PZ × 6.40, M/MT/MTR × 1,
FT × 0.3048: aproximaciones solicitadas previamente, sólo para cantidades. Otras
UM conservan su cantidad original y valor, sin añadirse a los metros. Detalle:
familia/código/descripción/sucursal/UM/cantidad vendida/metros/ventas brutas/conteo/
tipos/fechas. No se mezclan las cantidades originales de UM distintas.

Cambiar parámetros oculta la vista anterior y deshabilita exportar hasta regenerar.
Carga, error/reintento, vacío y fechas invertidas son explícitos. Escape y Cancelar
cierran la ventana; puede abrirse de nuevo. Enter dentro del formulario genera
la vista previa mediante el mismo submit.

ExcelJS se carga al descargar y genera Familias, Productos, Unidades originales y
Criterios. Conserva fórmulas de porcentajes/totales y bruto exacto SQL como texto,
códigos con ceros y cantidades numéricas. PDF imprime resumen o detalle completo;
matrices de todas las sucursales se dividen en bloques de tres con total general
explícito. No imprime la navegación del ERP ni limita el detalle a la página visible.

Se leen periodos de la base configurada, sin sumar respaldos ni cambiar de origen
por año. No se inventa fecha para movimientos sin documento. No se modifica MySQL,
Neon ni Firebase. Evidencia local privada inicial en captures/ui/new-version/sales-by-family/
del backend; no se agrega a Git.

Etapa anterior del 2026-11-04 (sustituida el 2026-11-06), sólo facturas con
AIPRECIO por aclaración del usuario: el menú conserva su nombre y
ubicación; el documento impreso, el Excel y la vista previa identifican el criterio
bruto. La respuesta incluye `basis: "gross"`, `amount` bruto y `gross` exacto por
producto/sucursal; sustituye las columnas anteriores de ventas/créditos/neto.
Archivos descargados con prefijo `ventas-brutas-familia-`.
Evidencia de la corrección en `captures/ui/new-version/sales-by-family-invoices/`
y `captures/sql/new-version/sales/invoice-only-by-family-20261104/` del backend.
Los artefactos previos con AIPREBR se conservan como históricos, sustituidos.
Agosto 2026 corregido: México **9,493,745.19** (178 partidas, 146 productos/sucursales);
todas las sucursales **87,926,769.31** (3,112 partidas). Se excluyen 25 partidas
de remisiones. Conciliación por partida y caso histórico con descuento confirman
el uso de AIPRECIO. La paginación de México queda en 100/46. Cuatro Excel
recalculados sin errores; PDF resumen una página y detalle cinco para México,
tres páginas de resumen para todas las sucursales.

Validación: lint/typecheck/build aprobados; navegador con API real para menú y
ruta directa, fechas/sucursales/familias, detalle/paginación, scroll horizontal,
errores/reintento, vacío, Escape y bloqueo de exportación vieja. Cuatro Excel
recalculados en Excel nativo sin errores. PDF de todas las sucursales conserva
sus siete columnas distribuidas en tres páginas; detalle incluye todos los
productos, sin cortarse en los 100 de la página visible. Los movimientos del
ejemplo mensual se conciliaron individualmente con Decimal en el backend.

Actualización vigente del 2026-11-06: selección exacta
`MID(DNUM,1,1)='F' AND DSTATUSCFD=3 AND DESFACT=1`, con `AICANTF*AIPRECIO`.
Se retiran FTIPMV y AICANTF>0; cantidades y precios conservan sus signos.
Agosto 2026: México **9,493,745.19**, 194 partidas, 147 productos/sucursales
(paginación 100/47); todas las sucursales **87,884,874.27**, 3,166 partidas.
La cabecera, Excel y PDF identifican folio F y estado CFD 3. Navegación, filtros,
errores/vacío y exportaciones con API real verificados; lint/typecheck/build aprobados.
Evidencia nueva privada del backend: `captures/ui/new-version/sales-by-family-status3-20261106/`.
Cuatro Excel contrastados con la API y PDF revisados visualmente. El recálculo
adicional de esta revisión en Excel nativo no estuvo disponible por error COM
0x800AC472; las verificaciones nativas del 2026-11-04 corresponden a los criterios anteriores.
