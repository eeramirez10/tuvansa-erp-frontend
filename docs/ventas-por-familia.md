# Ventas por familia

Implementación del 2026-11-04. Se habilita la entrada existente **Reportes →
Reportes Financieros → Ventas por familia**, conservando ubicación y texto.
Ruta `/ventas/reportes/ventas-por-familia` con carga diferida. El inventario por
familia conserva su ruta y funcionamiento.

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

El importe lo calcula el backend con AICANTF × AIPRECIO, conservando créditos y
devoluciones negativos, documentos DESFACT=1/DEST=0 y filtros POS capturados.
No usa el costo AICOSTO del reporte de inventarios. No limita a FA ni reaplica
descuentos o tipos de cambio; presenta Importe registrado, sin IVA ni cargos
del encabezado. No es un estado contable de ingresos. Sucursal procede de la
compañía del documento e incluye sus ventas desde resguardos. La agrupación usa
familia y tipo actuales. Detalles y evidencia: docs/modules/sales/sales-by-family.md
en el backend. El SQL agregado de este reporte es derivado, no una captura nueva.

Mostrar permite importe o metros sin otra lectura. TR/PZ × 6.40, M/MT/MTR × 1,
FT × 0.3048: aproximaciones solicitadas previamente, sólo para cantidades. Otras
UM conservan su cantidad original y valor, sin añadirse a los metros. Detalle:
familia/código/descripción/sucursal/UM/cantidad/metros/ventas/créditos/neto/conteo/
tipos/fechas. No se mezclan las cantidades originales de UM distintas.

Cambiar parámetros oculta la vista anterior y deshabilita exportar hasta regenerar.
Carga, error/reintento, vacío y fechas invertidas son explícitos. Escape y Cancelar
cierran la ventana; puede abrirse de nuevo. Enter dentro del formulario genera
la vista previa mediante el mismo submit.

ExcelJS se carga al descargar y genera Familias, Productos, Unidades originales y
Criterios. Conserva fórmulas de porcentajes/totales y neto exacto SQL como texto,
códigos con ceros y cantidades numéricas. PDF imprime resumen o detalle completo;
matrices de todas las sucursales se dividen en bloques de tres con total general
explícito. No imprime la navegación del ERP ni limita el detalle a la página visible.

Se leen periodos de la base configurada, sin sumar respaldos ni cambiar de origen
por año. No se inventa fecha para movimientos sin documento. No se modifica MySQL,
Neon ni Firebase. Evidencia local privada en captures/ui/new-version/sales-by-family/
del backend; no se agrega a Git.

Validación: lint/typecheck/build aprobados; navegador con API real para menú y
ruta directa, fechas/sucursales/familias, detalle/paginación, scroll horizontal,
errores/reintento, vacío, Escape y bloqueo de exportación vieja. Cuatro Excel
recalculados en Excel nativo sin errores. PDF de todas las sucursales conserva
sus siete columnas distribuidas en tres páginas; detalle incluye todos los
productos, sin cortarse en los 100 de la página visible. Los movimientos del
ejemplo mensual se conciliaron individualmente con Decimal en el backend.
