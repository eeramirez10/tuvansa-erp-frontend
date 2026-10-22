# Contabilidad: Estado de resultados

Estado actual al 2026-10-22: formato México (Excel), exclusivo de sucursal 01, y formato PROSCAI histórico. Ruta /contabilidad/reportes/estado-de-resultados; entrada desde Contabilidad → Reportes → Estado de resultados. El formato predeterminado es México (Excel). Las demás sucursales quedan pendientes.

## Flujo de México

1. Abrir Estado de resultados. La ventana Estado de resultados — México muestra Sucursal 01 — México y Ejercicio de sólo lectura.
2. Elegir Mes entre enero y diciembre; el ejercicio procede de la configuración de la API. OK genera el reporte.
3. La vista presenta concepto, importe mensual, porcentaje mensual, acumulado y porcentaje acumulado, con totales, utilidades y conciliación. Conserva el formato del Excel, negativos en rojo, bordes y subtotales.
4. Parámetros permite cambiar el mes y regenerar. No hay selector de otra sucursal ni de otro ejercicio.
5. Imprimir / Guardar PDF abre la impresión limpia del navegador: Carta, escala 100%, sin encabezados/pies del navegador. El documento incluye su propia numeración.
6. Formato PROSCAI abre los parámetros históricos Cuentas/Mes/Nivel, con el calendario anterior de 24 periodos. Cada formato tiene su propia consulta y parámetros; no se reutiliza un resultado entre calendarios diferentes.

Se reutilizan ventanas ERP movibles y el administrador compartido. La vista previa tiene scroll. Carga, error con reintento y vacío son explícitos; impresión permanece deshabilitada mientras no hay un reporte válido. Volver a Pólizas mantiene la navegación del módulo.

## Trazabilidad

| Vista / control | Endpoint relativo a /api | Query key | Procedencia |
| --- | --- | --- | --- |
| México / parámetros | GET /accounting/reports/income-statement/mexico/options | [accounting, reports, income-statement, mexico, options] | Derivada: configuración FCIA/FALMCAT |
| México / OK | GET /accounting/reports/income-statement/mexico?year=2026&month=8 | [accounting, reports, income-statement, mexico, {year, month}] | Adaptada: FCCBENC + FBENC; calendario/agrupación derivados |
| PROSCAI / parámetros | GET /accounting/reports/income-statement/options | [accounting, reports, income-statement, options] | Configuración histórica |
| PROSCAI / OK | GET /accounting/reports/income-statement?accounts=8&month=22&level=3 | [accounting, reports, income-statement, {accounts, month, level}] | Lectura adaptada de captura histórica |
| Imprimir / Guardar PDF | Sin petición adicional | Documento actual | Presentación del formato seleccionado |

El contrato de México conserva IncomeStatement e incluye financial, branch y accountingYear. El frontend calcula únicamente formato de importes/fechas; las fórmulas contables se ejecutan en el backend. No se duplican datos remotos en Zustand.

Evidencia SQL, alcance y reglas: docs/modules/accounting/income-statement-mexico.md del backend. Referencia histórica ACCOUNTING_INCOME_STATEMENT_ACCOUNTS8_MONTH22_LEVEL3_SCREEN; no se efectuó una captura OMNIS nueva para esta adaptación.

## Correspondencia con el Excel actualizado

Referencia: Estado de resultados agosto 2026.xlsx, columnas B–E. La compañía de México procede de FALMCAT.CATMULTICIA para CATALM=01; en el origen verificado es compañía 1 con BCCCENCOS=-1. El rótulo México está respaldado por ese catálogo y la comparación de importes, no por sustituir el filtro con centro de costos 1.

El año viene de FCIA.CIAPERIODO (2026 al verificar). Agosto usa mes 8 y no periodo 20. La fecha y el encabezado corresponden a agosto de 2026. Este calendario es independiente del formato PROSCAI histórico.

Porcentajes mensuales sobre B14 y acumulados sobre D14: ingresos de México. Se corrigen las referencias que aún apuntan a D20 vacío o G14 de Monterrey. Cuando los ingresos son cero, los porcentajes se dejan vacíos.

ISR, PTU y gastos centralizados adicionales se toman como cero porque las celdas correspondientes están vacías en el archivo. No se calculan tasas ni se inventan provisiones fiscales. Una nota impresa declara esa condición. La utilidad neta se calcula con esos ceros y los gastos centralizados de operación se descuentan una sola vez.

Los importes se calculan con centavos y se muestran sin decimales; porcentajes con dos decimales. La comparación aprobó 54 importes del libro: utilidad neta del mes -2,414,700.26 y acumulada 32,628,575.03. El PDF verificado ocupa una página carta y no incluye Monterrey. Los valores no están incrustados en el frontend: proceden de la API configurada; otro respaldo puede producir otros importes.

## Archivos y validación

Feature src/features/accounting/reports. mexico-income-statement-page.tsx gestiona parámetros y consulta de México; income-statement-page.tsx conserva el formato PROSCAI. income-statement-toolbar.tsx comparte el selector y acciones. financial-income-statement-document.tsx y su CSS generan la vista previa/PDF.

Validaciones aprobadas: pnpm lint, pnpm typecheck y pnpm build. Navegador con respuesta real de MySQL: ruta directa, menú, comparación de importes, cambio de mes, mes sin ingresos, regreso al formato histórico, impresión, error/reintento y vacío. Los estados de error/vacío se simularon; los importes principales usan el servicio real.

Evidencia local en captures/ui/new-version/income-statement-mexico/ del backend, excluida de Git. No se cambiaron Firebase ni variables de entorno. No requiere migraciones ni escrituras en la base heredada.
