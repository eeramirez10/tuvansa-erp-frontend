import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useMemo, useRef } from "react"
import { Controller, useForm, useWatch, type FieldPathByValue } from "react-hook-form"
import { z } from "zod"

import { BankAccountBalances, BankAccountFiscalSettings } from "@/features/treasury/banking/components/bank-account-details"
import { bankAccountFormQueryOptions, bankAccountKeys } from "@/features/treasury/banking/logic"
import type { BankAccount, BankAccountFormFields, BankAccountFormPreview, CreateBankAccountInput, UpdateBankAccountInput } from "@/features/treasury/banking/model"
import { createBankAccount, updateBankAccount } from "@/features/treasury/banking/services/bank-account-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

type TextField = FieldPathByValue<BankAccountFormFields, string>
type NumberField = FieldPathByValue<BankAccountFormFields, number>
type BooleanField = FieldPathByValue<BankAccountFormFields, boolean>
type EditorProps = { onClose: () => void; onSaved: (account: BankAccount) => void } & (
  | { mode: "create"; account?: never }
  | { mode: "edit"; account: BankAccount }
)

const emptyBalances = { current: 0, bank: 0, previous: 0, inTransit: 0 }
const emptyCurrencyBalances = { current: 0, month12: 0, previous: 0 }
const emptyFiscalSettings = { annualInflationAdjustment: 0, deductibleIetu: false, nonDeductibleVat: false }
const compactInput = "h-6 min-w-0 px-1 text-[10px]"

const fieldLengths = {
  family: 13, accountNumber: 25, branch: 4, name: 40,
  "control.manager": 30, "control.phone": 20, "control.customerNumber": 18, "control.format": 15,
} satisfies Partial<Record<TextField, number>>

function formSchema(preview: BankAccountFormPreview, editable: ReadonlySet<string>) {
  const text = (name: keyof typeof fieldLengths) => z.string()
    .transform((value) => editable.has(name) ? value.trim() : value)
    .refine((value) => !editable.has(name) || value.length <= fieldLengths[name], {
      error: `Captura hasta ${fieldLengths[name]} caracteres.`,
    })
  const integer = (name: NumberField, max = Number.MAX_SAFE_INTEGER) => z.number().refine(
    (value) => !editable.has(name) || (Number.isSafeInteger(value) && value >= 0 && value <= max),
    { error: "Captura un número entero válido." },
  )

  return z.object({
    code: z.string().transform((value) => editable.has("code") ? value.trim() : value)
      .refine((value) => !editable.has("code") || (/^\d+$/.test(value) && preview.options.codeLengths.includes(value.length)), {
        error: `La cuenta debe tener ${preview.options.codeLengths.join(", ")} dígitos.`,
      }),
    family: text("family"),
    accountNumber: text("accountNumber"),
    branch: text("branch"),
    name: text("name"),
    nature: z.enum(["debtor", "creditor"]),
    systemType: z.enum(["bank", "expense", "other"]),
    currencyId: z.number().refine(
      (value) => !editable.has("currencyId") || preview.options.currencies.some(({ id }) => id === value),
      { error: "Selecciona una moneda." },
    ),
    control: z.object({
      manager: text("control.manager").refine((value) => !editable.has("control.manager") || value !== "T", {
        error: "La clave de gerente T está reservada para el catálogo heredado.",
      }),
      phone: text("control.phone"),
      customerNumber: text("control.customerNumber").refine(
        (value) => !editable.has("control.customerNumber") || /^\d*$/.test(value),
        { error: "Captura únicamente dígitos." },
      ).transform((value) => editable.has("control.customerNumber") ? value.replace(/^0+(?=\d)/, "") || "0" : value),
      controlEnabled: z.boolean(),
      nextCheckNumber: integer("control.nextCheckNumber"),
      nextDepositNumber: integer("control.nextDepositNumber"),
      nextTransferNumber: integer("control.nextTransferNumber", 2_147_483_647),
      subAccounts: z.boolean(),
      preventJournalEntries: z.boolean(),
      format: text("control.format"),
      movements: z.boolean(),
      budgetable: z.boolean(),
      company: integer("control.company", 255),
      deposits: z.boolean(),
      payments: z.boolean(),
      multiCompany: integer("control.multiCompany", 255),
    }),
    prorationPercentages: z.object({
      sales: integer("prorationPercentages.sales", 100),
      inventory: integer("prorationPercentages.inventory", 100),
      distribution: integer("prorationPercentages.distribution", 100),
      advance: integer("prorationPercentages.advance", 100),
    }),
  })
}

function BankAccountDraft({ account, preview, pending, onSave, onClose }: {
  account?: BankAccount
  preview: BankAccountFormPreview
  pending: boolean
  onSave: (fields: BankAccountFormFields) => void
  onClose: () => void
}) {
  const prefix = useId()
  const editable = useMemo(() => new Set(preview.editableFields), [preview.editableFields])
  const form = useForm<BankAccountFormFields>({
    defaultValues: preview.fields,
    resolver: zodResolver(formSchema(preview, editable)),
  })
  const currencyId = useWatch({ control: form.control, name: "currencyId" })
  const currencyItems = preview.options.currencies.map(({ id, name }) => ({ value: String(id), label: name }))
  const currencyName = preview.options.currencies.find(({ id }) => id === currencyId)?.name ?? account?.currency.name ?? ""
  const labelClass = "truncate text-[9px]"

  function input(name: TextField | NumberField, label: string, className: string, { numeric = false, maxLength }: {
    numeric?: boolean; maxLength?: number
  } = {}) {
    const id = `${prefix}-${name}`
    const error = form.getFieldState(name, form.formState).error?.message
    return <div className={`grid min-w-0 content-start gap-0.5 ${className}`}>
      <Label className={labelClass} htmlFor={id}>{label}</Label>
      <Input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)}
        className={compactInput + (numeric ? " text-right tabular-nums" : "")}
        id={id} maxLength={maxLength} readOnly={!editable.has(name)} type={numeric ? "number" : "text"}
        {...form.register(name, { valueAsNumber: numeric })} />
      {error && <span className="text-destructive" id={`${id}-error`} role="alert">{error}</span>}
    </div>
  }

  function check(name: BooleanField, label: string, className = "") {
    const id = `${prefix}-${name}`
    return <Controller control={form.control} name={name} render={({ field }) => (
      <Label className={`flex h-6 items-center gap-1 text-[9px] ${className}`} htmlFor={id}>
        <Checkbox checked={field.value} disabled={pending || !editable.has(name)} id={id}
          onCheckedChange={(checked) => field.onChange(checked === true)} />
        {label}
      </Label>
    )} />
  }

  function choice(name: "nature" | "systemType", label: string, items: ReadonlyArray<{ id: string; name: string }>) {
    return <Controller control={form.control} name={name} render={({ field }) => (
      <RadioGroup aria-label={label} className="flex flex-wrap gap-2"
        disabled={pending || !editable.has(name)} value={field.value} onValueChange={field.onChange}>
        {items.map((item) => (
          <Label className="flex items-center gap-1 text-[9px]" htmlFor={`${prefix}-${item.id}`} key={item.id}>
            <RadioGroupItem id={`${prefix}-${item.id}`} value={item.id} />
            {item.name}
          </Label>
        ))}
      </RadioGroup>
    )} />
  }

  return <form className="grid gap-2" noValidate onSubmit={form.handleSubmit(onSave)}>
    <fieldset className="grid min-w-0 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,0.38fr)]" disabled={pending}>
      <div className="grid min-w-0 gap-2">
        <Card size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Datos de la cuenta</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-12 gap-1.5 py-1">
            {input("code", "Código", "col-span-6", { maxLength: Math.max(...preview.options.codeLengths) })}
            {input("family", "Familia", "col-span-6", { maxLength: fieldLengths.family })}
            {input("accountNumber", "Número", "col-span-8", { maxLength: fieldLengths.accountNumber })}
            {input("branch", "Sucursal", "col-span-4", { maxLength: fieldLengths.branch })}
            {input("name", "Nombre", "col-span-full", { maxLength: fieldLengths.name })}
            <div className="col-span-full flex flex-wrap justify-between gap-1 py-1">
              {choice("nature", "Naturaleza", preview.options.natures)}
              {choice("systemType", "Tipo de cuenta", preview.options.systemTypes)}
            </div>
          </CardContent>
        </Card>
        <Card size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Control</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-12 gap-1.5 py-1">
            {input("control.manager", "Gerente", "col-span-6", { maxLength: fieldLengths["control.manager"] })}
            {input("control.phone", "Teléfono", "col-span-6", { maxLength: fieldLengths["control.phone"] })}
            {input("control.customerNumber", "# Cliente", "col-span-6", { maxLength: fieldLengths["control.customerNumber"] })}
            {check("control.controlEnabled", "Control", "col-span-6 self-end")}
            {input("control.nextCheckNumber", "Nº Cheque", "col-span-4", { numeric: true })}
            {input("control.nextDepositNumber", "Nº Depósito", "col-span-4", { numeric: true })}
            {input("control.nextTransferNumber", "Nº Transf.", "col-span-4", { numeric: true })}
            <div className="col-span-6 grid gap-0.5">
              <Label className={labelClass} htmlFor={`${prefix}-currency`}>Moneda</Label>
              <Controller control={form.control} name="currencyId" render={({ field, fieldState }) => (
                <>
                  <Select disabled={pending || !editable.has("currencyId")} items={currencyItems} value={String(field.value)}
                    onValueChange={(value) => { if (value !== null) field.onChange(Number(value)) }}>
                    <SelectTrigger aria-invalid={Boolean(fieldState.error)} className="w-full" id={`${prefix}-currency`} ref={field.ref}
                      size="sm" onBlur={field.onBlur}><SelectValue /></SelectTrigger>
                    <SelectContent>{currencyItems.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                  </Select>
                  {fieldState.error && <span className="text-destructive" role="alert">{fieldState.error.message}</span>}
                </>
              )} />
            </div>
            {input("control.format", "Formato", "col-span-6", { maxLength: fieldLengths["control.format"] })}
            {input("control.company", "Cia", "col-span-6", { numeric: true })}
            {input("control.multiCompany", "Multicia Cia", "col-span-6", { numeric: true })}
            <div className="col-span-full grid grid-cols-2 gap-x-1.5">
              {check("control.subAccounts", "Sub ctas")}
              {check("control.preventJournalEntries", "No poder utilizar en pólizas")}
              {check("control.movements", "Movs")}
              {check("control.budgetable", "Presupuestable")}
              {check("control.deposits", "Depósitos")}
              {check("control.payments", "Pagos")}
            </div>
            {input("prorationPercentages.sales", "% Vta.", "col-span-3", { numeric: true })}
            {input("prorationPercentages.inventory", "% Inv.", "col-span-3", { numeric: true })}
            {input("prorationPercentages.distribution", "% Dist.", "col-span-3", { numeric: true })}
            {input("prorationPercentages.advance", "% Anti.", "col-span-3", { numeric: true })}
          </CardContent>
        </Card>
        <BankAccountFiscalSettings reports={account?.fiscalReports ?? emptyFiscalSettings} />
      </div>
      <BankAccountBalances balances={account?.balances ?? emptyBalances} currencyBalances={account?.currencyBalances ?? emptyCurrencyBalances}
        createdAt={account?.createdAt ?? null} currencyName={currencyName} />
    </fieldset>
    <footer className="flex justify-end gap-1">
      <Button disabled={pending} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
      <Button disabled={pending} size="sm" type="submit">{pending && <Spinner />}OK</Button>
    </footer>
  </form>
}

export function BankAccountFormDialog({ mode, account, onClose, onSaved }: EditorProps) {
  const queryClient = useQueryClient()
  const id = account?.id ?? null
  const query = useQuery(bankAccountFormQueryOptions(id))
  const inFlight = useRef(false)
  const requestKeys = useRef(new Map<string, string>())
  const save = useMutation({
    mutationFn: (input: CreateBankAccountInput | (UpdateBankAccountInput & { id: number })) => {
      if ("requestKey" in input) return createBankAccount(input)
      const { id, ...change } = input
      return updateBankAccount(id, change)
    },
    networkMode: "always",
    onSuccess: (saved) => {
      queryClient.setQueryData(bankAccountKeys.detail(saved.id), saved)
      void queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
      onSaved(saved)
    },
    onSettled: () => { inFlight.current = false },
  })
  const preview = query.data
  const ready = preview?.canWrite && (mode === "create" || Boolean(preview.revision)) && !query.isFetching && !query.isError

  function close() {
    if (!inFlight.current) onClose()
  }

  function submit(fields: BankAccountFormFields) {
    if (!ready || !preview || inFlight.current) return

    if (mode === "edit") {
      if (!preview.revision) return
      inFlight.current = true
      save.mutate({ id: account.id, fields, revision: preview.revision })
      return
    }

    const signature = JSON.stringify(fields)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ fields, requestKey })
  }

  const title = mode === "create" ? "Alta" : "Cambia datos de banco"
  return <ErpDataDialog defaultWidth={800} description={mode === "create" ? "Alta de cuenta bancaria" : `Cambio de ${account.code}`}
    onOpenChange={(open) => { if (!open) close() }} title={title} tone="banking">
    <ErpDataDialogBody className="grid gap-2" onKeyDown={(event) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    }}>
      {query.isFetching && <div className="grid min-h-16 place-items-center"><Spinner /></div>}
      {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
      {!query.isFetching && preview && !ready && <Alert><AlertDescription>{preview.reason || "No se pudo preparar el cambio."}</AlertDescription></Alert>}
      {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
      {ready && preview ? <BankAccountDraft account={account} preview={preview} key={preview.revision ?? "create"}
        onClose={close} onSave={submit} pending={save.isPending} /> : (
        <div className="flex justify-end gap-1">
          <Button onClick={close} size="sm" type="button" variant="outline">Cancelar</Button>
          {query.isError && <Button disabled={query.isFetching} onClick={() => void query.refetch()} size="sm" type="button">Reintentar</Button>}
        </div>
      )}
    </ErpDataDialogBody>
  </ErpDataDialog>
}
