# Inventario por familia a una fecha

Ruta `/inventarios/reportes/inventario-por-familia`. Entrada global:
**Reportes → Reportes Financieros → Inventario por familia**. El mismo submenú
incluye Estado de resultados y Ventas por familia (deshabilitado hasta definirlo).
El catálogo de grupos/rutas se amplía en `features/reports/components/reports-menu.tsx`.
Todos los controles usan shadcn/Base UI; no hay un menú HTML alternativo.

El reporte es nuevo, solicitado por el usuario el 2026-10-29, con SQL **derivado**.
No se afirma que copie un reporte nativo de OMNIS. Reglas y evidencia:
`docs/modules/inventories/inventory-by-family.md` del backend.

Una ventana ERP permite elegir **Inventario al**, **Almacén / sucursal** y
**Familia IFAMB**. Inicia en fecha actual de México, almacén 01 México y todas
las familias. El catálogo incluye resguardos y tránsito: Todos los almacenes no
significa exclusivamente las siete sucursales. Vista previa calcula desde el
inicio del historial hasta el corte inclusive. No hay valuación monetaria.

La familia viene de FINV.IFAMB; FFAM.FAMTNUM aporta su descripción. Las cantidades
se calculan en el backend con AICANT firmado, AIMES=1 y documentos vigentes.
No se añade stock actual ni se suman respaldos anuales. Las UM se mantienen
separadas. Se incluyen productos con movimiento aunque el saldo neto sea cero.
La familia/unidad son las actuales, no un historial de clasificaciones.

Cuando faltan documentos o sus fechas, el resultado es **PROVISIONAL**. Vista,
Excel y PDF muestran el aviso y la cantidad sin fecha separada de la existencia
fechada. No se distribuyen movimientos sin fecha entre periodos inventados.

Resumen: Familia, Descripción, UM, Entradas, Salidas, Existencia fechada,
Sin fecha (±). Incluye totales por unidad. La casilla Detalle por producto
agrega Código, Descripción, Alm., primera/última fecha; la pantalla pagina 100
renglones y conserva scroll X/Y. La impresión incluye todos los renglones del
detalle seleccionado, no sólo la página visible. El DOM completo de impresión
se materializa durante beforeprint para mantener ligera la navegación.

Excel siempre incluye Familias, Totales por unidad, Productos y Criterios con
todos los datos de la respuesta. Conserva códigos con ceros, cantidades numéricas
con tres decimales, filtros, encabezados congelados y advertencia provisional.
ExcelJS existente se importa de forma diferida. PDF usa impresión del navegador
en carta horizontal, sin encabezado de navegación del ERP.

Cambiar fecha/almacén/familia oculta la vista anterior y bloquea exportación
hasta regenerar. Carga, error/reintento y vacío son explícitos. No hay escritura,
migración ni cambio de Firebase. El menú conserva navegación por teclado y se
posiciona sobre las ventanas del ERP.

| Control | Endpoint relativo a /api | Query key |
| --- | --- | --- |
| Abrir / catálogos | GET /inventories/reports/by-family/options | inventories,reports,by-family,options |
| Vista previa | GET /inventories/reports/by-family?asOf=2026-09-30&warehouse=01&family=all | inventories,reports,by-family,{asOf,warehouse,family} |
| Excel / PDF | Sin HTTP adicional | Respuesta vigente |

Evidencia local privada en el backend:
`captures/ui/new-version/inventory-by-family/`. Se verifican navegación global y
directa, filtros reales, detalle/paginación, bloqueo de exportación vieja, libro
Excel y PDF. No se publica esa carpeta en Git.
