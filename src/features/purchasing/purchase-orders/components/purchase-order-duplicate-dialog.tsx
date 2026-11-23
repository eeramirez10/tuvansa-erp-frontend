import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState, type ReactNode } from "react"

import { PurchaseOrderSupplierPicker } from "@/features/purchasing/purchase-orders/components/purchase-order-supplier-picker"
import { purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import {
  duplicatePurchaseOrder,
  getPurchaseOrderDuplicate,
  type PurchaseOrderDuplicateFields,
  type PurchaseOrderDuplicatePreparation,
} from "@/features/purchasing/purchase-orders/services/purchase-order-duplicate-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

const fieldClass = "h-6 min-w-0 rounded-sm px-1 text-[10px]"

type DuplicateDialogProps = {
  purchaseOrder: PurchaseOrder
  markedOnly: boolean
  onClose: () => void
  onDuplicated: (order: PurchaseOrder) => void
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid min-w-0 gap-1"><span>{label}</span>{children}</label>
}

function DuplicateDraft({ preparation, markedOnly, onClose, onDuplicated }: Omit<DuplicateDialogProps, "purchaseOrder"> & {
  preparation: PurchaseOrderDuplicatePreparation
}) {
  const queryClient = useQueryClient()
  const supplierPickerId = useId()
  const supplierInputId = useId()
  const [source] = useState(preparation)
  const [requestKey] = useState(() => crypto.randomUUID())
  const [fields, setFields] = useState(() => ({
    ...source.fields,
    orderedAt: source.fields.orderedAt.slice(0, 10),
    from: source.fields.from?.slice(0, 10) ?? null,
  }))
  const [supplierName, setSupplierName] = useState("")
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false)
  const saving = useRef(false)
  const setField = <K extends keyof PurchaseOrderDuplicateFields>(key: K, value: PurchaseOrderDuplicateFields[K]) =>
    setFields((previous) => ({ ...previous, [key]: value }))

  const save = useMutation({
    mutationFn: (draft: PurchaseOrderDuplicateFields) => duplicatePurchaseOrder(source.id, {
      requestKey,
      markedOnly,
      revision: source.revision,
      legacyVersion: source.legacyVersion,
      fields: draft,
    }),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(source.id) })
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.searches() })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
      onDuplicated(order)
    },
    onSettled: () => { saving.current = false },
  })

  function dismiss() {
    if (!saving.current) onClose()
  }

  return (
    <>
      <ErpDataDialog description={source.number} title="Duplicar" defaultWidth={420}
        onOpenChange={(open) => { if (!open) dismiss() }}>
        <ErpDataDialogBody>
          <form className="grid gap-2" onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault()
              event.stopPropagation()
              dismiss()
            }
          }} onSubmit={(event) => {
            event.preventDefault()
            if (saving.current || supplierPickerOpen || !source.canWrite || !fields.supplierCode.trim()) return
            saving.current = true
            save.mutate({
              ...fields,
              supplierCode: fields.supplierCode.trim().toUpperCase(),
              supplierOrderNumber: fields.supplierOrderNumber.trim().toUpperCase(),
              branchCode: fields.branchCode.trim().toUpperCase(),
            })
          }}>
            {source.canWrite ? (
              <>
                <fieldset className="grid grid-cols-2 gap-2" disabled={save.isPending}>
                  <div className="col-span-full grid gap-1">
                    <label htmlFor={supplierInputId}>Proveedor</label>
                    <div className="flex gap-1.5">
                      <Input id={supplierInputId} className={`${fieldClass} w-28 uppercase`} required maxLength={20}
                        value={fields.supplierCode} onChange={(event) => {
                          setField("supplierCode", event.target.value)
                          setSupplierName("")
                        }} />
                      <Button aria-label="Buscar proveedor" type="button" size="xs" variant="outline"
                        onClick={() => setSupplierPickerOpen(true)}>…</Button>
                      {supplierName && <span className="my-auto truncate">{supplierName}</span>}
                    </div>
                  </div>
                  <Field label="Folio"><Input className={fieldClass} readOnly value="Al guardar" /></Field>
                  <Field label="Porcentaje"><Input className={fieldClass} min="0.01" step="0.01" type="number" required
                    value={Number.isFinite(fields.percentage) ? fields.percentage : ""} onChange={(event) => setField("percentage", event.target.valueAsNumber)} /></Field>
                  <Field label="Fecha"><Input className={fieldClass} required type="date" value={fields.orderedAt}
                    onChange={(event) => setField("orderedAt", event.target.value)} /></Field>
                  <Field label="Desde"><Input className={fieldClass} type="date" value={fields.from ?? ""}
                    onChange={(event) => setField("from", event.target.value || null)} /></Field>
                  <Field label="Número ellos"><Input className={`${fieldClass} uppercase`} maxLength={30} value={fields.supplierOrderNumber}
                    onChange={(event) => setField("supplierOrderNumber", event.target.value)} /></Field>
                  <Field label="Sucursal"><Input className={`${fieldClass} uppercase`} maxLength={9} value={fields.branchCode}
                    onChange={(event) => setField("branchCode", event.target.value)} /></Field>
                </fieldset>
                <p className="text-muted-foreground">
                  {markedOnly ? "Partidas marcadas a duplicar" : "Partidas a duplicar"}: {source.lineCount}
                </p>
              </>
            ) : <Alert><AlertDescription>{source.reason}</AlertDescription></Alert>}
            {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
            <footer className="flex justify-end gap-1">
              <Button type="button" size="sm" variant="outline" onClick={dismiss} disabled={save.isPending}>Cancelar</Button>
              {source.canWrite && <Button type="submit" size="sm" disabled={save.isPending || supplierPickerOpen || !fields.supplierCode.trim()}>
                {save.isPending && <Spinner />}OK
              </Button>}
            </footer>
          </form>
        </ErpDataDialogBody>
      </ErpDataDialog>
      {supplierPickerOpen && <DesktopWindowIdentity id={supplierPickerId}>
        <PurchaseOrderSupplierPicker description="Duplicar" initial={fields.supplierCode.trim()}
          onClose={() => setSupplierPickerOpen(false)} onSelect={(supplier) => {
            setField("supplierCode", supplier.code)
            setSupplierName(supplier.name)
            setSupplierPickerOpen(false)
          }} />
      </DesktopWindowIdentity>}
    </>
  )
}

export function PurchaseOrderDuplicateDialog({ purchaseOrder, markedOnly, onClose, onDuplicated }: DuplicateDialogProps) {
  const { id, number } = purchaseOrder
  const preparation = useQuery({
    queryKey: [...purchaseOrderKeys.detail(id), "duplicate", markedOnly],
    queryFn: ({ signal }) => getPurchaseOrderDuplicate(id, markedOnly, signal),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
  if (preparation.data && (preparation.isFetchedAfterMount || !preparation.isFetching)) {
    return <DuplicateDraft preparation={preparation.data} markedOnly={markedOnly} onClose={onClose} onDuplicated={onDuplicated} />
  }
  return (
    <ErpDataDialog description={number} title="Duplicar" defaultWidth={420} onOpenChange={(open) => { if (!open) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        {preparation.isError
          ? <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(preparation.error)}</AlertDescription></Alert>
          : <div aria-label="Cargando partidas" role="status" className="flex min-h-12 items-center justify-center"><Spinner /></div>}
        <footer className="flex justify-end"><Button type="button" size="sm" variant="outline" onClick={onClose}>Cancelar</Button></footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
