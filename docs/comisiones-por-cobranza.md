# Comisiones por cobranza — preliminar

Reporte nuevo del 2026-11-06. Entrada **Reportes Contabilidad → Reportes
Financieros → Comisiones por cobranza**. Ruta `/contabilidad/reportes/comisiones-por-cobranza`.
Usa la ventana ERP compartida, Dropdown Menu y controles shadcn/Base UI.

**Falta el método 214_Calcula_Costo_de__Facturas**, invocado por los PDF de
referencia. Por eso no calcula COSTO, COSTO REAL, UTILIDAD, %, LM, LM_VALOR ni
importe de comisión. La pantalla y cada hoja/archivo Excel dicen PRELIMINAR;
esos datos se muestran pendientes o vacíos, no como ceros. El usuario también
debe indicar si necesita calcular una comisión y qué regla utiliza.

| Control | Endpoint relativo a /api | Efecto |
| --- | --- | --- |
| Abrir | GET /sales/reports/collection-commissions/options | Compañía, sucursales, agentes y fechas del mes actual |
| Pagos desde / hasta, Sucursal, Agente / Vista previa | GET /sales/reports/collection-commissions?from=2026-08-01&to=2026-08-31&branch=01&agent=all | Consulta por FAX.AFECHA, no fecha de factura |
| Resumen por agente / paginación | Sin HTTP | Cambia vista, páginas de 100 |
| Descargar Excel preliminar | Sin HTTP | Cinco hojas, incluye todas las filas |
| Cancelar / Escape | Sin HTTP | Cierra la ventana; permite abrirla de nuevo |

Query keys incluyen from/to/branch/agent. Cambiar filtros oculta resultados
anteriores y bloquea exportación hasta regenerar. Fechas hasta 366 días y agentes
del catálogo; carga, error/reintento, vacío y errores de rango explícitos.

Las facturas necesitan uno o más PA en el rango, incluso parciales y de otros
meses. Cobranza y devoluciones se presentan sin IVA, con signos; FECHA PAGO y
DÍAS usan el último PA y conservan primera fecha/cantidad en el detalle. México
usa almacenes 01/15 de la referencia. Las demás sucursales se amplían según el
catálogo del origen. No se aplica el filtro fiscal del reporte Ventas por familia.

ExcelJS diferido genera Comisiones, Resumen agentes, Movimientos FAX, Partidas
origen y Criterios. Las 18 columnas principales conservan las del procedimiento
211; los costos pendientes permanecen vacíos. Las hojas de movimientos y partidas
permiten auditar FAX/FDOC/FAXINV/FINV sin multiplicar el importe cobrado. La descarga
conserva fechas y cantidades numéricas y decimales originales como texto para revisión.

Contrato, reglas verificadas, límites, SQL derivado y evidencia del origen en
`docs/modules/sales/collection-commissions.md` del backend. No se afirma que el
reporte esté terminado ni que se haya capturado SQL nuevo de OMNIS.

Validación: lint/typecheck/build aprobados y navegador con API real para menú,
ruta directa, fechas de pago, agentes/sucursales, 18 columnas, resumen sin HTTP,
Excel, paginación 100/95, scroll XY, bloqueo de exportación vieja, error/reintento,
vacío, rango inválido y Escape. Tres Excel contrastados con la API y sus fórmulas
guardadas revisadas en XML; costos/LM/utilidad pendientes permanecen vacíos.
Evidencia privada en `captures/ui/new-version/collection-commissions-20261106/` del backend.
