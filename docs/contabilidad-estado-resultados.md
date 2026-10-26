# Contabilidad: Estado de resultados

Referencia previa al 2026-10-22: Todas las sucursales (Excel), México (Excel) y PROSCAI histórico. Ruta /contabilidad/reportes/estado-de-resultados; entrada desde Contabilidad → Reportes → Estado de resultados. El formato predeterminado es Todas las sucursales (Excel): México, Monterrey, Veracruz, Mexicali, Querétaro, Cancún y Cabos, más el consolidado final.

## Ventana unificada (2026-10-23)

Entrada actual: Contabilidad → Reportes → Estado de resultados. Reportes usa Dropdown Menu de shadcn en una franja superior del encabezado, antes del selector de módulos, únicamente en Contabilidad. Sigue disponible durante carga/error. La lista de reportes contiene sólo Estado de resultados y permite agregar rutas futuras. Se retiraron duplicados de las barras de Pólizas y reporte.

La modalidad predeterminada es Gerencial (Excel/PDF). Una sola ventana ERP reúne Año, Mes, Sucursal, Vista previa, el documento con scroll y Salida Excel/PDF. Año y mes predeterminados proceden de la API; Sucursal inicia en Todas y Salida en PDF. Año/Mes/Sucursal y Formato usan Select de shadcn con Base UI; Salida usa RadioGroup. Los desplegables se posicionan por encima de las ventanas ERP. Se conserva el sistema compartido para mover, redimensionar, minimizar y restaurar.

El selector Año admite sólo los ejercicios publicados por options.years; desde 2026-10-26 ofrece 2026, 2025 y 2024 en el servidor verificado, cada uno con su origen anual. No se habilitan históricos por el mero rango CIAFI/CIAFF. Antes de agregar otro ejercicio debe verificarse su correspondencia real de saldos en el backend. Esto evita cambiar sólo el encabezado sobre importes de otro año.

Sucursal admite Todas y los siete códigos 01..07. Una sucursal genera un documento, PDF de una página o Excel de una hoja; Todas genera siete documentos y consolidado, PDF de ocho páginas y Excel de nueve hojas. El menú abre esta ventana también desde Pólizas, y vuelve a abrirla si se cerró en la misma ruta. Los formatos previos México (Excel) y PROSCAI se conservan en Formato.

Vista previa consulta los filtros elegidos y mantiene abierta la ventana. La salida se obtiene después, dentro de la misma ventana, con Descargar Excel o Imprimir / Guardar PDF. PDF abre la impresión del navegador para guardar el archivo. Cambiar filtros oculta la vista anterior y deshabilita exportación hasta regenerar. Cambiar sólo Excel/PDF no consulta nuevamente. El formulario y exportación se bloquean durante tareas en curso; error/reintento y vacío no permiten exportar.

Options mantiene year y agrega years, defaultYear y defaultBranch. El reporte admite branch=all|01..07; omitir branch conserva el comportamiento completo. Una sucursal devuelve un solo elemento branches y consolidated:null. Las query keys incluyen año, mes y sucursal. El formato de salida es estado local, no forma parte de la consulta contable. No se copian datos remotos a Zustand ni se modifica la base. Se conserva ExcelJS diferido, redondeo a centavos y fórmulas; el libro individual no crea una hoja de consolidado duplicada.

Validación de esta ampliación: lint/typecheck/build, navegador con datos reales para una/todas, comparación de las siete respuestas individuales, acceso directo y desde Pólizas, teclado, foco, clic exterior, interfaz ampliada, minimizar/restaurar, carga/error/vacío, impresión y descarga. Se comprobaron PDF de 1/8 páginas y Excel de 1/9 hojas, con recálculo en Excel nativo. Evidencia excluida de Git: captures/ui/new-version/income-statement-filters/ en backend. La documentación de abajo conserva las etapas anteriores.

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


## Archivo completo: siete sucursales y consolidado

La ventana Estado de resultados — Todas las sucursales permite elegir el mes del ejercicio configurado. Genera siete reportes con el diseño aprobado y el consolidado final. MES del consolidado suma el mes de las siete sucursales; ACUMULADO suma sus acumulados hasta el mes elegido. Los porcentajes se recalculan contra ingresos consolidados. Los datos se consultan en una sola lectura por lote, según las compañías del catálogo 01..07.

| Control | Endpoint relativo a /api | Query key |
| --- | --- | --- |
| Todas las sucursales / parámetros | GET /accounting/reports/income-statement/branches/options | [accounting, reports, income-statement, branches, options] |
| Todas las sucursales / OK | GET /accounting/reports/income-statement/branches?year=2026&month=8 | [accounting, reports, income-statement, branches, {year, month}] |
| Descargar Excel | Sin petición adicional | Usa la respuesta mostrada |
| Imprimir / Guardar PDF | Sin petición adicional | Ocho páginas carta |

Descargar Excel genera estado-resultados-sucursales-AAAA-MM.xlsx con ExcelJS 4.4.0 (https://github.com/exceljs/exceljs#readme), cargado al exportar. Contiene Reporte completo con los siete bloques y consolidado lado a lado, siete hojas individuales y la hoja Consolidado al final. Las hojas individuales usan referencias a la principal, y la principal conserva fórmulas de subtotales, utilidades, porcentajes y sumas generales. Se guarda resultado inicial de cada fórmula y recálculo al abrir. ROUND(...,2) mantiene cálculos monetarios a centavos; IFERROR evita divisiones inválidas. Los renglones opcionales se alinean por clave, para conservar ajustes de costos de una sucursal sin desplazar las demás.

El botón queda deshabilitado durante carga, error, vacío y exportación. Fallos de exportación usan el servicio global de notificaciones. La descarga utiliza un helper compartido de Blob y libera su URL temporal. Cambiar un dato en el Excel no modifica el ERP.

Archivos nuevos: branch-income-statements-page.tsx, income-statement-workbook.ts y download-income-statement-excel.ts. Helper genérico: src/shared/utils/download-file.ts. La vista y PDF reutilizan financial-income-statement-document.tsx; cada sucursal imprime una página, seguida del consolidado.

Se validaron descarga real, estructura de nueve hojas y 1,616 fórmulas, resultados y recálculo en Excel de Windows, propagación de ajustes, PDF de ocho páginas, navegación, error/reintento y vacío. Evidencia privada en captures/ui/new-version/income-statement-all-branches/ del backend. Contrato y SQL derivado: docs/modules/accounting/income-statement-branches.md del backend. No requiere migraciones ni cambios de Firebase.


## Archivos anuales (2026-10-26)

El selector Año existente ya recibe 2026/2025/2024 desde la API. El backend resuelve 2026 en tuvansa y los archivos históricos en tuvansa2025/tuvansa2024; no reconstruye el año pasado desde pólizas desaplicadas de producción. No se modifica la conexión global, las credenciales ni la UI. Se mantiene el año seleccionado en la clave de consulta, los encabezados, el nombre de archivo y la exportación; cambiar año requiere regenerar la vista previa.

Se verificó agosto 2025 para Todas (Excel nueve hojas/PDF ocho páginas) y México (Excel una hoja/PDF una página), alternancia posterior a 2026 sin cambiar sus importes y recálculo en Excel nativo. Los demás meses usan el mismo contrato year/month/branch. La modalidad PROSCAI histórica y el acceso previo México conservan su contrato; el selector por archivo pertenece a la ventana Gerencial (Excel/PDF). No requiere nuevos endpoints ni variables frontend. Las limitaciones al único ejercicio 2026 de secciones previas corresponden a la etapa anterior a identificar las bases anuales.
