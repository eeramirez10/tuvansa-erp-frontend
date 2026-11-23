import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react"
import { Controller, useForm, useWatch, type FieldPathByValue } from "react-hook-form"
import { z } from "zod"

import { BankAccountBalances } from "@/features/treasury/banking/components/bank-account-balances"
import { bankAccountFormQueryOptions, bankAccountKeys } from "@/features/treasury/banking/logic"
import type { BankAccount, BankAccountFormFields, BankAccountFormPreview, CreateBankAccountInput, UpdateBankAccountInput } from "@/features/treasury/banking/model"
import { createBankAccount, updateBankAccount } from "@/features/treasury/banking/services/bank-account-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Spinner } from "@/shared/ui/spinner"

type TextField = FieldPathByValue<BankAccountFormFields, string>
type NumberField = FieldPathByValue<BankAccountFormFields, number>
type BooleanField = FieldPathByValue<BankAccountFormFields, boolean>
type EditorProps = {
  mode?: "create" | "edit"
  account?: BankAccount
  actions?: ReactNode
  onClose: () => void
  onSaved: (account: BankAccount) => void
}

const emptyFiscalSettings = { annualInflationAdjustment: 0, deductibleIetu: false, nonDeductibleVat: false }
const compactInput = "h-6 min-w-0 px-1 text-[10px]"
const viewOptions: BankAccountFormPreview["options"] = {
  codeLengths: [],
  currencies: [{ id: 0, name: "Pesos" }, { id: 1, name: "Pesos" }, { id: 2, name: "Dólares" }],
  natures: [{ id: "debtor", name: "Deudora" }, { id: "creditor", name: "Acreedora" }],
  systemTypes: [{ id: "bank", name: "Banco" }, { id: "expense", name: "Gasto" }, { id: "other", name: "Otro" }],
}
const fiscalOptions = [{ id: 0, name: "No" }, { id: 1, name: "Créditos" }, { id: 2, name: "Débitos" }]
const blankFields: BankAccountFormFields = {
  code: "", family: "", accountNumber: "", branch: "", name: "", nature: "debtor", systemType: "other", currencyId: 0,
  control: {
    manager: "", phone: "", customerNumber: "0", controlEnabled: false, nextCheckNumber: 0, nextDepositNumber: 0,
    nextTransferNumber: 0, subAccounts: false, preventJournalEntries: false, format: "", movements: false,
    budgetable: false, company: 0, deposits: false, payments: false, multiCompany: 0,
  },
  prorationPercentages: { sales: 0, inventory: 0, distribution: 0, advance: 0 },
  fiscalReports: emptyFiscalSettings,
}

function fieldsForAccount(account?: BankAccount): BankAccountFormFields {
  if (!account) return blankFields
  const { code, family, accountNumber, branch, name, nature, systemType, currency, control, prorationPercentages, fiscalReports } = account
  return { code, family, accountNumber, branch, name, nature, systemType, currencyId: currency.id, control, prorationPercentages, fiscalReports }
}

const fieldLengths = {
  family: 13, accountNumber: 25, branch: 4, name: 40,
  "control.manager": 30, "control.phone": 20, "control.customerNumber": 18, "control.format": 15,
} satisfies Partial<Record<TextField, number>>

function formSchema(options: BankAccountFormPreview["options"], editable: ReadonlySet<string>) {
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
      .refine((value) => !editable.has("code") || (/^\d+$/.test(value) && options.codeLengths.includes(value.length)), {
        error: `La cuenta debe tener ${options.codeLengths.join(", ")} dígitos.`,
      }),
    family: text("family"),
    accountNumber: text("accountNumber"),
    branch: text("branch"),
    name: text("name"),
    nature: z.enum(["debtor", "creditor"]),
    systemType: z.enum(["bank", "expense", "other"]),
    currencyId: z.number().refine(
      (value) => !editable.has("currencyId") || options.currencies.some(({ id }) => id === value),
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
    fiscalReports: z.object({
      annualInflationAdjustment: integer("fiscalReports.annualInflationAdjustment", 2),
      deductibleIetu: z.boolean(),
      nonDeductibleVat: z.boolean(),
    }),
  })
}

function BankAccountSheet({ account, initialPreview, pending, actions, notice, onSave, onClose, focusField }: {
  account?: BankAccount
  initialPreview?: BankAccountFormPreview
  pending: boolean
  actions: ReactNode
  notice: ReactNode
  onSave: (fields: BankAccountFormFields, revision: string | null) => void
  onClose: () => void
  focusField?: "code" | "family"
}) {
  const prefix = useId()
  const [preview] = useState(initialPreview)
  const options = preview?.options ?? viewOptions
  const editable = useMemo(() => new Set(preview?.editableFields), [preview?.editableFields])
  const values = fieldsForAccount(account)
  const form = useForm<BankAccountFormFields>({
    defaultValues: preview?.fields ?? values,
    values: preview ? undefined : values,
    resolver: zodResolver(formSchema(options, editable)),
  })
  const { setFocus } = form
  useEffect(() => {
    if (focusField && editable.has(focusField)) setFocus(focusField)
  }, [editable, focusField, setFocus])
  const currencyId = useWatch({ control: form.control, name: "currencyId" })
  const currencyName = currencyId === account?.currency.id ? account.currency.name
    : currencyId === 0 ? "Pesos" : options.currencies.find(({ id }) => id === currencyId)?.name ?? ""
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
      <div className={`flex min-h-6 items-center gap-1 ${className}`}>
        <Checkbox aria-labelledby={`${id}-label`} checked={field.value} className="after:inset-0"
          disabled={pending || !editable.has(name)} id={id} inputRef={field.ref} name={field.name}
          onBlur={field.onBlur} onCheckedChange={(checked) => field.onChange(checked)} />
        <Label className="text-[9px]" htmlFor={id} id={`${id}-label`}>{label}</Label>
      </div>
    )} />
  }

  function choice(name: "nature" | "systemType" | "fiscalReports.annualInflationAdjustment", label: string,
    items: ReadonlyArray<{ id: string | number; name: string }>) {
    return <Controller control={form.control} name={name} render={({ field }) => (
      <RadioGroup aria-label={label} className="flex flex-wrap gap-2" name={field.name}
        disabled={pending || !editable.has(name)} value={String(field.value)}
        onValueChange={(value) => field.onChange(name === "fiscalReports.annualInflationAdjustment" ? Number(value) : value)}>
        {items.map((item) => (
          <div className="flex items-center gap-1" key={item.id}>
            <RadioGroupItem className="after:inset-0" id={`${prefix}-${name}-${item.id}`} value={String(item.id)} />
            <Label className="text-[9px]" htmlFor={`${prefix}-${name}-${item.id}`}>{item.name}</Label>
          </div>
        ))}
      </RadioGroup>
    )} />
  }

  return <form aria-label="Ficha de Bancos" className="grid min-w-0 gap-2 xl:grid-cols-[10rem_minmax(0,1fr)]" noValidate
    onKeyDown={(event) => {
      if (!focusField || event.key !== "Escape" || event.defaultPrevented) return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }} onSubmit={form.handleSubmit((fields) => { if (preview) onSave(fields, preview.revision) })}>
    <aside className="flex min-w-0 flex-col">{actions}</aside>
    <fieldset className="grid min-w-0 items-start gap-2 sm:grid-cols-[minmax(0,1.7fr)_minmax(11rem,0.8fr)]" disabled={pending}>
      {notice}
      <div className="grid min-w-0 gap-2">
        <Card size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Datos de la cuenta</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-12 gap-1.5 py-1">
            {input("code", "Código", "col-span-6", { maxLength: options.codeLengths.at(-1) ?? 16 })}
            {input("family", "Familia", "col-span-6", { maxLength: fieldLengths.family })}
            {input("accountNumber", "Número", "col-span-8", { maxLength: fieldLengths.accountNumber })}
            {input("branch", "Sucursal", "col-span-4", { maxLength: fieldLengths.branch })}
            {input("name", "Nombre", "col-span-full", { maxLength: fieldLengths.name })}
            <div className="col-span-full flex flex-wrap justify-between gap-1 py-1">
              {choice("nature", "Naturaleza", options.natures)}
              {choice("systemType", "Tipo de cuenta", options.systemTypes)}
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
            {input("currencyId", "Moneda", "col-span-6", { numeric: true })}
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
            <div className="col-span-full grid grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-1.5">
              {input("prorationPercentages.sales", "% Vta.", "", { numeric: true })}
              {input("prorationPercentages.inventory", "% Inv.", "", { numeric: true })}
              {input("prorationPercentages.distribution", "% Dist.", "", { numeric: true })}
              {input("prorationPercentages.advance", "% Anti.", "", { numeric: true })}
              <span className="self-end pb-1 text-[9px]">=100%</span>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Información para reportes Fiscales:</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-x-3 py-1">
            <span>Ajuste anual por inflación</span>
            {choice("fiscalReports.annualInflationAdjustment", "Ajuste anual por inflación", fiscalOptions)}
            {check("fiscalReports.deductibleIetu", "Deducible IETU")}
            {check("fiscalReports.nonDeductibleVat", "No Deducible IVA")}
          </CardContent>
        </Card>
      </div>
      <BankAccountBalances balances={account?.balances} currencyBalances={account?.currencyBalances}
        createdAt={account?.createdAt ?? null} currencyName={currencyName} />
    </fieldset>
  </form>
}

export function BankAccountForm({ mode, account, actions, onClose, onSaved }: EditorProps) {
  const queryClient = useQueryClient()
  const id = account?.id ?? null
  const query = useQuery({ ...bankAccountFormQueryOptions(id), enabled: Boolean(mode) })
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
  const preview = mode && query.isFetchedAfterMount ? query.data : undefined
  const ready = preview?.canWrite && (mode === "create" || Boolean(preview.revision))

  function close() {
    if (!inFlight.current) onClose()
  }

  function submit(fields: BankAccountFormFields, revision: string | null) {
    if (!mode || inFlight.current) return
    if (mode === "edit") {
      if (!account || !revision) return
      inFlight.current = true
      save.mutate({ id: account.id, fields, revision })
      return
    }

    const signature = JSON.stringify(fields)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ fields, requestKey })
  }

  const notice = !mode ? null : save.isError
    ? <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>
    : !preview && query.isFetching
      ? <p className="flex items-center gap-1" role="status"><Spinner /> Cargando ficha</p>
      : !preview && query.isError
        ? <Alert variant="destructive"><AlertDescription className="flex flex-wrap items-center gap-2">
          {getApiErrorMessage(query.error)}
          <Button onClick={() => void query.refetch()} size="sm" type="button">Reintentar</Button>
        </AlertDescription></Alert>
        : preview && !ready ? <Alert><AlertDescription>{preview.reason || "No se pudo preparar la ficha."}</AlertDescription></Alert> : null

  return <BankAccountSheet account={account} initialPreview={ready ? preview : undefined}
    key={ready ? "editable" : "read-only"} onClose={close} onSave={submit} pending={save.isPending}
    focusField={mode === "create" ? "code" : mode === "edit" ? "family" : undefined}
    actions={mode ? <Card className="flex h-full min-h-28 flex-col" size="sm">
      <CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Acciones</CardTitle></CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-2 py-1">
        <p className="text-muted-foreground" role="status">{mode === "create" ? "Alta" : "Cambia datos de banco"}</p>
        <div className="flex flex-wrap gap-1">
          <Button disabled={!ready || save.isPending} size="sm" type="submit">{save.isPending && <Spinner />}OK</Button>
          <Button disabled={save.isPending} onClick={close} size="sm" type="button" variant="outline">Cancelar</Button>
        </div>
      </CardContent>
    </Card> : actions}
    notice={notice && <div className="sm:col-span-2">{notice}</div>} />
}
