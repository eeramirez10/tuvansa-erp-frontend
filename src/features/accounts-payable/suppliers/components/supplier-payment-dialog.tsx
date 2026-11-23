import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { supplierKeys, supplierPaymentQueryOptions } from "@/features/accounts-payable/suppliers/logic"
import type { SupplierPaymentInput, SupplierPaymentPreview } from "@/features/accounts-payable/suppliers/model"
import { recordSupplierPayment } from "@/features/accounts-payable/suppliers/services/supplier-service"
import { purchaseReceptionKeys } from "@/features/purchasing/purchase-receptions/logic"
import { bankAccountKeys } from "@/features/treasury/banking/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

type PaymentDraft = Omit<SupplierPaymentInput, "requestKey" | "revision">

const conceptLimit = 90
const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function paymentSchema(preview: SupplierPaymentPreview, receiptDate?: string) {
  return z.object({
    bank: z.string().refine((id) => preview.bankAccounts.some((account) => String(account.id) === id), {
      error: "Selecciona una cuenta bancaria.",
    }),
    mode: z.enum(["transfer", "check"]),
    amount: z.string().regex(/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/, "Captura un importe de hasta dos decimales."),
    date: z.iso.date({ error: "Captura una fecha válida." }).refine((date) => !receiptDate || date >= receiptDate, {
      error: "La fecha de pago debe ser igual o posterior a la recepción.",
    }),
    description: z.string().trim().max(conceptLimit, `El concepto admite hasta ${conceptLimit} caracteres.`),
  }).refine(({ amount }) => {
    const cents = Math.round(Number(amount) * 100)
    return Number.isSafeInteger(cents) && cents > 0 && cents <= Math.round(preview.remaining * 100)
  }, { path: ["amount"], error: `Captura un importe entre 0.01 y ${money.format(preview.remaining)}.` })
}

function SupplierPaymentDraft({ preview, receiptDate, saving, onSubmit, onClose }: {
  preview: SupplierPaymentPreview
  receiptDate?: string
  saving: boolean
  onSubmit: (input: PaymentDraft) => void
  onClose: () => void
}) {
  const prefix = useId()
  const { control, formState: { errors }, handleSubmit, register } = useForm({
    resolver: zodResolver(paymentSchema(preview, receiptDate)),
    defaultValues: {
      bank: "",
      mode: preview.defaults.mode,
      amount: preview.defaults.amount.toFixed(2),
      date: preview.defaults.date.slice(0, 10),
      description: "",
    },
  })

  return (
    <form className="grid gap-2" noValidate onSubmit={handleSubmit(({ bank, amount, ...draft }) =>
      onSubmit({ ...draft, bankAccountId: Number(bank), amount: Number(amount) }))}>
      <div className="flex items-end justify-between gap-2">
        <ErpDataMetric label="Documento" value={preview.number} />
        <ErpDataMetric label="Saldo pendiente" value={money.format(preview.remaining)} />
      </div>
      <fieldset className="grid min-w-0 gap-2" disabled={saving}>
        <div className="grid gap-1">
          <Label htmlFor={`${prefix}-bank`}>Cuenta bancaria</Label>
          <Controller control={control} name="bank" render={({ field }) => (
            <Select disabled={saving} value={field.value || null} onValueChange={(value) => field.onChange(value ?? "")}
              items={preview.bankAccounts.map(({ id, code, name }) => ({ value: String(id), label: `${code} · ${name}` }))}>
              <SelectTrigger aria-invalid={Boolean(errors.bank)} className="w-full" id={`${prefix}-bank`} ref={field.ref} size="sm" onBlur={field.onBlur}>
                <SelectValue placeholder="Selecciona una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {preview.bankAccounts.map(({ id, code, name }) => <SelectItem key={id} value={String(id)}>{code} · {name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
          {errors.bank && <span className="text-destructive" role="alert">{errors.bank.message}</span>}
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)_minmax(0,0.9fr)]">
          <div className="grid content-start gap-1">
            <Label htmlFor={`${prefix}-mode`}>Forma de pago</Label>
            <Controller control={control} name="mode" render={({ field }) => (
              <Select disabled={saving} items={[{ value: "transfer", label: "Transferencia" }, { value: "check", label: "Cheque" }]}
                value={field.value} onValueChange={(value) => { if (value) field.onChange(value) }}>
                <SelectTrigger className="w-full" id={`${prefix}-mode`} ref={field.ref} size="sm" onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="grid content-start gap-1">
            <Label htmlFor={`${prefix}-amount`}>Importe</Label>
            <Input aria-invalid={Boolean(errors.amount)} className="h-6 text-right tabular-nums" id={`${prefix}-amount`}
              inputMode="decimal" min={0.01} max={preview.remaining} step={0.01} type="number" {...register("amount")} />
            {errors.amount && <span className="text-destructive" role="alert">{errors.amount.message}</span>}
          </div>
          <div className="grid content-start gap-1">
            <Label htmlFor={`${prefix}-date`}>Fecha</Label>
            <Input aria-invalid={Boolean(errors.date)} className="h-6" id={`${prefix}-date`}
              min={receiptDate} type="date" {...register("date")} />
            {errors.date && <span className="text-destructive" role="alert">{errors.date.message}</span>}
          </div>
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`${prefix}-description`}>Concepto</Label>
          <Input className="h-6" aria-invalid={Boolean(errors.description)} id={`${prefix}-description`} maxLength={conceptLimit}
            {...register("description")} />
          {errors.description && <span className="text-destructive" role="alert">{errors.description.message}</span>}
        </div>
      </fieldset>
      <div className="flex justify-end gap-1">
        <Button disabled={saving} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
        <Button disabled={saving} size="sm" type="submit">{saving && <Spinner />}OK</Button>
      </div>
    </form>
  )
}

export function SupplierPaymentDialog({ supplierId, receiptId, documentNumber, receiptDate, onClose }: {
  supplierId: number
  receiptId: number
  documentNumber: string
  receiptDate?: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const preview = useQuery(supplierPaymentQueryOptions(supplierId, receiptId))
  const attempt = useRef<{ draft: string; requestKey: string } | null>(null)
  const saving = useRef(false)
  const payment = useMutation({
    networkMode: "always",
    mutationFn: (input: SupplierPaymentInput) => recordSupplierPayment(supplierId, receiptId, input),
    onSuccess: (saved) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
        queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
        queryClient.invalidateQueries({ queryKey: purchaseReceptionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["accounting"] }),
      ])
      toast.success(`Pago ${saved.number} registrado.`, { description: `Póliza ${saved.policyNumber}` })
      onClose()
    },
    onSettled: () => { saving.current = false },
  })
  const data = preview.data
  const loading = preview.isPending || preview.isFetching
  const ready = data?.canWrite && data.bankAccounts.length > 0 && !loading && !preview.isError

  function submit(draft: PaymentDraft) {
    if (!ready || !data || saving.current) return
    const revision = data.revision
    const signature = JSON.stringify({ ...draft, revision })
    if (attempt.current?.draft !== signature) {
      attempt.current = { draft: signature, requestKey: crypto.randomUUID() }
    }
    saving.current = true
    payment.mutate({ ...draft, revision, requestKey: attempt.current.requestKey })
  }

  function cancel() {
    if (!saving.current) onClose()
  }

  return (
    <ErpDataDialog defaultWidth={440} description={`Pago del documento ${documentNumber}`}
      onOpenChange={(open) => { if (!open) cancel() }} title="Paga" tone="payable">
      <ErpDataDialogBody className="grid gap-2" onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault()
          event.stopPropagation()
          cancel()
        }
      }}>
        {loading && <div className="grid min-h-16 place-items-center"><Spinner /></div>}
        {preview.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(preview.error)}</AlertDescription></Alert>}
        {!loading && data && !ready && !preview.isError && (
          <Alert><AlertDescription>{data.reason || "No hay cuentas bancarias disponibles para registrar el pago."}</AlertDescription></Alert>
        )}
        {payment.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(payment.error)}</AlertDescription></Alert>}
        {data && ready ? (
          <SupplierPaymentDraft key={data.revision} onClose={cancel} onSubmit={submit} preview={data}
            receiptDate={receiptDate} saving={payment.isPending} />
        ) : (
          <div className="flex justify-end gap-1">
            <Button onClick={cancel} size="sm" type="button" variant="outline">Cancelar</Button>
            {preview.isError && <Button disabled={loading} onClick={() => void preview.refetch()} size="sm" type="button">Reintentar</Button>}
          </div>
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
