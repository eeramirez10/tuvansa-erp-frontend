import { useMutation, useQuery } from "@tanstack/react-query"
import { useRef } from "react"
import { supplierEditQueryOptions } from "@/features/accounts-payable/suppliers/logic"
import type { Supplier } from "@/features/accounts-payable/suppliers/model"
import { removeSupplier } from "@/features/accounts-payable/suppliers/services/supplier-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

export function SupplierRemovalDialog({ supplier, onClose, onRemoved }: {
  supplier: Supplier
  onClose: () => void
  onRemoved: () => Promise<void>
}) {
  const query = useQuery(supplierEditQueryOptions(supplier.id))
  const inFlight = useRef(false)
  const removal = useMutation({
    mutationFn: (revision: string) => removeSupplier(supplier.id, revision),
    onSuccess: onRemoved,
    onSettled: () => { inFlight.current = false },
  })
  const preview = query.data
  const ready = !query.isFetching && !query.isError
  const blocked = preview && (!preview.writable || preview.deletionReason !== null)
  const canRemove = ready && Boolean(preview?.revision) && !blocked
  const failed = query.isError || removal.isError
  const close = () => { if (!inFlight.current) onClose() }

  function confirm() {
    if (!canRemove || !preview?.revision || inFlight.current || removal.isError) return
    inFlight.current = true
    removal.mutate(preview.revision)
  }

  return (
    <ErpDataDialog defaultWidth={465} description={`Baja del proveedor ${supplier.code}`}
      onOpenChange={open => { if (!open) close() }} title="Baja de proveedores" tone="payable">
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal" onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); close() }
      }}>
        <p className="font-medium">{preview?.fields.code ?? supplier.code} · {preview?.fields.name ?? supplier.name}</p>
        {query.isFetching && <p className="flex items-center gap-1" role="status"><Spinner /> Verificando la baja…</p>}
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        {ready && blocked && <Alert role="status">
          <AlertDescription>{preview?.deletionReason || preview?.reason || "La baja no está disponible para este proveedor."}</AlertDescription>
        </Alert>}
        {canRemove && <p>¿Está seguro de querer borrar al proveedor {preview?.fields.code}?</p>}
        {removal.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(removal.error)}</AlertDescription></Alert>}
        <footer className="flex flex-wrap justify-end gap-1">
          <Button autoFocus disabled={removal.isPending} onClick={close} size="sm" type="button" variant="outline">
            {canRemove ? "No" : "Cerrar"}
          </Button>
          {failed && <Button disabled={query.isFetching || removal.isPending} onClick={() => {
            removal.reset()
            void query.refetch()
          }} size="sm" type="button" variant="outline">Volver a verificar</Button>}
          {canRemove && <Button disabled={removal.isPending || failed} onClick={confirm} size="sm" type="button" variant="destructive">
            {removal.isPending && <Spinner />}
            Sí, dar de baja
          </Button>}
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
