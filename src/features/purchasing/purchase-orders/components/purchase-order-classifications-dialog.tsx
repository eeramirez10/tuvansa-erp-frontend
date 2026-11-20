import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { purchaseOrderKeys, purchaseOrderPanelQueryOptions } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderClassificationPanel, PurchaseOrderClassificationUpdate } from "@/features/purchasing/purchase-orders/model"
import { updatePurchaseOrderClassifications } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

type DialogProps = { purchaseOrder: PurchaseOrder; onClose: () => void }

const classificationSchema = z.object({
  current: z.array(z.string().max(16)).length(9),
  revision: z.number().int().nonnegative(),
})

function EditClassifications({ purchaseOrder, panel, onClose }: DialogProps & { panel: PurchaseOrderClassificationPanel }) {
  const formId = useId()
  const queryClient = useQueryClient()
  const { summary, items } = panel
  const { control, handleSubmit, formState } = useForm<PurchaseOrderClassificationUpdate>({
    resolver: zodResolver(classificationSchema),
    defaultValues: { current: summary.current, revision: summary.revision },
  })
  const save = useMutation({
    mutationFn: (update: PurchaseOrderClassificationUpdate) => updatePurchaseOrderClassifications(purchaseOrder.id, update),
    onSuccess: async (saved) => {
      const detailKey = purchaseOrderKeys.detail(purchaseOrder.id)
      await queryClient.cancelQueries({ queryKey: detailKey })
      queryClient.setQueryData(purchaseOrderKeys.panel(purchaseOrder.id, "classifications"), saved)
      queryClient.setQueryData<PurchaseOrder>(detailKey, (order) => order && { ...order, classifications: saved.summary.current })
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.searches() })
      onClose()
    },
  })
  return (
    <ErpDataDialog defaultWidth={520} description={purchaseOrder.number} onOpenChange={(open) => !open && onClose()} title="Clasificar">
      <ErpDataDialogBody>
        <form className="grid gap-1.5" onSubmit={handleSubmit((values) => save.mutate(values))}>
          {summary.current.map((original, index) => {
            const id = `${formId}-${index}`
            const label = summary.labels[index] || `Clasificador ${index + 1}`
            const options = items.filter((item) => item.classifier === index + 1 && item.compositeCode !== "")
            const historicalValue = original && !options.some((item) => item.compositeCode === original) ? original : null
            return (
              <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-1" key={id}>
                <Label className="justify-end text-right text-[9px]" htmlFor={id}>{label}</Label>
                <Controller control={control} name={`current.${index}`} render={({ field }) => {
                  const option = options.find((item) => item.compositeCode === field.value)
                  const selection = option ? `${option.code} ${option.description}` : field.value
                  return (
                    <Select disabled={!summary.canWrite || save.isPending}
                      onValueChange={(next) => { if (typeof next === "string") field.onChange(next) }}
                      value={field.value}>
                      <SelectTrigger className="w-full text-[9px]" id={id} onBlur={field.onBlur} ref={field.ref} size="sm">
                        <SelectValue>{selection || "Sin selección"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectItem value="">Sin selección</SelectItem>
                        {historicalValue && <SelectItem value={historicalValue}>{historicalValue}</SelectItem>}
                        {options.map((item) => (
                          <SelectItem key={item.compositeCode} value={item.compositeCode}>{item.code} {item.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }} />
              </div>
            )
          })}
          {(save.isError || Object.keys(formState.errors).length > 0) &&
            <Alert variant="destructive"><AlertTitle>No fue posible guardar</AlertTitle><AlertDescription>
              {save.isError ? getApiErrorMessage(save.error) : "Revisa los valores de clasificación."}
            </AlertDescription></Alert>}
          <footer className="flex justify-end gap-1">
            {summary.canWrite && <Button disabled={!formState.isDirty || save.isPending} size="sm" type="submit">
              {save.isPending && <Spinner />}Guardar
            </Button>}
            <Button disabled={save.isPending} onClick={onClose} size="sm" type="button" variant="outline">{summary.canWrite ? "Cancelar" : "Cerrar"}</Button>
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function PurchaseOrderClassificationsDialog({ purchaseOrder, onClose }: DialogProps) {
  const query = useQuery({
    ...purchaseOrderPanelQueryOptions(purchaseOrder.id, "classifications"),
    refetchOnMount: "always",
    select: (data) => data as PurchaseOrderClassificationPanel,
  })
  if (query.data && (query.isFetchedAfterMount || !query.isFetching)) {
    return <EditClassifications key={query.data.summary.revision} onClose={onClose} panel={query.data} purchaseOrder={purchaseOrder} />
  }
  return (
    <ErpDataDialog defaultWidth={520} description={purchaseOrder.number} onOpenChange={(open) => !open && onClose()} title="Clasificar">
      <ErpDataDialogBody>
        {query.isError
          ? <Alert variant="destructive"><AlertTitle>No fue posible cargar</AlertTitle><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>
          : <div className="grid min-h-48 place-items-center"><Spinner /></div>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
