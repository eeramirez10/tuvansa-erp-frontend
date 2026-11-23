import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PurchaseOrderLineEditor } from "@/features/purchasing/purchase-orders/components/purchase-order-line-editor"
import { purchaseOrderEditorQueryOptions, purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrderEditLine, PurchaseOrderEditor } from "@/features/purchasing/purchase-orders/model"
import { editPurchaseOrder, searchPurchaseOrderEditProducts } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

function EditLines({ editor, onClose }: { editor: PurchaseOrderEditor; onClose: () => void }) {
  const { id, number, revision, legacyVersion, priceLocked, supplierUnits } = editor
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: (input: { removeZero: boolean; lines: PurchaseOrderEditLine[] }) =>
      editPurchaseOrder(id, { ...input, revision, legacyVersion }),
    onSuccess: async (saved) => {
      const detailKey = purchaseOrderKeys.detail(id)
      await queryClient.cancelQueries({ queryKey: detailKey })
      queryClient.setQueryData(detailKey, saved)
      void queryClient.invalidateQueries({ queryKey: detailKey, predicate: (entry) => entry.queryKey.length > detailKey.length })
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.searches() })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
      onClose()
    },
  })
  return <PurchaseOrderLineEditor
    description={number} title="Cambio de orden de compra" windowId={`purchase-orders:${id}:edit`}
    initialLines={editor.lines} priceLocked={priceLocked} supplierUnits={supplierUnits}
    lookup={{ key: [...purchaseOrderKeys.editor(id), "products"], search: (query, signal) => searchPurchaseOrderEditProducts(id, query, signal) }}
    error={save.isError ? getApiErrorMessage(save.error) : ""} saving={save.isPending}
    onClose={onClose} onSubmit={(lines, removeZero) => save.mutate({ lines, removeZero })}
  />
}

export function PurchaseOrderEditDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const query = useQuery(purchaseOrderEditorQueryOptions(id))
  const editor = query.data
  if (editor?.canWrite && (query.isFetchedAfterMount || !query.isFetching)) {
    return <EditLines editor={editor} key={editor.revision} onClose={onClose} />
  }
  return (
    <ErpDataDialog defaultWidth={550} title="Cambio de orden de compra" description={editor?.number ?? "Orden de compra"}
      onOpenChange={(open) => !open && onClose()}>
      <ErpDataDialogBody className="grid gap-1">
        {query.isError ? <Alert variant="destructive"><AlertTitle>No fue posible abrir la orden</AlertTitle>
          <AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>
          : query.isFetching ? <div className="grid min-h-32 place-items-center"><Spinner /></div>
            : <Alert><AlertDescription>{editor?.reason}</AlertDescription></Alert>}
        <div className="flex justify-end"><Button onClick={onClose} size="sm" variant="outline">Cerrar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
