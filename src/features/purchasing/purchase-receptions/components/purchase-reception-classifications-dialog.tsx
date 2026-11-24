import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { purchaseReceptionKeys, purchaseReceptionPanelQueryOptions } from "@/features/purchasing/purchase-receptions/logic"
import type { PurchaseReception, PurchaseReceptionClassificationPanel } from "@/features/purchasing/purchase-receptions/model"
import { savePurchaseReceptionClassifications } from "@/features/purchasing/purchase-receptions/services/purchase-reception-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

type Props = { reception: PurchaseReception; onClose: () => void }
const schema = z.object({ current: z.array(z.string().max(16)).length(9), revision: z.string() })

function ClassificationForm({ panel, onClose }: { panel: PurchaseReceptionClassificationPanel; onClose: () => void }) {
  const formId = useId()
  const cache = useQueryClient()
  const { purchaseReception: { id, number }, summary, items } = panel
  const { control, formState, handleSubmit, reset } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { current: summary.current, revision: summary.revision },
  })
  const save = useMutation({
    mutationFn: (input: z.infer<typeof schema>) => savePurchaseReceptionClassifications(id, input),
    onSuccess: async (saved) => {
      const detail = purchaseReceptionKeys.detail(id)
      await cache.cancelQueries({ queryKey: detail })
      cache.setQueryData(purchaseReceptionKeys.panel(id, "classifications"), saved)
      cache.setQueryData<PurchaseReception>(detail, (receipt) => receipt && { ...receipt, classifications: saved.summary.current })
      reset({ current: saved.summary.current, revision: saved.summary.revision })
      void cache.invalidateQueries({ queryKey: purchaseReceptionKeys.comments(id) })
    },
  })

  return (
    <ErpDataDialog defaultWidth={460} description={number} title="Clasificadores"
      onOpenChange={(open) => { if (!open && !save.isPending) onClose() }}>
      <ErpDataDialogBody>
        <form className="grid gap-1" onSubmit={handleSubmit((input) => save.mutate(input))}>
          {summary.current.map((original, index) => {
            const controlId = `${formId}-${index}`
            const label = summary.labels[index] ?? ""
            const options = items.filter((item) => item.classifier === index + 1 && item.compositeCode)
            const historical = original && !options.some((item) => item.compositeCode === original) ? original : null
            return (
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-1" key={controlId}>
                <Label className="justify-end text-right text-[9px]" htmlFor={controlId}>{label}</Label>
                <Controller control={control} name={`current.${index}`} render={({ field }) => {
                  const choice = options.find((item) => item.compositeCode === field.value)
                  return (
                    <Select disabled={!summary.canWrite || save.isPending} value={field.value}
                      onValueChange={(next) => { if (typeof next === "string") field.onChange(next) }}>
                      <SelectTrigger aria-label={label || `Clasificador ${index + 1}`} className="w-full text-[9px]"
                        id={controlId} onBlur={field.onBlur} ref={field.ref} size="sm">
                        <SelectValue>{choice ? `${choice.code} ${choice.description}` : field.value}</SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectItem value="">Sin selección</SelectItem>
                        {historical && <SelectItem value={historical}>{historical}</SelectItem>}
                        {options.map((item) => <SelectItem key={item.compositeCode} value={item.compositeCode}>
                          {item.code} {item.description}
                        </SelectItem>)}
                      </SelectContent>
                    </Select>
                  )
                }} />
              </div>
            )
          })}
          {(save.isError || Object.keys(formState.errors).length > 0) &&
            <Alert variant="destructive"><AlertDescription>
              {save.isError ? getApiErrorMessage(save.error) : "Revisa los valores de clasificación."}
            </AlertDescription></Alert>}
          <footer className="mt-1 flex items-center justify-end gap-2">
            {save.isSuccess && !formState.isDirty && <span className="text-muted-foreground" role="status">Clasificadores guardados</span>}
            <Button disabled={!summary.canWrite || !formState.isDirty || save.isPending} size="sm" type="submit">
              {save.isPending && <Spinner />}Guardar
            </Button>
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function PurchaseReceptionClassificationsDialog({ reception, onClose }: Props) {
  const query = useQuery({
    ...purchaseReceptionPanelQueryOptions(reception.id, "classifications"),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    select: (panel) => panel as PurchaseReceptionClassificationPanel,
  })
  if (query.data && query.isFetchedAfterMount && !query.isError) {
    return <ClassificationForm onClose={onClose} panel={query.data} />
  }
  return (
    <ErpDataDialog defaultWidth={460} description={reception.number} title="Clasificadores"
      onOpenChange={(open) => !open && onClose()}>
      <ErpDataDialogBody>
        {query.isError
          ? <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>
          : <div className="grid min-h-48 place-items-center"><Spinner /></div>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
