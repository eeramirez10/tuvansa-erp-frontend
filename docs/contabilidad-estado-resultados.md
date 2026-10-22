# Contabilidad: Estado de resultados

Implementación 2026-10-22. Ruta: /contabilidad/reportes/estado-de-resultados. Acceso desde Contabilidad → Reportes → Estado de resultados. Reproduce la estructura observada en OMNIS y el PDF local proporcionado por el usuario: encabezados de compañía, fecha, cuentas, columnas MES/ACUMULADO, jerarquías, subtotales, totales y resultado del ejercicio.

## Flujo

1. El menú Reportes está disponible en Pólizas y en el propio reporte.
2. Al entrar se abre la ventana ERP Estado de resultados. Cuentas muestra 8 ('8' Solo result). Mes ofrece número y mes/año del ejercicio; Nivel ofrece los niveles configurados en la API. Se conserva Pantalla como salida.
3. OK genera la vista previa. Parámetros permite cambiar mes/nivel y regenerar, incluso sin cambiar los parámetros.
4. Imprimir / Guardar PDF abre la impresión del navegador con el documento limpio, sin encabezado ni controles de la aplicación. Elegir Guardar como PDF, papel Carta, escala 100% y desactivar los encabezados/pies propios del navegador. El documento ya contiene número de página.
5. Volver a Pólizas conserva la navegación del módulo.

La vista previa tiene scroll para pantallas pequeñas. El botón de impresión está deshabilitado durante la carga, ante error o sin datos. Hay reintento para fallos de conexión y un mensaje explícito para el reporte vacío. La impresión usa exactamente la misma respuesta mostrada, sin volver a consultar mientras se imprime.

## Integración y trazabilidad

| Vista / control | Evento | Método / endpoint relativo a /api | Query key | Fuente |
| --- | --- | --- | --- | --- |
| Reportes / Estado de resultados | Abrir ventana | GET /accounting/reports/income-statement/options | [accounting, reports, income-statement, options] | Calendario/niveles de FCIA y compañía de FALMCAT; derivada |
| Parámetros / OK | Generar o regenerar | GET /accounting/reports/income-statement?accounts=8&month=22&level=3 | [accounting, reports, income-statement, {accounts, month, level}] | FCCBENC LEFT JOIN FBENC; adaptada |
| Vista previa / Imprimir / Guardar PDF | Imprimir | Sin HTTP adicional | Mismo resultado | Presentación derivada verificada contra PDF |

La clave exacta del reporte se define en src/features/accounting/reports/logic.ts. Todos los parámetros del resultado forman parte de la clave; no se guardan datos del reporte en Zustand.

Evidencia SQL del backend: docs/modules/accounting/income-statement.md. Marcadores ACCOUNTING_INCOME_STATEMENT_OPEN y ACCOUNTING_INCOME_STATEMENT_ACCOUNTS8_MONTH22_LEVEL3_SCREEN. La lectura mantiene compañía 1 y centro de costos -1; otros rangos de cuentas no están habilitados.

Las fórmulas se ejecutan en el backend. Los saldos de padres incluyen descendientes; no se suman dos veces. Naturaleza de cada cuenta determina el signo. Los importes cero se dejan vacíos, y las pérdidas conservan su signo. El PDF de mes 22/nivel 3 se contrastó con la base local y muestra resultado -56,023,777.84. No hay importes de ejemplo incorporados al frontend.

La API actual puede utilizar un respaldo distinto al PDF/OMNIS local. Los datos se muestran desde la conexión configurada, sin cambiar variables ni exigir coincidencia de importes entre respaldos.

## Archivos y validación

Feature: src/features/accounting/reports/ (model, services, logic, components y pages). La ventana de parámetros reutiliza ErpDataDialog y el administrador de ventanas. La impresión está limitada al documento mediante estilos propios y no cambia la impresión de otras pantallas.

Validaciones: pnpm lint, pnpm typecheck y pnpm build; navegador con respuesta real del backend local, acceso directo, menú, cambio de mes y nivel, errores/reintento, vacío y PDF. El archivo generado tiene una página carta (612 × 792 puntos) para el ejemplo; niveles más detallados pueden ocupar varias páginas con encabezados de columnas repetidos.

Los logs, capturas y PDF de prueba están bajo captures/ en el backend y no se versionan. No se cambiaron configuraciones de Firebase ni se desplegaron servicios.
