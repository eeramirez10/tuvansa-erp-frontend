# Ajustes negativos de comisiones

Actualización 2026-11-10. Mismo reporte y ruta de Ventas; no agrega menús ni endpoints.
Sustituye el alcance inicial que sólo etiquetaba canceladas con PA en el mes.
La [ampliación de notas de crédito](comisiones-notas-credito.md) las integra al
vendedor resuelto por cliente y separa su columna. El formato vigente tiene
dieciséis columnas individuales; las validaciones de quince columnas abajo
documentan el estado anterior a esa ampliación.

Los filtros **Movimientos desde / hasta** aplican a FAX.AFECHA, tanto para cobros
como para ajustes. Una factura puede tener su PA en septiembre y una cancelación
en octubre, sin repetir ese PA en octubre.

- Cancelación K de factura previamente cobrada: importe propio del K negativo,
  **CANCELADA / REVISAR**.
- Devolución D y nota de crédito C: abono negativo por su fecha del auxiliar,
  aunque no haya PA en el mes, **DEVOLUCIÓN / NOTA DE CRÉDITO / REVISAR**.
- K positivo que cancela un D/C: **REVERSIÓN D/C / REVISAR**, compensando el abono.

Se usan Badge/Alert de shadcn y fondo ámbar. El documento relacionado y la nota
de revisión ayudan a conciliar agente, fecha, importe y costo histórico.
Se mantienen la exclusión de servicios y los ajustes de liquidación existentes.

El backend entrega `rowKey`, `kind`, `eventDate`, `sourceMovementId`,
`relatedInvoiceNumber`, `reviewRequired`, `reviewReasons`. La clave React es
rowKey: un F puede aparecer como cobro y ajuste sin colisión de su DSEQ.
La fuente evita duplicar un D/C registrado tanto en documento propio como aplicado
a una factura. El frontend no vuelve a sumar devoluciones dentro del PA.

Excel conserva las quince columnas y resúmenes aprobados. Usa **Fecha pago / ajuste**,
**Pago / ajuste**, **Devoluciones / NC**, etiqueta en la misma celda Factura y
nota de revisión, sin hojas auxiliares ni columnas ocultas. Costos, utilidad y
comisión mantienen el signo de los ajustes; falta de histórico se muestra vacía,
no como costo cero. El 1% de nuevos conserva su signo y precisión.

Caso FE0064831: septiembre PA 22,690.03 sin IVA; octubre K del 29/10/2026,
**−20,860.84 sin IVA**, sin repetir el cobro. La base actual perdió sus partidas
originales: la disminución es visible y el costo debe conciliarse para completar
su utilidad/comisión. Las tasas del agente se seleccionan en la ventana existente;
no se inventa una tasa histórica para un pago de comisión anterior.

Navegador con API real verifica septiembre, octubre, los cuatro tipos de ajuste,
avisos, comisión negativa con tasa configurada y cinco descargas. Cinco libros
conciliados con API/XML y fórmulas evaluadas independientemente; revisión visual
de pantalla y Excel. Evidencia privada en captures del backend,
`commission-adjustments-20261110`. SQL y cálculos documentados en
`docs/modules/sales/collection-commission-adjustments.md` del backend.

Comprobaciones finales lint/typecheck/build y 249 pruebas del backend aprobadas.
México devuelve 80 renglones en septiembre y 129 en octubre; los libros contienen
una hoja por agente, trece/diecisiete hojas respectivamente. Se mantuvieron
quince columnas individuales y los resúmenes; todas las fórmulas concilian con
la respuesta. La evaluación independiente no es recálculo nativo de Excel.
