# Reporte Comisiones x Cobranza

Actualizado el 2026-11-06. Pertenece a **Ventas**, disponible desde Pedidos,
Facturación y su ruta directa `/ventas/reportes/comisiones-por-cobranza`.
Menú exacto: **Reportes de Ventas → Comisiones → Reporte Comisiones x Cobranza**.
Contabilidad ya no incluye esta opción. La ruta anterior contable redirige
preservando query/hash; los otros tres reportes financieros conservan su ubicación.
Ventana ERP, Dropdown Menu y controles compartidos shadcn/Base UI.

El método 214 proporcionado en CUATRO.pdf completa costos, utilidad, % y LM.
Ya no se etiqueta preliminar por falta de ese método. No se inventa una tasa
adicional de comisión a pagar: los PDF definen las 18 columnas del reporte.

| Control | Endpoint relativo a /api | Efecto |
| --- | --- | --- |
| Abrir | GET /sales/reports/collection-commissions/options | Compañía, sucursales, agentes y fechas del mes actual |
| Pagos desde / hasta, Sucursal, Agente / Vista previa | GET /sales/reports/collection-commissions?from=2026-08-01&to=2026-08-31&branch=01&agent=all | Fecha de pago FAX.AFECHA, no fecha de factura |
| Resumen por agente / paginación | Sin HTTP | Resumen o documentos agrupados, páginas de 100 |
| Descargar Excel | Sin HTTP | Cinco hojas con todos los documentos y subtotales por agente |
| Cancelar / Escape | Sin HTTP | Cierra y permite reabrir |

Query keys incluyen from/to/branch/agent. Cambiar filtros bloquea exportación
obsoleta hasta regenerar; rangos hasta 366 días, estados carga/error/reintento/vacío.
Requiere al menos un PA por factura en el rango, incluso de meses anteriores.
Los pagos se muestran **positivos** en detalle, resumen, subtotales y total,
sumando valores absolutos por factura, no el absoluto del neto. La API conserva
el pago firmado para cálculo y la hoja Movimientos FAX conserva los signos
originales. Devoluciones no cambian de signo. FECHA PAGO y DÍAS usan el último PA.
México: almacenes 01/15. No hereda el filtro fiscal de Ventas por familia.

Se excluye la **factura completa** si contiene alguna partida de servicio
(`FINV.ITIPO=4`), incluidas las mixtas. Sus pagos y partidas tampoco aparecen
en las hojas de auditoría ni en totales. El backend aplica esta regla; la UI
la explica y no realiza un filtro local dependiente de la página visible.

Costo=SUM(AICOSTO*AICANTF) de partidas con el movimiento de venta de la compañía;
costo real=ABS(costo*pago PA original sin IVA/DBRUTO). Utilidad y margen siguen
211/214; el pago firmado de cálculo se limita a -DBRUTO si excede su subtotal y
se presenta mediante su absoluto. `displayPaymentAmount`/`displayPayment` son
los campos visuales; `paymentAmount`/`payment` conservan signos. El 3% está
comentado y no se aplica. LM cuenta partidas ILUGAR=XXX, LM_VALOR suma 1% de
AICANTF*AIPRECIO de esas partidas. Detalles y procedencia **derivada de código
proporcionado**, no captura nueva, en el documento del backend.

Los documentos se agrupan por código de agente y folio, con cabecera y subtotal.
El resumen permite comparar agentes; la selección Agente filtra uno o todos.
Si falta una partida de costo, su compañía es desconocida, IVA inválido o subtotal
cero, se informa costo no calculable; null no se convierte en cero. Los totales
afectados también son no disponibles, sin presentar sumas parciales como completas.

ExcelJS diferido: Comisiones (18 columnas, grupos y subtotales por agente),
Resumen agentes, Movimientos FAX, Partidas origen y Criterios. Fórmulas y resultados
guardados; total general suma sólo subtotales. Fechas/cantidades numéricas, margen
porcentual; null vacío. La auditoría de partidas incluye AITIPMV, ILUGAR, compañía e ITIPO.

Validación con API real: México, todas las sucursales y agente 1501; 74/983/38
facturas después de excluir 12 facturas con servicios (8 mixtas). FE0064185,
que antes quedaba sin costo, también se excluye por ser de servicio. Los costos
de la muestra quedan completos. México presenta pago positivo 5,321,234.60;
todas 54,272,789.20, agente 1501 2,074,562.43. Navegador verifica ruta/menú,
agrupación y subtotales, 18 columnas, filtros, paginación 100/83, scroll, Excel,
exportación vigente, error/reintento, vacío, rango inválido y Escape. Tres libros
contrastados con la API y fórmulas. Evidencia privada en captures del backend.

`pnpm lint`, `pnpm typecheck` y `pnpm build` aprobados. Menús comprobados desde
Pedidos, Facturación, ruta directa y Contabilidad; redirección anterior conserva
query/hash. Fórmulas de subtotales y total general conciliadas en el XML del Excel.
