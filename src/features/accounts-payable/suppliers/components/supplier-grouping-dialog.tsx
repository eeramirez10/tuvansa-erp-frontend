import { useMutation } from "@tanstack/react-query"
import { useRef } from "react"
import type { SupplierGroupingPosition } from "@/features/accounts-payable/suppliers/model"
import { groupSupplierBalance } from "@/features/accounts-payable/suppliers/services/supplier-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })
const position = ({ id, revision }: SupplierGroupingPosition) => ({ id, revision })

export function SupplierGroupingDialog({ supplierId, target, sources, onClose, onSaved }: {
  supplierId: number
  target: SupplierGroupingPosition
  sources: SupplierGroupingPosition[]
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const key = useRef<string>(null)
  const inFlight = useRef(false)
  const save = useMutation({
    mutationFn: (requestKey: string) => groupSupplierBalance(supplierId, {
      requestKey, target: position(target), sources: sources.map(position),
    }),
    onSuccess: onSaved,
    onSettled: () => { inFlight.current = false },
  })
  const amount = sources.reduce((total, source) => total + source.amount, 0)
  const close = () => { if (!inFlight.current) onClose() }

  return (
    <ErpDataDialog defaultWidth={425} description="Traslado de los saldos pendientes de los documentos marcados."
      onOpenChange={(open) => { if (!open) close() }} title="Agrupar documentos" tone="payable">
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal">
        <p>Trasladar {currency.format(amount)} de {sources.length} {sources.length === 1 ? "documento" : "documentos"} a {target.document}.</p>
        <p>Saldo de {target.document} después de agrupar {currency.format(target.amount + amount)}.</p>
        {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
        <footer className="flex justify-end gap-1">
          <Button autoFocus disabled={save.isPending} onClick={close} type="button" size="sm" variant="outline">Cancelar</Button>
          <Button disabled={save.isPending} onClick={() => {
            if (inFlight.current) return
            inFlight.current = true
            key.current ??= crypto.randomUUID()
            save.mutate(key.current)
          }} type="button" size="sm">{save.isPending ? "Guardando…" : save.isError ? "Reintentar" : "Confirmar"}</Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
