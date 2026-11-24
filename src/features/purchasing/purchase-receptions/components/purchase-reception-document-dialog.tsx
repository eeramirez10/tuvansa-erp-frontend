import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { supplierKeys } from "@/features/accounts-payable/suppliers/logic"
import { purchaseReceptionDocumentingQueryOptions, purchaseReceptionKeys } from "@/features/purchasing/purchase-receptions/logic"
import type { PurchaseReception, PurchaseReceptionDocumenting } from "@/features/purchasing/purchase-receptions/model"
import { documentPurchaseReception } from "@/features/purchasing/purchase-receptions/services/purchase-reception-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const rowNumbers = [0, 1, 2, 3] as const
const cents = (amount: string | number) => Math.round(Number(amount) * 100)
const rowSchema = z.object({
  number: z.string().trim().max(13),
  amount: z.string().refine((value) => value === "" || /^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(value)),
}).refine(({ number, amount }) => number.length > 0 ? cents(amount) > 0 : cents(amount) === 0)
const schema = z.object({ rows: z.tuple([rowSchema, rowSchema, rowSchema, rowSchema]) })
type Form = z.infer<typeof schema>

function DocumentForm({ editor, onClose }: { editor: PurchaseReceptionDocumenting; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [snapshot] = useState(editor)
  const { reception, amount, revision, canWrite, reason, documents } = snapshot
  const request = useRef<{ signature: string; key: string } | null>(null)
  const { register, control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { rows: rowNumbers.map((index) => ({
      number: documents[index]?.number ?? "",
      amount: documents[index] ? documents[index].amount.toFixed(2) : "",
    })) as Form["rows"] },
  })
  const rows = useWatch({ control, name: "rows" })
  const difference = cents(amount) - rows.reduce((total, row) => total + (cents(row.amount) || 0), 0)
  const save = useMutation({
    mutationFn: (values: Form) => {
      const documents = values.rows.filter(({ number }) => number).map(({ number, amount }) => ({ number, amount: cents(amount) / 100 }))
      const signature = JSON.stringify([revision, documents])
      if (request.current?.signature !== signature) request.current = { signature, key: crypto.randomUUID() }
      return documentPurchaseReception(reception.id, { requestKey: request.current.key, revision, documents })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseReceptionKeys.all })
      void queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      onClose()
    },
  })
  const cancel = () => { if (!save.isPending) onClose() }

  return (
    <ErpDataDialog defaultWidth={420} title="Documenta" description={reception.number} onOpenChange={(open) => !open && cancel()}>
      <ErpDataDialogBody>
        <form className="grid gap-2" onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel() }
        }} onSubmit={(event) => void handleSubmit((values) => {
          if (canWrite && !save.isPending && difference === 0) save.mutate(values)
        })(event)}>
          {reason && <Alert><AlertDescription>{reason}</AlertDescription></Alert>}
          {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
          {formState.errors.rows && <Alert variant="destructive">
            <AlertDescription>Captura un folio y un importe positivo de hasta dos decimales en cada renglón utilizado.</AlertDescription>
          </Alert>}
          <fieldset className="grid grid-cols-2 gap-1" disabled={save.isPending || !canWrite}>
            <span className="font-medium">Documento</span><span className="font-medium">Importe</span>
            {rowNumbers.map((index) => <div key={index} className="contents">
              <Input aria-label={`Documento ${index + 1}`} autoFocus={index === 0 && canWrite}
                maxLength={13} {...register(`rows.${index}.number`)} />
              <Input aria-label={`Importe ${index + 1}`} className="text-right tabular-nums"
                type="number" min={0} step={0.01} {...register(`rows.${index}.amount`)} />
            </div>)}
          </fieldset>
          <label className="grid grid-cols-2 items-center gap-1 font-medium">
            Diferencia
            <Input className="text-right tabular-nums" readOnly value={money.format(difference / 100)} />
          </label>
          <footer className="flex justify-end gap-1">
            {canWrite && <Button disabled={save.isPending || difference !== 0} type="submit" size="sm">
              {save.isPending ? "Guardando…" : "OK"}
            </Button>}
            <Button disabled={save.isPending} onClick={cancel} size="sm" type="button" variant="outline">
              {canWrite ? "Cancelar" : "Cerrar"}
            </Button>
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function PurchaseReceptionDocumentDialog({ reception, onClose }: { reception: PurchaseReception; onClose: () => void }) {
  const query = useQuery(purchaseReceptionDocumentingQueryOptions(reception.id))
  if (query.data && query.isFetchedAfterMount) return <DocumentForm editor={query.data} onClose={onClose} />
  return (
    <ErpDataDialog defaultWidth={420} title="Documenta" description={reception.number} onOpenChange={(open) => !open && onClose()}>
      <ErpDataDialogBody>
        {query.isError
          ? <><Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>
            <Button className="mt-2" onClick={onClose} size="sm" type="button">Cerrar</Button></>
          : <div className="grid min-h-20 place-items-center"><Spinner /></div>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
