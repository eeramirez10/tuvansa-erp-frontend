# Facturación · Cancelar una remisión

En `/facturacion/:invoiceId`, **Cancelar remisión** está disponible para los
folios FAW web y para las remisiones FA históricas que la API identifica con
`cancellationAvailable: true`.

La ventana consulta la fecha, el importe y el pedido de origen. Si hay un
bloqueo, muestra el motivo que devuelve la API. Para cancelar, indica la
fecha dentro del periodo abierto, captura el motivo y confirma la operación.
Si el pedido admite regeneración, puedes marcar **Regenerar pedido**. La
ventana muestra el motivo cuando esa opción está bloqueada.

Al confirmar se actualizan la ficha, el pedido, los movimientos de
inventario y las consultas del cliente. El folio queda disponible con
**Ver cancelación**, que muestra la fecha y el motivo y enlaza al pedido
si se regeneró.

**Sellar** ofrece la simulación de timbrado para los folios FAW web que
habilite la API. La simulación se identifica con **Sin validez fiscal**.
