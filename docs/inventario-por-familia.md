# Inventario por familia a una fecha

Ruta `/contabilidad/reportes/inventario-por-familia`. Entrada exclusiva de Contabilidad:
**Reportes Contabilidad → Reportes Financieros → Inventario por familia**. El mismo submenú
incluye Estado de resultados y [Ventas por familia](ventas-por-familia.md).
El catálogo por módulo está en `features/reports/model.ts`. La ruta anterior
`/inventarios/reportes/inventario-por-familia` redirige al contexto contable.
Detalles: [Menús por módulo](menus-por-modulo.md).
Todos los controles usan shadcn/Base UI; no hay un menú HTML alternativo.

El reporte es nuevo, solicitado por el usuario el 2026-10-29, con SQL **derivado**.
No se afirma que copie un reporte nativo de OMNIS. Reglas y evidencia:
`docs/modules/inventories/inventory-by-family.md` del backend.

Una ventana ERP permite elegir **Inventario al**, **Consultar por**, **Sucursal**
o **Almacén**, **Familia IFAMB** y si se incluyen movimientos sin fecha. Inicia
en fecha actual de México, sucursal 01 México con sus resguardos y todas las
familias. La asignación procede de FALMCAT.CATMULTICIA, no del nombre ni prefijo.
Todos también identifica almacenes sin sucursal asignada. Vista previa calcula
desde el inicio del historial hasta el corte inclusive.

La familia viene de FINV.IFAMB; FFAM.FAMTNUM aporta su descripción. Las cantidades
se calculan en el backend con AICANT firmado, AIMES=1 y documentos vigentes.
No se añade stock actual ni se suman respaldos anuales. Las UM se mantienen
separadas en el detalle. El resumen las convierte a metros estimados y reúne
una sola cantidad por familia. Se incluyen productos con movimiento aunque el
saldo neto sea cero.
La familia/unidad son las actuales, no un historial de clasificaciones.

Cuando faltan documentos o sus fechas, el resultado es **PROVISIONAL**. Por
defecto se mantienen separados. La casilla **Incluir movimientos sin fecha
(escenario estimado)** añade todas sus entradas y salidas y advierte que podrían
pertenecer a otro periodo. Nunca se inventan fechas. **Ver pendientes de fecha**
muestra el detalle afectado conservando código y almacén original.

**Mostrar** inicia en **Costo histórico de movimientos**, entradas por su propio
AICOSTO menos salidas por su propio AICOSTO. Conserva revaluaciones AIREVAL aparte
y advierte costos cero/ausentes. Permite alternar a costo actual o metros sin otra
consulta. Costo actual usa la cantidad en UM original por FINV.ILISTA4, con redondeo
a centavos por producto/almacén. No equivale a costo promedio histórico al corte.
Costos ausentes o no positivos se señalan sin sustituirlos por otra lista.

Resumen: N.º, Producto / Familia, metros estimados y porcentaje por almacén,
total de inventario y porcentaje general, siguiendo el Excel del usuario.
TR/PZ × 6.40 m según indicación del usuario; M/MT/MTR × 1; FT × 0.3048 m.
Son equivalencias aproximadas, no longitudes medidas de cada artículo. Unidades
sin equivalencia se informan aparte. La casilla Detalle por producto conserva
UM/cantidades originales y agrega m/UM y metros estimados, además de Código,
Descripción, Alm., primera/última fecha; la pantalla pagina 100
renglones y conserva scroll X/Y. La impresión incluye todos los renglones del
detalle seleccionado, no sólo la página visible. El DOM completo de impresión
se materializa durante beforeprint para mantener ligera la navegación.

Excel incluye Familias, Unidades originales, Totales por unidad, Productos,
Pendientes de conciliar, Costos históricos y Criterios con
todos los datos de la respuesta. Conserva códigos con ceros, cantidades numéricas
con tres decimales, filtros, encabezados congelados y advertencia provisional.
ExcelJS se importa de forma diferida. El resumen conserva fórmulas de porcentajes
y totales, encabezados verdes y total en rojo como el ejemplo. PDF usa impresión
en carta horizontal, sin navegación del ERP; las matrices anchas se dividen en
bloques de tres almacenes con total general explícito.

Cambiar fecha/almacén/familia oculta la vista anterior y bloquea exportación
hasta regenerar. Carga, error/reintento y vacío son explícitos. No hay escritura,
migración ni cambio de Firebase. El menú conserva navegación por teclado y se
posiciona sobre las ventanas del ERP.

| Control | Endpoint relativo a /api | Query key |
| --- | --- | --- |
| Abrir / catálogos | GET /inventories/reports/by-family/options | inventories,reports,by-family,options |
| Vista previa | GET /inventories/reports/by-family?asOf=2026-08-31&warehouse=01&family=all&scope=branch&includeUndated=false | inventories,reports,by-family,{asOf,warehouse,family,scope,includeUndated} |
| Excel / PDF | Sin HTTP adicional | Respuesta vigente |

Evidencia local privada en el backend:
`captures/ui/new-version/inventory-by-family/`. Se verifican navegación global y
directa, filtros reales, detalle/paginación, bloqueo de exportación vieja, libro
Excel y PDF. No se publica esa carpeta en Git.

La actualización de metros estimados tiene evidencia en
`captures/ui/new-version/inventory-family-meters/`. Se validaron conversiones con
Decimal, una fila por familia, fórmulas en Excel nativo, conservación de UM/códigos,
México/todos y PDF con columnas completas. La matriz corresponde a una fecha de
corte; el ejemplo también contiene 2025/2024, cuyo comparativo simultáneo quedó
pendiente de definir. No se copian cifras de ventas del archivo de referencia.

## Conciliación de resguardos y pendientes (2026-10-30)

La sucursal México incluye 01, 11, 12, 13 y 15 según el catálogo actual. Para
TCC/B007 al 2026-08-31, la validación real devolvió $14,963,893.55 de movimientos
fechados, valuados con ILISTA4 actual. Nueve salidas sin documento ni fecha
representan −1,331.38 M y −$130,481.71; el escenario que las incluye devuelve
$14,833,411.84. No se confirma aún el valor histórico esperado de $12,281,029.00.
Los documentos faltantes tampoco aparecieron en los archivos 2024/2025 revisados.

Evidencia privada: `captures/ui/new-version/inventory-branch-reconciliation/`
del backend. Se verifican API real de sólo lectura, escenarios, Excel/PDF,
pendientes, cambio a metros sin HTTP adicional y consulta de almacén individual.
No se activó general_log ni se modificaron datos.

## Costo histórico de movimientos (2026-10-30)

La API agrega historical/historicalTotals e historicalByWarehouse por familia.
No cambia ruta, filtros ni query key. La matriz, el detalle y las exportaciones
usan ese contrato al elegir el modo histórico; el frontend no recalcula costos.
Cada producto conserva entradas/salidas a sus costos registrados y netos fechado,
pendiente y reportado. Revaluaciones fechadas y sin fecha se muestran separadas;
no se incorporan sin confirmar su tratamiento. Se conservan las de cantidad cero.

Costos históricos en Excel permite revisar código/almacén, importes y movimientos
con costo cero o ausente. No se sustituye un costo cero por la lista actual. Los
netos se redondean después de sumar valores exactos; restar las dos columnas ya
redondeadas puede producir diferencias de centavos. El cambio de modo es local.

TCC México al 31/08/2026 devuelve 34,420,029.46 fechado y 34,248,946.02 incluyendo
pendientes, a costo de cada movimiento. Hay 62 movimientos fechados con costo cero.
Se necesita conciliar costos y revaluaciones antes de certificar el saldo histórico;
no se afirma que coincida con la referencia 12,281,029.00. Las cifras anteriores
de 14.96/14.83 millones corresponden exclusivamente al modo de costo actual.
Evidencia privada: captures/ui/new-version/inventory-historical-costs/ del backend.
