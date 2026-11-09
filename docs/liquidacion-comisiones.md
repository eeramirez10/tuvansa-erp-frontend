# Liquidación y formato del reporte de comisiones

Actualización 2026-11-09, basada en `Reporte Comisiones Suc. Mexico Sep 26 V2.xlsx`
y `CLIENTES NUEVO.pdf`, archivos proporcionados por el usuario y conservados fuera de Git.

Se abre desde **Reportes de Ventas → Comisiones → Reporte Comisiones x Cobranza**,
consulta el periodo y pulsa **Liquidación y ajustes**. Ventanas ERP compartidas y
componentes shadcn/Base UI. Se conserva la exclusión de facturas con servicios,
incluidas mixtas, y la presentación positiva de pagos.

## Clasificación e incentivo

El backend lee la marca actual guardada en FCLI.CLITARJETA: Nuevo, Recurrente,
Viejo_Reactivado e Inactivo. Viejo_Reactivado se presenta como **Viejo recuperado**.
No se ejecuta la rutina UPDATE ni se reclasifica a los clientes al consultar.
La rutina usa CURDATE() cuando el usuario marca; por ello la etiqueta se identifica
como actual, no como una reconstrucción histórica del mes seleccionado.

Nuevo y Viejo recuperado generan **1% del importe cobrado sin IVA**, después
del límite a DBRUTO documentado. Para cálculo se usa `-paymentAmount`, como
`J*-1` del archivo: PA de signo contrario compensan cobranza/bono y no se
convierten en ingresos por ABS. Sólo Pago visible permanece positivo. La hoja
del agente incluye Cobranza de cálculo (-PA) para conciliar. Recurrente e Inactivo generan cero.
Una marca desconocida genera bono pendiente/null, sin inventar clasificación.
El detalle conserva cuatro decimales; el subtotal del agente redondea a centavos.
El total suma esos subtotales, evitando redondear antes cada documento.

El detalle principal tiene 21 columnas: las 18 posiciones anteriores, con
Clasificación cliente en lugar de Cliente nuevo, más Base clientes 1%, % clientes
y Bono clientes. Resumen por agente y encabezado muestran base, bono y documentos
elegibles. Los importes de origen y su signo de cálculo permanecen intactos.

## Liquidación y ajustes

La modalidad inicial es **Por confirmar**, sin asumir si el bono se añade o sustituye:

- Adicional: todas las facturas aportan a comisión normal y se añade el incentivo.
- Sustituye: Nuevo/Viejo recuperado aportan sólo al incentivo; sus pagos/costos
  no se duplican en la comisión normal y se mantienen en la trazabilidad.

Cada agente puede elegir tabulador mensual, porcentaje fijo o pendiente; costo
proporcional/total, costo manual opcional, flete, gratificaciones e inclusión de PLM.
Los perfiles identificables en el ejemplo se precargan **sólo para el mes completo
septiembre 2026 de México**, no para otros meses, sucursales o equipos.
El tabulador principal exige margen neto mayor a 16% y aplica porcentajes
0/4/5/7/8/9/12% según sus límites inferiores de cobranza. No se usa para acumular
varios meses. Las asignaciones desconocidas quedan pendientes, no como tasas cero.

Bruta=cobranza normal-costo aplicado; neta=bruta-flete-gratificaciones;
normal=neta*tasa; total=normal+clientes+PLM seleccionado. El costo manual se
identifica separado de origen y no cambia las partidas originales.

**Recalcular liquidación** envía únicamente criterios y parámetros al backend.
**Aplicar y cerrar** conserva la configuración de esa consulta mediante su query key.
Cambiar fechas, sucursal o agente la reinicia. No guarda preferencias globales.
Editar parámetros bloquea descargas obsoletas; Cancelar descarta cambios no aplicados.
Error/reintento y valores pendientes son explícitos. Puede exportarse un borrador
con pendientes claramente marcados y fórmulas vacías, sin falsos totales cero.

| Control | Endpoint relativo a /api | Efecto |
| --- | --- | --- |
| Vista previa | GET /sales/reports/collection-commissions | Origen, clasificación, bono y liquidación inicial pendiente |
| Recalcular liquidación | POST /sales/reports/collection-commissions/preview | Relee con snapshot READ ONLY y calcula parámetros; no persiste |
| Aplicar y cerrar | Misma query de parámetros | Conserva configuración para la descarga principal |
| Descargar liquidación Excel | Sin HTTP adicional | Genera con la respuesta vigente y todos los documentos |

## Excel

El archivo generado tiene **Liquidación, Tarifas, Neto a recibir, una hoja por agente,
Comisiones, Resumen agentes, Movimientos FAX, Partidas origen y Criterios**.
Diez agentes producen 18 hojas. El resumen conserva posiciones de nombre/cobranza/
costo/bruta/%/flete/gratificaciones/neta/%/tasas/comisión, dos vendedores, tres
cotizadores y total, separando normal, clientes y PLM.

Las hojas individuales muestran facturas, clasificación, incentivo, resumen y
ajustes editables en azul. El reparto se modifica en Excel: hasta cinco beneficiarios,
con porcentajes distintos para normal/clientes/PLM. Exige 100% por componente y
nombres para porcentajes positivos; distribuye centavos por diferencias de acumulados.
Por defecto se asigna al grupo del agente, sin inventar nombres individuales.
Neto a recibir mantiene agente y beneficiario por asignación; no consolida identidades
únicamente por coincidencia del nombre.

Tarifas tiene la tabla principal y la segunda tabla del ejemplo como referencia.
El bloque OTROS referencia 1.5% sobre excedente de 4,500,000, con base manual;
no se agrega automáticamente al total ni se asigna un beneficiario supuesto.
Fórmulas internas, resultados guardados, recálculo al abrir y sin vínculos al
archivo original. Las marcas de cliente provienen del ERP y no se guardan desde Excel.

## Validación

Consulta de septiembre 2026, México: 69 facturas, 71 PA, cobranza presentada
5,211,970.96. Trece documentos elegibles, base 158,708.82 y bono 1,587.09.
Marcas actuales: 45 Recurrente, 11 Inactivo y 13 Nuevo. La rama Viejo recuperado
y marcas desconocidas se prueban con fixtures. Los costos y pagos fuente no cambian.
No se exige igualar los totales del ejemplo, que contiene ajustes/agrupaciones manuales.

Navegador/API real: 21 columnas, bono, ambos modos, ajustes manuales, exportación
obsoleta bloqueada y conservación al aplicar. Cuatro libros contrastados con API
y XML: 18 hojas, 1,239 fórmulas por archivo, fechas/importes/pedientes y sin vínculos
externos ni cachés de error. No se afirma recálculo nativo de Excel. Los parámetros
de simulación de estas pruebas no se convierten en configuración global del usuario.
Evidencia privada en captures del backend, carpetas commission-settlement-20261109.

Validaciones finales `pnpm lint`, `pnpm typecheck`, `pnpm build` aprobadas.
El navegador comprueba también fallo/reintento del recálculo sin exportar
datos obsoletos. Backend: 233 pruebas aprobadas, incluidas precisión del 1%,
sentido del PA, reglas de liquidación y frontera HTTP de sólo lectura.
