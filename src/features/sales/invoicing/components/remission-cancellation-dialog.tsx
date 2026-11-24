import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { Link } from "react-router"
import { z } from "zod"
import { paths } from "@/app/router/paths"
import { clientKeys } from "@/features/accounts-receivable/clients/logic"
import { movementKeys } from "@/features/inventories/movements/logic"
import { productKeys } from "@/features/inventories/products/logic"
import { invoiceKeys, remissionCancellationQueryOptions } from "@/features/sales/invoicing/logic"
import type { Invoice, RemissionCancellationInput, RemissionCancellationPreview } from "@/features/sales/invoicing/model"
import { cancelRemission } from "@/features/sales/invoicing/services/invoice-service"
import { orderKeys } from "@/features/sales/orders/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { FieldError } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Textarea } from "@/shared/ui/textarea"

const reasonLimit = 90
const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function captureSchema(preview: RemissionCancellationPreview) {
  return z.object({
    date: z.iso.date({ error: "Captura una fecha válida." })
      .refine(date => date >= preview.originalDate, "La fecha debe ser igual o posterior a la remisión.")
      .refine(date => (!preview.fiscalStart || date >= preview.fiscalStart) && (!preview.fiscalEnd || date <= preview.fiscalEnd),
        "La fecha debe estar dentro del periodo contable abierto."),
    reason: z.string().trim().min(1, "Captura el motivo.").max(reasonLimit),
    confirmed: z.boolean().refine(checked => checked, "Confirma la cancelación."),
    regenerateOrder: z.boolean().refine(checked => !checked || preview.order.canRegenerate, "El pedido cambió. Revisa si aún puede regenerarse."),
  })
}

type Values = z.infer<ReturnType<typeof captureSchema>>

function CancellationForm({ preview, loading, saving, onClose, onSubmit }: {
  preview: RemissionCancellationPreview
  loading: boolean
  saving: boolean
  onClose: () => void
  onSubmit: (values: Values) => void
}) {
  const form = useForm<Values>({
    resolver: zodResolver(captureSchema(preview)),
    defaultValues: { date: preview.date, reason: "", confirmed: false, regenerateOrder: false },
  })
  const id = useId()
  const errors = form.formState.errors
  const minimum = preview.fiscalStart && preview.fiscalStart > preview.originalDate ? preview.fiscalStart : preview.originalDate

  return (
    <form className="grid gap-2" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <div className="grid content-start gap-1">
          <Label htmlFor={`${id}-date`}>Fecha</Label>
          <Input aria-invalid={Boolean(errors.date)} disabled={saving} id={`${id}-date`} max={preview.fiscalEnd ?? undefined}
            min={minimum} type="date" {...form.register("date")} />
          <FieldError errors={[errors.date]} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`${id}-reason`}>Motivo</Label>
          <Textarea aria-invalid={Boolean(errors.reason)} className="min-h-12" disabled={saving} id={`${id}-reason`}
            maxLength={reasonLimit} {...form.register("reason")} />
          <FieldError errors={[errors.reason]} />
        </div>
      </div>
      <Controller control={form.control} name="regenerateOrder" render={({ field, fieldState }) => {
        const unavailable = !preview.order.canRegenerate
        return (
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              <Checkbox aria-describedby={unavailable && preview.order.reason ? `${id}-order-reason` : undefined}
                aria-labelledby={`${id}-order-label`}
                checked={field.value} disabled={saving || unavailable} id={`${id}-order`} onBlur={field.onBlur}
                onCheckedChange={field.onChange} ref={field.ref} />
              <Label htmlFor={`${id}-order`} id={`${id}-order-label`}>Regenerar pedido {preview.order.number}</Label>
            </div>
            {unavailable && preview.order.reason && <p className="text-muted-foreground" id={`${id}-order-reason`}>{preview.order.reason}</p>}
            <FieldError errors={[fieldState.error]} />
            {unavailable && field.value && <Button className="w-fit" onClick={() => field.onChange(false)}
              size="xs" type="button" variant="outline">Quitar regeneración</Button>}
          </div>
        )
      }} />
      <Controller control={form.control} name="confirmed" render={({ field, fieldState }) => (
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <Checkbox aria-invalid={fieldState.invalid} aria-labelledby={`${id}-confirmed-label`} checked={field.value} disabled={saving} id={`${id}-confirmed`}
              onBlur={field.onBlur} onCheckedChange={field.onChange} ref={field.ref} />
            <Label htmlFor={`${id}-confirmed`} id={`${id}-confirmed-label`}>Confirmo la cancelación de la remisión.</Label>
          </div>
          <FieldError errors={[fieldState.error]} />
        </div>
      )} />
      <footer className="flex justify-end gap-1 border-t pt-2">
        <Button disabled={saving} onClick={onClose} size="xs" type="button" variant="outline">Cancelar</Button>
        <Button disabled={saving || loading} size="xs" type="submit" variant="destructive">
          {saving && <Spinner />}
          Confirmar
        </Button>
      </footer>
    </form>
  )
}

export function RemissionCancellationDialog({ invoiceId, onClose }: { invoiceId: number; onClose: () => void }) {
  const query = useQuery(remissionCancellationQueryOptions(invoiceId))
  const queryClient = useQueryClient()
  const inFlight = useRef(false)
  const request = useRef<{ signature: string; key: string } | null>(null)
  const save = useMutation({
    mutationFn: (input: RemissionCancellationInput) => cancelRemission(invoiceId, input),
    onSuccess: result => {
      queryClient.setQueryData<Invoice>(invoiceKeys.detail(invoiceId), current => current
        ? { ...current, canceled: true, status: "CANCELADA", cancellation: result, totals: { ...current.totals, balance: 0 } }
        : current)
      queryClient.setQueryData<RemissionCancellationPreview>(invoiceKeys.remissionCancellation(invoiceId), current => current
        ? { ...current, canWrite: false, alreadyRecorded: result }
        : current)
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
      void queryClient.invalidateQueries({ queryKey: movementKeys.all })
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "reports"] })
    },
    onError: () => { void query.refetch() },
    onSettled: () => { inFlight.current = false },
  })
  const preview = query.data
  const recorded = save.data ?? preview?.alreadyRecorded
  const close = () => { if (!inFlight.current) onClose() }

  function submit({ date, reason, confirmed, regenerateOrder }: Values) {
    if (inFlight.current || !confirmed || !preview?.canWrite || recorded || query.isFetching || query.isError) return
    const signature = JSON.stringify([date, reason, regenerateOrder])
    if (request.current?.signature !== signature) request.current = { signature, key: crypto.randomUUID() }
    inFlight.current = true
    save.mutate({ requestKey: request.current.key, date, reason, confirmed: true, regenerateOrder })
  }

  return (
    <ErpDataDialog defaultWidth={500} description="Cancelación de remisión." onOpenChange={open => { if (!open) close() }}
      title="Cancelar remisión" tone="sales">
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal">
        {query.isFetching && !preview && <p className="flex items-center gap-1" role="status"><Spinner /> Consultando remisión…</p>}
        {query.isError && !recorded && <Alert variant="destructive">
          <AlertTitle>No fue posible consultar la cancelación</AlertTitle>
          <AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription>
          <Button className="w-fit" onClick={() => void query.refetch()} size="xs" type="button" variant="outline">Reintentar</Button>
        </Alert>}
        {preview && <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <ErpDataMetric label="Remisión" value={preview.number} />
          <ErpDataMetric label="Fecha original" value={preview.originalDate} />
          <ErpDataMetric label="Importe" value={money.format(preview.amount)} />
          <ErpDataMetric label="Pedido de origen" value={preview.order.number} />
        </div>}
        {recorded ? (
          <Alert role="status">
            <AlertTitle>Remisión cancelada</AlertTitle>
            <AlertDescription className="grid gap-1">
              <span>Fecha {recorded.date}</span>
              <span className="whitespace-pre-wrap break-words">{recorded.reason}</span>
              {recorded.regeneratedOrder && preview && (
                <Link className="w-fit font-medium underline underline-offset-2" onClick={close} to={paths.salesOrder(preview.order.id)}>
                  Pedido {preview.order.number} regenerado
                </Link>
              )}
            </AlertDescription>
          </Alert>
        ) : preview && !preview.canWrite ? (
          <Alert role="status"><AlertTitle>Cancelación bloqueada</AlertTitle>
            <AlertDescription>{preview.reason || "La cancelación no está disponible para esta remisión."}</AlertDescription>
          </Alert>
        ) : null}
        {save.isError && !recorded && <Alert variant="destructive">
          <AlertTitle>No fue posible cancelar la remisión</AlertTitle><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription>
        </Alert>}
        {preview?.canWrite && !recorded ? (
          <>
            <p>La cancelación devuelve las unidades al almacén y cancela el cargo al cliente.</p>
            <CancellationForm loading={query.isFetching || query.isError} onClose={close} onSubmit={submit} preview={preview} saving={save.isPending} />
          </>
        ) : (
          <Button className="justify-self-end" onClick={close} size="xs" type="button" variant="outline">Cerrar</Button>
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
