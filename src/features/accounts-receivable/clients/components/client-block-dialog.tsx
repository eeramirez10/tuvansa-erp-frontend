import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { clientBlockQueryOptions, clientKeys } from "@/features/accounts-receivable/clients/logic"
import type { Client } from "@/features/accounts-receivable/clients/model"
import { setClientBlocked } from "@/features/accounts-receivable/clients/services/client-service"
import { invoiceKeys } from "@/features/sales/invoicing/logic"
import { orderKeys } from "@/features/sales/orders/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { FieldError } from "@/shared/ui/field"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Textarea } from "@/shared/ui/textarea"

const reasonLimit = 200
const schema = z.object({
  reason: z.string().trim().min(1, "Captura el motivo.").max(reasonLimit),
  confirmed: z.boolean().refine(confirmed => confirmed, "Confirma el cambio de estado."),
})
type Draft = z.infer<typeof schema>

export function ClientBlockDialog({ client, onClose }: { client: Client; onClose: () => void }) {
  const query = useQuery(clientBlockQueryOptions(client.id))
  const queryClient = useQueryClient()
  const form = useForm<Draft>({ defaultValues: { reason: "", confirmed: false }, resolver: zodResolver(schema) })
  const { resetField } = form
  const id = useId()
  const inFlight = useRef(false)
  const save = useMutation({
    mutationFn: ({ blocked, reason }: { blocked: boolean; reason: string }) => setClientBlocked(client.id, blocked, reason),
    onSuccess: result => {
      form.reset({ reason: "", confirmed: false })
      queryClient.setQueryData(clientKeys.blockStatus(client.id), result)
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
    onError: () => { void query.refetch() },
    onSettled: () => { inFlight.current = false },
  })
  const status = query.data?.blockStatus
  const blocked = status?.blocked
  const action = blocked ? "Desbloquear" : "Bloquear"
  useEffect(() => { resetField("confirmed") }, [blocked, resetField])
  const close = () => { if (!inFlight.current) onClose() }
  function submit({ reason, confirmed }: Draft) {
    if (!confirmed || blocked === undefined || query.isFetching || query.isError || inFlight.current) return
    inFlight.current = true
    save.mutate({ blocked: !blocked, reason })
  }

  return (
    <ErpDataDialog defaultWidth={480} description={`Bloqueo del cliente ${client.code}`} title="Bloqueo del cliente" tone="receivable"
      onOpenChange={open => { if (!open) close() }}>
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal" onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); close() }
      }}>
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-1">
          <ErpDataMetric label="Cliente" value={query.data?.client.code ?? client.code} />
          <ErpDataMetric label="Razón social" value={query.data?.client.name ?? client.name} />
        </div>
        {query.isFetching && !status && <p className="flex items-center gap-1" role="status"><Spinner /> Consultando bloqueo…</p>}
        {query.isError && <Alert variant="destructive">
          <AlertTitle>No fue posible consultar el estado</AlertTitle><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription>
          <Button className="w-fit" onClick={() => void query.refetch()} size="xs" type="button" variant="outline">Reintentar</Button>
        </Alert>}
        {status && (
          <Alert role="status">
            <AlertTitle>{status.blocked ? "Cliente bloqueado" : "Cliente activo"}</AlertTitle>
            <AlertDescription className="grid gap-1">
              {(status.blockedAt || status.event?.date) && <span>Fecha {status.blockedAt || status.event?.date}</span>}
              {status.event?.title && <span className="font-medium">{status.event.title}</span>}
              {status.event?.description && <span className="whitespace-pre-wrap break-words">{status.event.description}</span>}
            </AlertDescription>
          </Alert>
        )}
        {save.isError && (
          <Alert variant="destructive"><AlertTitle>No fue posible cambiar el estado del cliente</AlertTitle>
            <AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription>
          </Alert>
        )}
        {status ? (
          <form className="grid gap-2" noValidate onSubmit={event => { void form.handleSubmit(submit)(event) }}>
            <div className="grid gap-1">
              <Label htmlFor={`${id}-reason`}>Motivo</Label>
              <Textarea aria-invalid={Boolean(form.formState.errors.reason)} disabled={save.isPending} id={`${id}-reason`}
                maxLength={reasonLimit} {...form.register("reason")} />
              <FieldError errors={[form.formState.errors.reason]} />
            </div>
            <Controller control={form.control} name="confirmed" render={({ field, fieldState }) => (
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Checkbox aria-invalid={fieldState.invalid} checked={field.value} disabled={save.isPending} id={`${id}-confirm`}
                    onBlur={field.onBlur} onCheckedChange={field.onChange} ref={field.ref} />
                  <Label htmlFor={`${id}-confirm`}>Confirmo que quiero {blocked ? "desbloquear" : "bloquear"} al cliente.</Label>
                </div>
                <FieldError errors={[fieldState.error]} />
              </div>
            )} />
            <footer className="flex justify-end gap-1 border-t pt-2">
              <Button disabled={save.isPending} onClick={close} size="xs" type="button" variant="outline">Cerrar</Button>
              <Button disabled={save.isPending || query.isFetching || query.isError} size="xs" type="submit" variant="destructive">
                {save.isPending && <Spinner />}{action}
              </Button>
            </footer>
          </form>
        ) : <Button className="justify-self-end" onClick={close} size="xs" type="button" variant="outline">Cerrar</Button>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
