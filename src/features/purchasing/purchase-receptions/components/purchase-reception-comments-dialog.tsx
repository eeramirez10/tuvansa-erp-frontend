import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type ComponentProps } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { purchaseReceptionCommentsQueryOptions, purchaseReceptionKeys } from "@/features/purchasing/purchase-receptions/logic"
import type { PurchaseReception, PurchaseReceptionComments } from "@/features/purchasing/purchase-receptions/model"
import { savePurchaseReceptionComments } from "@/features/purchasing/purchase-receptions/services/purchase-reception-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Textarea } from "@/shared/ui/textarea"

const dates = z.union([z.iso.date(), z.literal("")])
const formSchema = z.object({
  dueAt: dates,
  supplierReference: z.string().max(30),
  department: z.string().max(13),
  orderNumber: z.string().max(15),
  transportCode: z.string().max(4),
  processDate: dates,
  otherLabel: z.string().max(20),
  boxes: z.int(),
  volume: z.number().refine((value) => Number.isSafeInteger(Math.round(value * 100)) && Number(value.toFixed(2)) === value),
  folio: z.string().max(15),
  folioAt: dates,
  lines: z.tuple([z.string().max(100), z.string().max(100), z.string().max(100), z.string().max(140), z.string().max(3000)]),
  amountInWords: z.string().max(350),
  warehouse: z.string().max(10),
})

type Fields = z.infer<typeof formSchema>
const shortLines = [0, 1, 2, 3] as const
const shortLengths = [100, 100, 100, 140] as const
const inputClass = "h-6 min-w-0 px-1 text-[10px]"

function Field({ label, ...input }: ComponentProps<typeof Input> & { label: string }) {
  return <label className="grid min-w-0 gap-0.5">
    <span>{label}</span>
    <Input className={inputClass} {...input} />
  </label>
}

function CommentsForm({ editor, onClose }: { editor: PurchaseReceptionComments; onClose: () => void }) {
  const [snapshot] = useState(editor)
  const { fields, labels, reception, revision, canWrite, reason } = snapshot
  const queryClient = useQueryClient()
  const { register, control, handleSubmit, formState } = useForm<Fields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...fields, dueAt: fields.dueAt ?? "", processDate: fields.processDate ?? "", folioAt: fields.folioAt?.slice(0, 10) ?? "",
    },
  })
  const transportCode = useWatch({ control, name: "transportCode" })
  const save = useMutation({
    mutationFn: (values: Fields) => savePurchaseReceptionComments(reception.id, {
      revision,
      fields: {
        ...values,
        dueAt: values.dueAt || null,
        processDate: values.processDate || null,
        folioAt: values.folioAt === fields.folioAt?.slice(0, 10) ? fields.folioAt : values.folioAt || null,
      },
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseReceptionKeys.all })
      onClose()
    },
  })
  const cancel = () => { if (!save.isPending) onClose() }
  return (
    <ErpDataDialog defaultWidth={880} description={reception.number} onOpenChange={(open) => !open && cancel()} title="Comentarios de recepción">
      <ErpDataDialogBody className="text-[10px]">
        <form className="grid gap-2" onKeyDown={(event) => {
          if (event.key === "Escape") { event.stopPropagation(); event.preventDefault(); cancel() }
        }} onSubmit={(event) => void handleSubmit((values) => {
          if (canWrite && !save.isPending) save.mutate(values)
        })(event)}>
          {reason && <Alert><AlertDescription>{reason}</AlertDescription></Alert>}
          {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
          {Object.keys(formState.errors).length > 0 && <Alert variant="destructive">
            <AlertDescription>Revisa las fechas, cantidades y longitudes de los campos.</AlertDescription>
          </Alert>}
          <fieldset className="grid gap-2" disabled={!canWrite || save.isPending}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Field label="Documento" readOnly value={reception.number} />
              <Field label="Vence" type="date" {...register("dueAt")} />
              <Field label="Departamento" maxLength={13} {...register("department")} />
              <Field label="Fecha prog" type="date" {...register("processDate")} />
              <Field label="Proveedor" readOnly value={reception.supplierCode} />
              <Field label="Referencia" maxLength={Math.max(23, fields.supplierReference.length)} {...register("supplierReference")} />
              <Field label="Orden de Compra" maxLength={Math.max(13, fields.orderNumber.length)} {...register("orderNumber")} />
              <Field label="Almacén" maxLength={Math.max(6, fields.warehouse.length)} {...register("warehouse")} />
            </div>
            <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-4">
              <Field label="Transporte" maxLength={4} {...register("transportCode")} />
              <Input aria-label="Descripción de transporte" className={inputClass} readOnly
                value={transportCode === fields.transportCode ? snapshot.transportName : ""} />
              <Input aria-label="Texto de otros" className={inputClass} maxLength={20} {...register("otherLabel")} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Field label="Cajas" step={1} type="number" {...register("boxes", { setValueAs: Number })} />
              <Field label="Volumen" step={0.01} type="number" {...register("volume", { setValueAs: Number })} />
              <Field label="Folio" maxLength={15} {...register("folio")} />
              <Field label="Fecha" type="date" {...register("folioAt")} />
            </div>
            <div className="grid max-w-2xl gap-1">
              {shortLines.map((index) => <label className="grid gap-0.5" key={index}>
                {labels[index] && <span>{labels[index]}</span>}
                <Input aria-label={labels[index] || `Comentario ${index + 1}`} className={inputClass}
                  maxLength={shortLengths[index]} {...register(`lines.${index}`)} />
              </label>)}
            </div>
            <label className="grid gap-0.5">
              {labels[4] && <span>{labels[4]}</span>}
              <Textarea aria-label={labels[4] || "Comentario 5"} className="min-h-36 resize-y text-[10px]"
                maxLength={3000} {...register("lines.4")} />
            </label>
            <div className="grid grid-cols-[1fr_8rem] gap-2">
              <Field label="En letra" maxLength={350} {...register("amountInWords")} />
              <Field label="Forma de pago" readOnly value="0" />
            </div>
          </fieldset>
          <footer className="flex gap-1">
            {canWrite && <Button disabled={save.isPending} size="sm" type="submit">{save.isPending ? "Guardando…" : "OK"}</Button>}
            <Button disabled={save.isPending} onClick={cancel} size="sm" type="button" variant="outline">{canWrite ? "Cancelar" : "Cerrar"}</Button>
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function PurchaseReceptionCommentsDialog({ reception, onClose }: { reception: PurchaseReception; onClose: () => void }) {
  const query = useQuery(purchaseReceptionCommentsQueryOptions(reception.id))
  if (query.data && query.isFetchedAfterMount) return <CommentsForm editor={query.data} onClose={onClose} />
  return (
    <ErpDataDialog defaultWidth={880} description={reception.number} onOpenChange={(open) => !open && onClose()} title="Comentarios de recepción">
      <ErpDataDialogBody className="text-[10px]">
        {query.isError
          ? <><Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>
            <Button className="mt-2" onClick={onClose} size="sm" type="button">Cerrar</Button></>
          : <div className="grid min-h-24 place-items-center"><Spinner /></div>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
