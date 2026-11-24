import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, type FormEvent } from "react"
import { productKeys } from "@/features/inventories/products/logic"
import { purchaseReceptionKeys, purchaseReceptionPieceLineQueryOptions } from "@/features/purchasing/purchase-receptions/logic"
import type { PurchaseReception, PurchaseReceptionLine, PurchaseReceptionPieceLine } from "@/features/purchasing/purchase-receptions/model"
import {
  addPurchaseReceptionPiece,
  editPurchaseReceptionLinePieces,
} from "@/features/purchasing/purchase-receptions/services/purchase-reception-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

export function PurchaseReceptionPieceLineDialog({ reception, line, mode, onClose }: {
  reception: PurchaseReception
  line: PurchaseReceptionLine
  mode: "add" | "edit"
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const detailKey = purchaseReceptionKeys.detail(reception.id)
  const request = useRef<{ fingerprint: string; key: string } | null>(null)
  const adding = mode === "add"
  const preview = useQuery(purchaseReceptionPieceLineQueryOptions(reception.id, line.id))
  const save = useMutation({
    mutationFn: async ({ form, snapshot }: { form: FormData; snapshot: PurchaseReceptionPieceLine }) => {
      if (!adding) {
        await editPurchaseReceptionLinePieces(reception.id, line.id, {
          pieces: String(form.get("pieces") ?? ""),
          revision: snapshot.revision,
        })
        return true
      }
      const number = Number(form.get("quantity"))
      const serial = String(form.get("serial") ?? "").trim()
      const reference = String(form.get("reference") ?? "").trim()
      const fingerprint = JSON.stringify([serial, number, reference, snapshot.revision])
      if (request.current?.fingerprint !== fingerprint) {
        request.current = { fingerprint, key: crypto.randomUUID() }
      }
      await addPurchaseReceptionPiece(reception.id, line.id, {
        serial, quantity: number, reference, requestKey: request.current.key, revision: snapshot.revision,
      })
      request.current = null
      return number >= snapshot.remaining
    },
    onSuccess: async (close) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: detailKey }),
        adding && queryClient.invalidateQueries({ queryKey: productKeys.panel(line.productId, "other-data") }),
      ])
      if (close) onClose()
    },
  })
  const snapshot = preview.data
  const canSave = adding ? snapshot?.canAdd : snapshot?.canEdit
  const reason = adding ? snapshot?.addReason : snapshot?.editReason
  const busy = preview.isFetching || save.isPending
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (snapshot && canSave && !busy) save.mutate({ form: new FormData(event.currentTarget), snapshot })
  }

  return (
    <ErpDataDialog defaultWidth={adding ? 365 : 315} description={`${reception.number} · ${line.productCode}`}
      onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} title={adding ? "Alta de piezas" : "Cambio pzas"}>
      <ErpDataDialogBody className="grid gap-2">
        {preview.isPending && <div className="grid min-h-20 place-items-center"><Spinner /></div>}
        {preview.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(preview.error)}</AlertDescription></Alert>}
        {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
        {reason && <p className="text-muted-foreground" role="status">{reason}</p>}
        <form className="grid gap-2" key={snapshot?.revision} onSubmit={submit}>
          {snapshot && canSave && (
            <fieldset className="grid gap-2" disabled={busy}>
              {adding ? (
                <>
                  <Label className="grid gap-1">PIEZA #<Input autoFocus defaultValue={snapshot.suggestedSerial} maxLength={30} name="serial" required /></Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Label className="grid gap-1">Cant.<Input defaultValue={Math.min(1, snapshot.remaining)} max={snapshot.remaining}
                      min={0.001} name="quantity" required step="0.001" type="number" /></Label>
                    <Label className="grid gap-1">Pzas por paquete<Input readOnly value="1" /></Label>
                  </div>
                  <Label className="grid gap-1">Referencia<Input maxLength={15} name="reference" /></Label>
                  <Label className="grid gap-1">Código<Input readOnly value={snapshot.productCode} /></Label>
                  <Label className="grid gap-1">Descripción<Input readOnly value={snapshot.description} /></Label>
                </>
              ) : (
                <Label className="grid gap-1">Valor<Input autoFocus defaultValue={snapshot.pieces} maxLength={24000} name="pieces" /></Label>
              )}
            </fieldset>
          )}
          <footer className="flex justify-end gap-1">
            <Button disabled={save.isPending} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
            {canSave && <Button disabled={busy} size="sm" type="submit">{save.isPending ? "Guardando…" : "OK"}</Button>}
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
