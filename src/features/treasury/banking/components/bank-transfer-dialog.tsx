import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

import { paths } from "@/app/router/paths"
import { bankAccountKeys, bankTransferQueryOptions } from "@/features/treasury/banking/logic"
import type { BankAccount, BankTransferInput, BankTransferPreview } from "@/features/treasury/banking/model"
import { createBankTransfer } from "@/features/treasury/banking/services/bank-account-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

type TransferDraftInput = Omit<BankTransferInput, "requestKey">
const referenceLimit = 10
const beneficiaryLimit = 85
const descriptionLimit = 90
const fieldClass = "h-6 min-w-0 px-1 text-[10px]"

function transferSchema(preview: BankTransferPreview) {
  return z.object({
    source: z.string().refine((value) => preview.sources.some((source) => String(source.id) === value), {
      error: "Selecciona una cuenta de origen.",
    }),
    reference: z.string().trim().max(referenceLimit, `El número admite hasta ${referenceLimit} caracteres.`),
    beneficiary: z.string().trim().max(beneficiaryLimit, `El beneficiario admite hasta ${beneficiaryLimit} caracteres.`),
    description: z.string().trim().max(descriptionLimit, `El concepto admite hasta ${descriptionLimit} caracteres.`),
    date: z.iso.date({ error: "Captura una fecha válida." })
      .refine((value) => value >= preview.fiscalStart && value <= preview.fiscalEnd, {
        error: `Captura una fecha entre ${preview.fiscalStart} y ${preview.fiscalEnd}.`,
      }),
    amount: z.string().regex(/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/, "Captura un importe de hasta dos decimales.")
      .refine((value) => {
        const cents = Math.round(Number(value) * 100)
        return Number.isSafeInteger(cents) && cents > 0
      }, { error: "Captura un importe mayor que cero." }),
  })
}

function TransferDraft({ preview, pending, onSubmit, onClose }: {
  preview: BankTransferPreview
  pending: boolean
  onSubmit: (input: TransferDraftInput) => void
  onClose: () => void
}) {
  const prefix = useId()
  const sources = preview.sources.map(({ id, code, name }) => ({ value: String(id), label: `${code} · ${name}` }))
  const { control, formState: { errors }, handleSubmit, register } = useForm({
    resolver: zodResolver(transferSchema(preview)),
    defaultValues: { source: "", date: preview.defaults.date, amount: "", reference: "", beneficiary: "", description: "" },
  })
  const textFields = [
    { name: "beneficiary", label: "Beneficiario", limit: beneficiaryLimit },
    { name: "description", label: "Concepto", limit: descriptionLimit },
  ] as const

  return <form className="grid gap-2" noValidate onSubmit={handleSubmit(({ source, amount, ...fields }) =>
    onSubmit({ ...fields, sourceBankAccountId: Number(source), amount: Number(amount) }))}>
    <fieldset className="grid min-w-0 gap-2" disabled={pending}>
      <div className="flex flex-wrap items-end gap-2">
        <ErpDataMetric label="Tipo" value="3" className="min-w-10" />
        <RadioGroup aria-label="Tipo de movimiento" className="flex w-auto gap-2" disabled value="transfer">
          <Label className="flex items-center gap-1" htmlFor={`${prefix}-check`}><RadioGroupItem id={`${prefix}-check`} value="check" />Cheque</Label>
          <Label className="flex items-center gap-1" htmlFor={`${prefix}-transfer`}><RadioGroupItem id={`${prefix}-transfer`} value="transfer" />Traspas</Label>
        </RadioGroup>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid content-start gap-1">
          <Label htmlFor={`${prefix}-reference`}>Número</Label>
          <Input aria-invalid={Boolean(errors.reference)} className={fieldClass} id={`${prefix}-reference`}
            maxLength={referenceLimit} {...register("reference")} />
          {errors.reference && <span className="text-destructive" role="alert">{errors.reference.message}</span>}
        </div>
        <div className="grid content-start gap-1">
          <Label htmlFor={`${prefix}-date`}>Fecha</Label>
          <Input aria-invalid={Boolean(errors.date)} className={fieldClass} id={`${prefix}-date`} min={preview.fiscalStart}
            max={preview.fiscalEnd} required type="date" {...register("date")} />
          {errors.date && <span className="text-destructive" role="alert">{errors.date.message}</span>}
        </div>
      </div>
      {textFields.map(({ name, label, limit }) => <div className="grid gap-1" key={name}>
        <Label htmlFor={`${prefix}-${name}`}>{label}</Label>
        <Input aria-invalid={Boolean(errors[name])} className={fieldClass} id={`${prefix}-${name}`} maxLength={limit} {...register(name)} />
        {errors[name] && <span className="text-destructive" role="alert">{errors[name].message}</span>}
      </div>)}
      <div className="grid gap-1">
        <Label htmlFor={`${prefix}-source`}>Cuenta origen</Label>
        <Controller control={control} name="source" render={({ field }) => (
          <Select disabled={pending} items={sources} value={field.value || null} onValueChange={(value) => field.onChange(value ?? "")}>
            <SelectTrigger aria-invalid={Boolean(errors.source)} className="w-full" id={`${prefix}-source`} ref={field.ref}
              size="sm" onBlur={field.onBlur}><SelectValue placeholder="Selecciona una cuenta" /></SelectTrigger>
            <SelectContent>{sources.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        )} />
        {errors.source && <span className="text-destructive" role="alert">{errors.source.message}</span>}
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${prefix}-destination`}>Cuenta destino</Label>
        <Input className={fieldClass} id={`${prefix}-destination`} readOnly value={`${preview.destination.code} · ${preview.destination.name}`} />
      </div>
      <div className="grid w-40 gap-1">
        <Label htmlFor={`${prefix}-amount`}>Importe</Label>
        <Input aria-invalid={Boolean(errors.amount)} className={fieldClass + " text-right tabular-nums"} id={`${prefix}-amount`}
          inputMode="decimal" min={0.01} required step={0.01} type="number" {...register("amount")} />
        {errors.amount && <span className="text-destructive" role="alert">{errors.amount.message}</span>}
      </div>
    </fieldset>
    <footer className="flex justify-end gap-1">
      <Button disabled={pending} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
      <Button disabled={pending} size="sm" type="submit">{pending && <Spinner />}OK</Button>
    </footer>
  </form>
}

export function BankTransferDialog({ account, onOpenChange }: {
  account: BankAccount
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery(bankTransferQueryOptions(account.id))
  const inFlight = useRef(false)
  const requestKeys = useRef(new Map<string, string>())
  const save = useMutation({
    networkMode: "always",
    mutationFn: (input: BankTransferInput) => createBankTransfer(account.id, input),
    onSuccess: (saved) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["accounting"] }),
      ])
      toast.success(`Traspaso ${saved.number} registrado.`, {
        description: `Póliza ${saved.policyNumber}`,
        action: { label: "Ver póliza", onClick: () => { void navigate(paths.accountingPolicy(saved.id)) } },
      })
      onOpenChange(false)
    },
    onSettled: () => { inFlight.current = false },
  })
  const preview = query.data
  const ready = preview?.canWrite && preview.sources.length > 0 && !query.isFetching && !query.isError

  function close() {
    if (!inFlight.current) onOpenChange(false)
  }

  function submit(fields: TransferDraftInput) {
    if (!ready || inFlight.current) return
    const signature = JSON.stringify(fields)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ ...fields, requestKey })
  }

  return <ErpDataDialog defaultWidth={460} description={`Traspaso a la cuenta ${account.code}`}
    onOpenChange={(open) => { if (!open) close() }} title="Traspaso a cuentas propias" tone="banking">
    <ErpDataDialogBody className="grid gap-2" onKeyDown={(event) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    }}>
      {query.isFetching && <div className="grid min-h-16 place-items-center"><Spinner /></div>}
      {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
      {!query.isFetching && preview && !ready && <Alert><AlertDescription>{preview.reason || "No hay cuentas de origen para el traspaso."}</AlertDescription></Alert>}
      {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
      {ready && preview ? <TransferDraft onClose={close} onSubmit={submit} pending={save.isPending} preview={preview} /> : (
        <div className="flex justify-end gap-1">
          <Button onClick={close} size="sm" type="button" variant="outline">Cancelar</Button>
          {query.isError && <Button disabled={query.isFetching} onClick={() => void query.refetch()} size="sm" type="button">Reintentar</Button>}
        </div>
      )}
    </ErpDataDialogBody>
  </ErpDataDialog>
}
