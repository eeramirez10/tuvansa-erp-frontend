import { useMutation, useQuery } from "@tanstack/react-query"
import { useRef } from "react"
import { productRemovalQueryOptions } from "@/features/inventories/products/logic"
import type { Product, ProductRemovalInput } from "@/features/inventories/products/model"
import { deleteProduct } from "@/features/inventories/products/services/product-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

export function ProductRemovalDialog({ product, onClose, onDeleted }: {
  product: Product
  onClose: () => void
  onDeleted: (product: Product) => Promise<void>
}) {
  const query = useQuery(productRemovalQueryOptions(product.id))
  const inFlight = useRef(false)
  const removal = useMutation({
    mutationFn: (input: ProductRemovalInput) => deleteProduct(product.id, input),
    onSuccess: () => onDeleted(product),
    onSettled: () => { inFlight.current = false },
  })
  const preview = query.data
  const canDelete = preview?.canDelete === true && Boolean(preview.revision) && !query.isFetching && !query.isError
  const failed = query.isError || removal.isError

  function close() {
    if (!inFlight.current) onClose()
  }

  function confirm() {
    if (!canDelete || !preview?.revision || inFlight.current || removal.isError) return
    inFlight.current = true
    removal.mutate({ code: preview.code, revision: preview.revision })
  }

  return (
    <ErpDataDialog defaultWidth={440} description={`Baja de ${product.code}`}
      onOpenChange={open => { if (!open) close() }} title="Baja de producto">
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal" onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); close() }
      }}>
        <p className="font-medium">{preview?.code ?? product.code} · {product.description}</p>
        {query.isFetching && <div className="flex items-center gap-2" role="status"><Spinner /> Verificando la baja…</div>}
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        {preview && !query.isFetching && !query.isError && (
          canDelete
            ? <p>¿Lo doy de baja?</p>
            : <Alert role="status"><AlertDescription>{preview.reason || "La baja no está disponible para este producto."}</AlertDescription></Alert>
        )}
        {removal.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(removal.error)}</AlertDescription></Alert>}
        <footer className="flex flex-wrap justify-end gap-1">
          <Button autoFocus disabled={removal.isPending} onClick={close} size="sm" type="button" variant="outline">
            {canDelete ? "No" : "Cerrar"}
          </Button>
          {failed && <Button disabled={query.isFetching || removal.isPending} onClick={() => {
            removal.reset()
            void query.refetch()
          }} size="sm" type="button" variant="outline">Volver a verificar</Button>}
          {canDelete && <Button disabled={removal.isPending || failed} onClick={confirm} size="sm" type="button" variant="destructive">
            {removal.isPending && <Spinner />}
            Sí, dar de baja
          </Button>}
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
