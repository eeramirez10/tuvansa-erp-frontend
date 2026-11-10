# Notas de crédito en la hoja de cada vendedor

Actualización 2026-11-10. Misma ruta de Ventas y mismos GET/POST de Comisiones
por Cobranza. La API resuelve la asignación; el frontend no cruza ni reparte
clientes o documentos por su cuenta.

La nota C y su reversión se integran al agente de la última factura vigente
del mismo cliente y compañía hasta el cierre elegido. Si falta una factura,
se usa el agente válido del catálogo del cliente; si ambos faltan, se conserva
el documental con aviso. No se elimina una nota por falta de cobros en el mes
ni se repite para varios vendedores. No cambia el agente de PA, D ni K de F.

Pantalla usa Table/Badge/Alert compartidos de shadcn. Una nota reasignada muestra
**Reasignada por cliente · antes [agente]**; el aviso REVISAR conserva la razón.
El filtro Agente llega a la API y opera sobre la asignación resuelta, por lo
que la vista individual incluye también las notas de agentes anteriores.

| Vista / control | Evento | Endpoint relativo a /api |
| --- | --- | --- |
| Agente / Vista previa | Consultar movimientos del vendedor resuelto | GET /sales/reports/collection-commissions |
| Resumen por agente | Mostrar Devoluciones y Notas de crédito separadas | Sin HTTP adicional |
| Liquidación y ajustes | Calcular en el agente asignado | POST /sales/reports/collection-commissions/preview |
| Descargar Excel | Hoja general, resumen y una hoja por agente | Sin HTTP adicional |

Modelo: creditNoteAmount por fila y creditNotes por agente/total. returnAmount
y returns quedan sólo para devoluciones. C negativa y reversión positiva se
compensan en Notas de crédito. Subtotal + Devoluciones + Notas de crédito = Total
cuando todos son conocidos. Se mantienen importes sin IVA y costos históricos.
originalAgentCode/originalAgentName, agentAssignment y agentReassigned aportan
trazabilidad; el folio Excel guarda una nota con ambos agentes y la razón.

Excel: **dieciséis columnas** individuales (diecisiete en la hoja general),
con **Notas de crédito** entre Devoluciones y Total. Se actualizan fórmulas,
subtotales, formatos de dinero/porcentaje, la marca nuevo, su 1% y el área de
impresión hasta P. Se conservan tres filas de resumen por agente y el bloque
azul de catorce filas. No se crean hojas de agentes antiguos sin movimientos
propios: sus notas reasignadas aparecen en el vendedor resuelto.

Verificado con API real: México septiembre/octubre, reasignaciones 1277→1223,
1202/1254→1231, notas y reversiones, filtros individuales contra todos, resumen,
liquidación adicional/exclusiva y cinco descargas. Libros conciliados con API
por fila y total; fórmulas evaluadas independientemente, sin afirmar recálculo
nativo de Excel. Octubre tiene quince hojas (trece agentes), septiembre doce
(diez agentes). Lint/typecheck/build aprobados; backend 253 pruebas.
SQL derivado y reglas completas en docs/modules/sales/collection-credit-note-agents.md
del backend. Evidencia local privada en captures, `credit-agent-20261110`.
