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
convierten en ingresos por ABS. Sólo Pago visible permanece positivo. El resumen
usa la cobranza firmada calculada por la API. Recurrente e Inactivo generan cero.
Una marca desconocida genera bono pendiente/null, sin inventar clasificación.
El detalle conserva cuatro decimales; el subtotal del agente redondea a centavos.
El total suma esos subtotales, evitando redondear antes cada documento.

El detalle en pantalla tiene 21 columnas: las 18 posiciones anteriores, con
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

La columna **$ comisión** del resumen general (L) calcula siempre
`ROUND(Hfila*Kfila,2)`: utilidad neta por porcentaje de comisión. El resumen
individual y la API muestran el mismo importe, incluso si la modalidad del 1%
sigue por confirmar. Ejemplo: 509,982.76 × 9% = 45,898.45. Una tasa conocida de
cero muestra 0.00; sin tasa o sin utilidad neta queda vacío. La revisión global
puede seguir pendiente, pero no oculta comisiones ya calculables.

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

La corrección del 2026-11-09 usa el Excel original y la captura del bloque azul
proporcionada por el usuario. El orden es exactamente:

1. **Ventas por agente**: agente y las quince columnas del detalle, agrupados por
   agente y ordenados por fecha de factura, folio e identificador. Subtotales de
   todos los importes por agente y total general que suma sólo esos subtotales.
2. **Comisiones Sep 26 Mex** (nombre dinámico por periodo/sucursal): exactamente
   tres filas por vendedor, normal, clientes nuevos/recuperados y lento movimiento;
   conserva las posiciones del resumen original y totaliza las comisiones.
3. **Una hoja por vendedor**: sólo Cliente, Fecha documento, Fecha pago, Factura,
   Días, Subtotal, Devoluciones, Total, Pago, Costo, Costo real, Utilidad, %%,
   Cliente nuevo y 1% de lo pagado.
   Todas son visibles; no hay columnas auxiliares ocultas.

Las dos columnas finales se agregan por solicitud posterior: sólo la marca
`Nuevo` muestra **nuevo**, en minúsculas, y el 1% del pago sin IVA. Recurrente,
Inactivo, Viejo recuperado y Sin clasificar quedan vacíos en ambas columnas.
Se conserva precisión de cuatro decimales por documento, subtotal redondeado por
agente y total que suma esos subtotales. No altera el incentivo de recuperados
ya incluido en la liquidación; estas columnas identifican exclusivamente nuevos.

Desde el 2026-11-10 se incluyen canceladas con pagos PA del periodo, con el
letrero **CANCELADA** en la misma celda Factura (segunda línea roja) y en pantalla
con Badge shadcn. No añade columnas ni hojas. Se usa el estado actual del ERP;
sin fecha de cancelación disponible no se incorporan pagos de meses ajenos al
rango ni se revierten comisiones previas automáticamente. Si se borraron el
subtotal o las partidas originales al cancelar, se muestra el PA conocido y se
dejan costo/utilidad no disponibles, sin sustituirlos por cero.

Verificación con API real de septiembre/México: 70 documentos, uno cancelado,
con las 69 facturas previas sin cambios. Cuatro descargas, 12 hojas/441 fórmulas,
letrero en ambas hojas de detalle y pagos/costos contrastados con la respuesta;
fórmulas evaluadas independientemente. Evidencia privada en
`captures/ui/new-version/commission-cancellations-20261110/` del backend.
Frontend lint/typecheck/build y 238 pruebas del backend aprobados.

Debajo de los documentos y su total aparece únicamente el resumen de **14 filas**
de la captura: NOMBRE, COBRANZA DEL MES…, COSTO, UTILIDAD BRUTA, % UTILIDAD ANTES
DE GRATIFICACIONES Y FLETES, FLETE ENTREGA, GRATIFICIONES, UTILIDAD NETA,
% UTILIDAD NETA, % COMISION DE ACUERDO A TABLA DE VENDEDOR, % COMISION,
$ COMISION, PRODUCTO DE LENTO MOVIMIENTO y CLIENTES NUEVOS. Etiquetas azules,
valores blancos, bordes negros y alineación centrada. La última fila incluye
también el incentivo de Viejo recuperado, explicado en la nota de celda.

Diez agentes producen **12 hojas**. No se exportan Tarifas, Neto a recibir,
OTROS, reparto, hojas de auditoría ni secciones adicionales. Los ajustes se
realizan en la ventana existente antes de descargar. Las posiciones de vendedores/
cotizadores del resumen general se conservan; sin un reparto individual confirmado,
la comisión permanece asignada al grupo del agente y no se inventan beneficiarios.

Costo real proporcional al PA original sin IVA/DBRUTO, conservando el cálculo
decimal del backend; por ejemplo, costo 33.34, factura 100 y pago 25 producen
costo real 8.34 y utilidad 16.66. Cobranza/costo del bloque son la respuesta
vigente del servidor, con la modalidad seleccionada y los contramovimientos.
Bruta, neta, porcentajes, comisión y totales usan fórmulas internas con resultados
guardados. Pendientes vacíos, fechas numéricas, áreas de impresión y sin enlaces
al libro original. Las marcas de cliente no se escriben desde el reporte.

## Validación

Consulta de septiembre 2026, México: 69 facturas, 71 PA, cobranza presentada
5,211,970.96. Trece documentos elegibles, base 158,708.82 y bono 1,587.09.
Marcas actuales: 45 Recurrente, 11 Inactivo y 13 Nuevo. La rama Viejo recuperado
y marcas desconocidas se prueban con fixtures. Los costos y pagos fuente no cambian.
No se exige igualar los totales del ejemplo, que contiene ajustes/agrupaciones manuales.

Validación anterior: navegador/API real, 21 columnas, bono, ambos modos, ajustes manuales, exportación
obsoleta bloqueada y conservación al aplicar. Cuatro libros contrastados con API
y XML: 18 hojas, 1,239 fórmulas por archivo, fechas/importes/pedientes y sin vínculos
externos ni cachés de error. No se afirma recálculo nativo de Excel. Los parámetros
de simulación de estas pruebas no se convierten en configuración global del usuario.
Evidencia privada en captures del backend, carpetas commission-settlement-20261109.

Validaciones finales `pnpm lint`, `pnpm typecheck`, `pnpm build` aprobadas.
El navegador comprueba también fallo/reintento del recálculo sin exportar
datos obsoletos. Backend: 233 pruebas aprobadas, incluidas precisión del 1%,
sentido del PA, reglas de liquidación y frontera HTTP de sólo lectura.

Corrección de formato: cuatro descargas con API real contrastadas por XML,
12 hojas y 420 fórmulas por archivo; trece columnas por vendedor, orden por fecha,
tres filas por agente y catorce filas azules. Cada importe y total concilia con
la respuesta; un evaluador independiente comprueba la aritmética de las 420
fórmulas, sin afirmar recálculo nativo de Excel. Sin columnas/hojas ocultas ni enlaces externos. Evidencia privada
`captures/ui/new-version/commission-layout-20261109/` del backend. Backend:
234 pruebas aprobadas, incluida ordenación por fecha y cobertura de pagos parciales.

Adición posterior de columnas de clientes nuevos: cuatro libros conciliados con
la API, 15 columnas individuales y 16 en Ventas por agente, 441 fórmulas por libro.
Fixtures verifican que sólo Nuevo se marque, el 1% preciso, otras marcas vacías,
pagos no disponibles y redondeo por agente (también signos negativos). El resumen
de tres filas y bloque azul permanecen iguales. Evidencia privada en
`captures/ui/new-version/commission-new-customers-20261109/` del backend.

Corrección de comisión normal: navegador/API real y cuatro descargas verifican
45,898.45 para el perfil del 9% sin seleccionar antes la modalidad del bono.
441 fórmulas por libro conciliadas y evaluadas independientemente. Casos con
tasa cero, tasa desconocida y utilidad no disponible conservan su comportamiento.
Evidencia privada `captures/ui/new-version/commission-amounts-20261109/` del backend;
235 pruebas del backend, lint/build y lint/typecheck/build del frontend aprobados.
