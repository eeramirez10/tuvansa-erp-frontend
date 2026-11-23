import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

import { paths } from "@/app/router/paths"
import { clientCollectionQueryOptions, clientKeys } from "@/features/accounts-receivable/clients/logic"
import type { ClientCollection, ClientCollectionInput, ClientCollectionPreview } from "@/features/accounts-receivable/clients/model"
import { recordClientCollection } from "@/features/accounts-receivable/clients/services/client-service"
import { invoiceKeys } from "@/features/sales/invoicing/logic"
import { bankAccountKeys } from "@/features/treasury/banking/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

type DraftInput = Omit<ClientCollectionInput, "requestKey" | "revision">

const conceptLimit = 90
const referenceLimit = 45
const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function collectionSchema(preview: ClientCollectionPreview, remissionDate?: string) {
  return z.object({
    bank: z.string().refine((id) => preview.bankAccounts.some((account) => String(account.id) === id), {
      error: "Selecciona una cuenta bancaria.",
    }),
    amount: z.string().regex(/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/, "Captura un importe de hasta dos decimales."),
    date: z.iso.date({ error: "Captura una fecha válida." }).refine((date) => !remissionDate || date >= remissionDate, {
      error: "La fecha del depósito debe ser igual o posterior a la remisión.",
    }),
    description: z.string().trim().max(conceptLimit, `El concepto admite hasta ${conceptLimit} caracteres.`),
    reference: z.string().trim().max(referenceLimit, `La referencia admite hasta ${referenceLimit} caracteres.`),
  }).refine(({ amount }) => {
    const cents = Math.round(Number(amount) * 100)
    return Number.isSafeInteger(cents) && cents > 0 && cents <= Math.round(preview.remaining * 100)
  }, { path: ["amount"], error: `Captura un importe entre 0.01 y ${money.format(preview.remaining)}.` })
}

function ClientCollectionDraft({ preview, remissionDate, saving, onSubmit, onClose }: {
  preview: ClientCollectionPreview
  remissionDate?: string
  saving: boolean
  onSubmit: (input: DraftInput) => void
  onClose: () => void
}) {
  const prefix = useId()
  const bankItems = preview.bankAccounts.map(({ id, code, name }) => ({ value: String(id), label: `${code} · ${name}` }))
  const { control, formState: { errors }, handleSubmit, register } = useForm({
    resolver: zodResolver(collectionSchema(preview, remissionDate)),
    defaultValues: {
      bank: "",
      amount: preview.defaults.amount.toFixed(2),
      date: preview.defaults.date.slice(0, 10),
      description: "",
      reference: "",
    },
  })

  return (
    <form className="grid gap-2" noValidate onSubmit={handleSubmit(({ bank, amount, ...draft }) =>
      onSubmit({ ...draft, bankAccountId: Number(bank), amount: Number(amount) }))}>
      <div className="flex flex-wrap items-end gap-2">
        <ErpDataMetric label="Remisión" value={preview.number} />
        <ErpDataMetric label="Saldo pendiente" value={money.format(preview.remaining)} />
        <ErpDataMetric label="Forma de cobro" value="Depósito" />
      </div>
      <fieldset className="grid min-w-0 gap-2" disabled={saving}>
        <div className="grid gap-1">
          <Label htmlFor={`${prefix}-bank`}>Cuenta bancaria</Label>
          <Controller control={control} name="bank" render={({ field }) => (
            <Select disabled={saving} items={bankItems} value={field.value || null} onValueChange={(value) => field.onChange(value ?? "")}>
              <SelectTrigger aria-invalid={Boolean(errors.bank)} className="w-full" id={`${prefix}-bank`}
                ref={field.ref} size="sm" onBlur={field.onBlur}>
                <SelectValue placeholder="Selecciona una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {bankItems.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
          {errors.bank && <span className="text-destructive" role="alert">{errors.bank.message}</span>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid content-start gap-1">
            <Label htmlFor={`${prefix}-amount`}>Importe</Label>
            <Input aria-invalid={Boolean(errors.amount)} className="h-6 text-right tabular-nums" id={`${prefix}-amount`}
              inputMode="decimal" min={0.01} max={preview.remaining} step={0.01} type="number" {...register("amount")} />
            {errors.amount && <span className="text-destructive" role="alert">{errors.amount.message}</span>}
          </div>
          <div className="grid content-start gap-1">
            <Label htmlFor={`${prefix}-date`}>Fecha</Label>
            <Input aria-invalid={Boolean(errors.date)} className="h-6" id={`${prefix}-date`} min={remissionDate}
              type="date" {...register("date")} />
            {errors.date && <span className="text-destructive" role="alert">{errors.date.message}</span>}
          </div>
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`${prefix}-reference`}>Referencia bancaria</Label>
          <Input aria-invalid={Boolean(errors.reference)} className="h-6" id={`${prefix}-reference`} maxLength={referenceLimit}
            {...register("reference")} />
          {errors.reference && <span className="text-destructive" role="alert">{errors.reference.message}</span>}
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`${prefix}-description`}>Concepto</Label>
          <Input aria-invalid={Boolean(errors.description)} className="h-6" id={`${prefix}-description`} maxLength={conceptLimit}
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

export function ClientCollectionDialog({ clientId, remissionId, remissionNumber, remissionDate, onClose, onSaved }: {
  clientId: number
  remissionId: number
  remissionNumber: string
  remissionDate?: string
  onClose: () => void
  onSaved: (saved: ClientCollection) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const preview = useQuery(clientCollectionQueryOptions(clientId, remissionId))
  const requestKeys = useRef(new Map<string, string>())
  const inFlight = useRef(false)
  const collection = useMutation({
    networkMode: "always",
    mutationFn: (input: ClientCollectionInput) => recordClientCollection(clientId, remissionId, input),
    onSuccess: (saved) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: clientKeys.all }),
        queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["accounting"] }),
      ])
      toast.success(`Cobro ${saved.number} registrado.`, {
        description: saved.receiptNumber > 0
          ? `Recibo ${saved.receiptNumber} · Póliza ${saved.policyNumber}`
          : `Póliza ${saved.policyNumber}`,
        action: { label: "Ver póliza", onClick: () => { void navigate(paths.accountingPolicy(saved.id)) } },
      })
      onSaved(saved)
    },
    onSettled: () => { inFlight.current = false },
  })
  const data = preview.data
  const loading = preview.isPending || preview.isFetching
  const ready = data?.canWrite && data.bankAccounts.length > 0 && !loading && !preview.isError

  function submit(draft: DraftInput) {
    if (!ready || !data || inFlight.current) return
    const input = { ...draft, revision: data.revision }
    const signature = JSON.stringify(input)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    collection.mutate({ ...input, requestKey })
  }

  function cancel() {
    if (!inFlight.current) onClose()
  }

  return (
    <ErpDataDialog defaultWidth={440} description={`Cobro de la remisión ${remissionNumber}`}
      onOpenChange={(open) => { if (!open) cancel() }} title="Cobrar" tone="receivable">
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
          <Alert><AlertDescription>{data.reason || "No hay cuentas bancarias disponibles para registrar el depósito."}</AlertDescription></Alert>
        )}
        {collection.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(collection.error)}</AlertDescription></Alert>}
        {data && ready ? (
          <ClientCollectionDraft key={data.revision} onClose={cancel} onSubmit={submit} preview={data}
            remissionDate={remissionDate} saving={collection.isPending} />
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
