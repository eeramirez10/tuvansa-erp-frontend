import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { useId, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { Link } from "react-router"
import { z } from "zod"
import { paths } from "@/app/router/paths"
import type { PostingReversal, PostingReversalInput, PostingReversalPreview } from "@/features/accounts-payable/posting-reversal-model"
import { supplierKeys } from "@/features/accounts-payable/suppliers/logic"
import { accountingPolicyKeys } from "@/features/accounting/policies/logic"
import { purchaseReceptionKeys } from "@/features/purchasing/purchase-receptions/logic"
import { bankAccountKeys } from "@/features/treasury/banking/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Textarea } from "@/shared/ui/textarea"

type Props = {
  kind: "expense" | "payment"
  tone?: "payable" | "banking"
  queryKey: QueryKey
  load: (signal: AbortSignal) => Promise<PostingReversalPreview>
  record: (input: PostingReversalInput) => Promise<PostingReversal>
  onClose: () => void
}

const reasonLimit = 90
const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function reversalMinimumDate(preview: PostingReversalPreview) {
  return preview.minimumDate && preview.minimumDate > preview.originalDate ? preview.minimumDate : preview.originalDate
}

function reversalSchema(preview: PostingReversalPreview) {
  const minDate = reversalMinimumDate(preview)
  return z.object({
    date: z.iso.date({ error: "Captura una fecha válida." })
      .refine(date => date >= minDate, `La fecha debe ser igual o posterior a ${minDate}.`)
      .refine(date => (!preview.fiscalStart || date >= preview.fiscalStart) && (!preview.fiscalEnd || date <= preview.fiscalEnd),
        "La fecha debe estar dentro del periodo contable abierto."),
    reason: z.string().trim().min(1, "Captura el motivo.").max(reasonLimit),
    confirmed: z.boolean().refine(checked => checked, "Confirma la operación."),
  })
}

type Draft = z.infer<ReturnType<typeof reversalSchema>>

function ReversalForm({ preview, wholeBatch, disabled, pending, onSubmit, onClose }: {
  preview: PostingReversalPreview
  wholeBatch: boolean
  disabled: boolean
  pending: boolean
  onSubmit: (draft: Draft) => void
  onClose: () => void
}) {
  const minDate = reversalMinimumDate(preview)
  const fiscalMin = preview.fiscalStart && preview.fiscalStart > minDate ? preview.fiscalStart : minDate
  const form = useForm<Draft>({
    resolver: zodResolver(reversalSchema(preview)),
    defaultValues: { date: preview.date < fiscalMin ? fiscalMin : preview.date, reason: "", confirmed: false },
  })
  const id = useId()
  const errors = form.formState.errors
  const showMinimum = minDate > preview.originalDate

  return (
    <form className="grid gap-2" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <div className="grid content-start gap-1">
          <Label htmlFor={`${id}-date`}>Fecha</Label>
          <Input aria-describedby={errors.date ? `${id}-date-error` : showMinimum ? `${id}-date-min` : undefined} aria-invalid={Boolean(errors.date)}
            disabled={pending} id={`${id}-date`} max={preview.fiscalEnd ?? undefined} min={fiscalMin}
            type="date" {...form.register("date")} />
          {showMinimum && <p className="text-muted-foreground" id={`${id}-date-min`}>Fecha mínima por pagos revertidos {minDate}</p>}
          {errors.date && <p className="text-destructive" id={`${id}-date-error`}>{errors.date.message}</p>}
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`${id}-reason`}>Motivo</Label>
          <Textarea aria-describedby={errors.reason ? `${id}-reason-error` : undefined} aria-invalid={Boolean(errors.reason)}
            className="min-h-12" disabled={pending} id={`${id}-reason`} maxLength={reasonLimit} {...form.register("reason")} />
          {errors.reason && <p className="text-destructive" id={`${id}-reason-error`}>{errors.reason.message}</p>}
        </div>
      </div>
      <Controller control={form.control} name="confirmed" render={({ field, fieldState }) => (
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <Checkbox aria-describedby={fieldState.error ? `${id}-confirmed-error` : undefined} aria-invalid={fieldState.invalid}
              checked={field.value} disabled={pending} id={`${id}-confirmed`} onBlur={field.onBlur}
              onCheckedChange={field.onChange} ref={field.ref} />
            <Label htmlFor={`${id}-confirmed`}>{wholeBatch
              ? "Confirmo la cancelación de todos los documentos de la póliza."
              : "Confirmo la reversión del pago."}</Label>
          </div>
          {fieldState.error && <p className="text-destructive" id={`${id}-confirmed-error`}>{fieldState.error.message}</p>}
        </div>
      )} />
      <div className="flex justify-end gap-1 border-t pt-2">
        <Button disabled={pending} onClick={onClose} size="xs" type="button" variant="outline">Cancelar</Button>
        <Button disabled={disabled} size="xs" type="submit" variant="destructive">{pending ? "Registrando…" : "Confirmar"}</Button>
      </div>
    </form>
  )
}

export function PostingReversalDialog({ kind, tone = "payable", queryKey, load, record, onClose }: Props) {
  const queryClient = useQueryClient()
  const inFlight = useRef(false)
  const submission = useRef<{ signature: string; requestKey: string } | null>(null)
  const isExpense = kind === "expense"
  const title = isExpense ? "Cancelar GA" : "Revertir PP"
  const previewQuery = useQuery({
    queryKey,
    queryFn: ({ signal }) => load(signal),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
  })
  const mutation = useMutation({
    mutationFn: record,
    onSuccess: (result) => {
      queryClient.setQueryData<PostingReversalPreview>(queryKey, previous => previous
        ? { ...previous, canWrite: false, alreadyRecorded: result }
        : previous)
      void queryClient.invalidateQueries({ queryKey: purchaseReceptionKeys.all })
      void queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      void queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
      void queryClient.invalidateQueries({ queryKey: accountingPolicyKeys.all })
    },
    onError: () => { void previewQuery.refetch() },
    onSettled: () => { inFlight.current = false },
  })
  const preview = previewQuery.data
  const recorded = mutation.data ?? preview?.alreadyRecorded
  const close = () => { if (!inFlight.current) onClose() }
  const submit = ({ date, reason, confirmed }: Draft) => {
    if (inFlight.current || !confirmed || recorded || !preview?.canWrite || previewQuery.isFetching || previewQuery.isError) return
    const signature = JSON.stringify([date, reason])
    if (submission.current?.signature !== signature) {
      submission.current = { signature, requestKey: crypto.randomUUID() }
    }
    inFlight.current = true
    mutation.mutate({ requestKey: submission.current.requestKey, date, reason, confirmed: true })
  }

  return (
    <ErpDataDialog defaultWidth={520} description={isExpense ? "Cancelación del grupo de gastos." : "Reversión del pago al proveedor."}
      onOpenChange={open => { if (!open) close() }} title={title} tone={tone}>
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal" onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); close() }
      }}>
        {!preview && previewQuery.isPending && <p role="status">Consultando…</p>}
        {!recorded && previewQuery.isError && (
          <Alert variant="destructive">
            <AlertTitle>No fue posible consultar la operación</AlertTitle>
            <AlertDescription>{getApiErrorMessage(previewQuery.error)}</AlertDescription>
            <Button className="w-fit" disabled={previewQuery.isFetching} onClick={() => void previewQuery.refetch()}
              size="xs" type="button" variant="outline">Reintentar consulta</Button>
          </Alert>
        )}
        {preview && (
          <>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <ErpDataMetric label={isExpense ? "Documento" : "Pago"} value={preview.number} />
              <ErpDataMetric label="Póliza original" value={preview.policyNumber} />
              <ErpDataMetric label="Fecha original" value={preview.originalDate} />
              <ErpDataMetric label="Importe" value={money.format(preview.amount)} />
            </div>
            {preview.documents.length > 0 && (
              <div className="grid gap-1">
                <p className="font-medium">{isExpense ? "Documentos de la misma póliza" : "Documentos del pago"}</p>
                <ErpDataTableViewport axes="xy" className="max-h-36">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted">
                      <TableRow><TableHead>Documento</TableHead><TableHead className="text-right">Total</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>{preview.documents.map(document => (
                      <TableRow key={document.id}>
                        <TableCell>{document.number}</TableCell>
                        <TableCell className="text-right tabular-nums">{money.format(document.total)}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </ErpDataTableViewport>
              </div>
            )}
          </>
        )}
        {recorded ? (
          <Alert role="status">
            <AlertTitle>{isExpense ? "GA cancelado" : "PP revertido"}</AlertTitle>
            <AlertDescription className="grid gap-1">
              <span>Fecha {recorded.date}</span>
              <span className="whitespace-pre-wrap break-words">{recorded.reason}</span>
              <Link className="w-fit font-medium underline underline-offset-2" onClick={close} to={paths.accountingPolicy(recorded.id)}>
                Póliza {recorded.policyNumber}
              </Link>
            </AlertDescription>
          </Alert>
        ) : preview && !preview.canWrite ? (
          <Alert role="status">
            <AlertTitle>Operación bloqueada</AlertTitle>
            <AlertDescription>{preview.reason || "La operación no está disponible para este registro."}</AlertDescription>
          </Alert>
        ) : null}
        {!recorded && mutation.isError && (
          <Alert variant="destructive">
            <AlertTitle>No fue posible registrar la operación</AlertTitle>
            <AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription>
          </Alert>
        )}
        {preview?.canWrite && !recorded ? (
          <ReversalForm disabled={previewQuery.isFetching || previewQuery.isError || mutation.isPending}
            onClose={close} onSubmit={submit} pending={mutation.isPending} preview={preview} wholeBatch={isExpense} />
        ) : (
          <Button className="justify-self-end" onClick={close} size="xs" type="button" variant="outline">Cerrar</Button>
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
