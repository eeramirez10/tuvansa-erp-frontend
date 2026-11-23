import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useId, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { BankPanelTable, type BankPanelColumn } from "@/features/treasury/banking/components/bank-panel-table"
import { bankAccountKeys, bankMoney, bankPanelQueryOptions } from "@/features/treasury/banking/logic"
import type { BankAccount, BankPanel, BankReconciliationInput } from "@/features/treasury/banking/model"
import { registerBankReconciliation } from "@/features/treasury/banking/services/bank-account-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

type DraftInput = Omit<BankReconciliationInput, "requestKey">

const columns: BankPanelColumn[] = [
  { label: "Beneficiario", key: "beneficiary" }, { label: "OK", key: "reconciled" },
  { label: "TM", key: "movementType" }, { label: "Cheque", key: "checkNumber" },
  { label: "Póliza", key: "policyNumber" }, { label: "Fecha", key: "policyDate" },
  { label: "Cargos", key: "charge", numeric: true }, { label: "Abonos", key: "credit", numeric: true },
  { label: "C.C.", key: "costCenter" }, { label: "T", key: "inTransit" },
  { label: "Fecha P.", key: "postdatedAt" }, { label: "T.C.", key: "accountingType" },
]
const readOnlyActions = ["Imprimir Póliza", "Imprimir Cheque", "Tránsito", "Filtra tránsito", "Detalle", "FP"]
const mexicoDate = new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeZone: "America/Mexico_City" })
const fieldClass = "h-6 w-full"

function cents(value: unknown) {
  if (typeof value !== "number" && (typeof value !== "string" || value.trim() === "")) return null
  const amount = Number(value)
  const scaled = Math.round(amount * 100)
  return Number.isSafeInteger(scaled) && scaled / 100 === amount ? scaled : null
}

function displayCents(value: number | null) {
  return value === null ? "" : bankMoney(value / 100)
}

function datePart(value: unknown) {
  const date = typeof value === "string" ? value.slice(0, 10) : ""
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ""
}

function reconcilableMovementId(row: Record<string, unknown>) {
  const id = row.movementId
  return row.canReconcile === true && typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null
}

function reconciliationSchema({ earliest, latest, projected }: { earliest: string; latest: string; projected: number | null }) {
  return z.object({
    statementDate: z.iso.date({ error: "Captura una fecha válida." })
      .refine((date) => date >= earliest, { error: `La fecha debe ser igual o posterior a ${earliest}.` })
      .refine((date) => date <= latest, { error: "La fecha del estado de cuenta no puede ser posterior a hoy." }),
    statementBalance: z.string().trim()
      .regex(/^-?(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/, "Captura un saldo con hasta dos decimales.")
      .refine((value) => cents(value) !== null && cents(value) === projected, {
        error: `El saldo del estado de cuenta debe coincidir con el saldo proyectado de ${displayCents(projected)}.`,
      }),
  })
}

function ReconciliationDraft({ data, locked, saving, onClose, onSave }: {
  data: BankPanel
  locked: boolean
  saving: boolean
  onClose: () => void
  onSave: (input: DraftInput) => void
}) {
  const dateId = useId()
  const balanceId = useId()
  const [selected, setSelected] = useState(new Set<number>())
  const movements = useMemo(() => {
    const result = new Map<number, { net: number; date: string }>()
    for (const row of data.items) {
      const id = reconcilableMovementId(row)
      const charge = cents(row.charge)
      const credit = cents(row.credit)
      if (id !== null && charge !== null && credit !== null) {
        result.set(id, { net: charge - credit, date: datePart(row.policyDate) })
      }
    }
    return result
  }, [data.items])
  const bankBalance = cents(data.summary?.bankBalance)
  const movementIds = [...selected].sort((left, right) => left - right)
  const selectedMovements = movementIds.flatMap((id) => movements.get(id) ?? [])
  const changed = selectedMovements.length !== movementIds.length
  const net = selectedMovements.reduce((sum, movement) => sum + movement.net, 0)
  const validNet = Number.isSafeInteger(net)
  const projected = bankBalance !== null && validNet && Number.isSafeInteger(bankBalance + net) ? bankBalance + net : null
  const earliest = selectedMovements.reduce((latest, movement) => movement.date > latest ? movement.date : latest,
    datePart(data.summary?.lastStatementDate))
  const latest = mexicoDate.format()
  const { clearErrors, formState: { errors }, handleSubmit, register } = useForm({
    resolver: zodResolver(reconciliationSchema({ earliest, latest, projected })),
    defaultValues: { statementDate: "", statementBalance: "" },
  })
  const disabled = locked || changed || projected === null || movementIds.length === 0
  const selectionColumn: BankPanelColumn = {
    label: "Sel.",
    key: "selected",
    render: (row) => {
      const id = reconcilableMovementId(row)
      if (id === null || !movements.has(id)) return null

      return <Checkbox aria-label={`Seleccionar movimiento ${String(row.policyNumber || id)}`}
        checked={selected.has(id)} disabled={locked} onCheckedChange={(checked) => {
          setSelected((previous) => {
            const next = new Set(previous)
            if (checked === true) next.add(id)
            else next.delete(id)
            return next
          })
          clearErrors()
        }} />
    },
  }

  return (
    <form className="grid gap-1.5" noValidate onSubmit={handleSubmit(({ statementDate, statementBalance }) => {
      const amount = cents(statementBalance)
      if (disabled || bankBalance === null || amount === null) return
      onSave({ movementIds, statementDate, statementBalance: amount / 100, expectedBankBalance: bankBalance / 100 })
    })}>
      <div className="flex flex-wrap justify-end gap-1">
        <ErpDataMetric label="Saldo BANCO" value={displayCents(bankBalance)} />
        <ErpDataMetric label="Saldo tránsito" value={bankMoney(data.summary?.inTransitBalance)} />
        <ErpDataMetric label="Suma sel." value={displayCents(validNet ? net : null)} />
        <ErpDataMetric label="Saldo banco proyectado" value={displayCents(projected)} />
      </div>
      <BankPanelTable columns={movements.size ? [selectionColumn, ...columns] : columns} rows={data.items} />
      {changed && (
        <Alert><AlertDescription className="flex items-center justify-between gap-2">
          La lista de movimientos cambió. Revisa la selección.
          <Button disabled={locked} onClick={() => { setSelected(new Set()); clearErrors() }} size="xs" type="button" variant="outline">
            Limpiar selección
          </Button>
        </AlertDescription></Alert>
      )}
      {bankBalance === null && <p className="text-destructive" role="alert">No se pudo obtener el saldo bancario actual.</p>}
      {bankBalance !== null && projected === null && <p className="text-destructive" role="alert">El saldo proyectado excede el rango permitido.</p>}
      {movements.size === 0 && <p className="text-muted-foreground" role="status">Sin movimientos web pendientes para conciliar.</p>}
      <fieldset className="grid min-w-0 gap-1.5 sm:grid-cols-2" disabled={locked || movements.size === 0}>
        <div className="grid content-start gap-1">
          <Label htmlFor={dateId}>Fecha de estado de cuenta</Label>
          <Input aria-describedby={errors.statementDate ? `${dateId}-error` : undefined}
            aria-invalid={Boolean(errors.statementDate)} className={fieldClass} id={dateId}
            min={earliest || undefined} max={latest} required type="date" {...register("statementDate")} />
          {errors.statementDate && <span className="text-destructive" id={`${dateId}-error`} role="alert">{errors.statementDate.message}</span>}
        </div>
        <div className="grid content-start gap-1">
          <Label htmlFor={balanceId}>Saldo del estado de cuenta</Label>
          <Input aria-describedby={errors.statementBalance ? `${balanceId}-error` : undefined}
            aria-invalid={Boolean(errors.statementBalance)} className={fieldClass + " text-right tabular-nums"} id={balanceId}
            inputMode="decimal" required step={0.01} type="number" {...register("statementBalance")} />
          {errors.statementBalance && <span className="text-destructive" id={`${balanceId}-error`} role="alert">{errors.statementBalance.message}</span>}
        </div>
      </fieldset>
      <footer className="flex flex-wrap items-end justify-between gap-1">
        <div className="flex flex-wrap gap-1">
          {readOnlyActions.map((label) => <Button disabled key={label} size="xs" type="button" variant="outline">{label}</Button>)}
        </div>
        <div className="ml-auto flex gap-1">
          <Button disabled={saving} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
          <Button disabled={disabled} size="sm" type="submit">{saving && <Spinner />}Registrar</Button>
        </div>
      </footer>
    </form>
  )
}

export function BankReconciliationDialog({ account, onOpenChange }: {
  account: BankAccount
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [draftVersion, setDraftVersion] = useState(0)
  const inFlight = useRef(false)
  const requestKeys = useRef(new Map<string, string>())
  const query = useQuery({
    ...bankPanelQueryOptions(account.id, "reconciliation"),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
  const save = useMutation({
    networkMode: "always",
    mutationFn: (input: BankReconciliationInput) => registerBankReconciliation(account.id, input),
    onSuccess: async (saved) => {
      setDraftVersion((previous) => previous + 1)
      toast.success("Conciliación registrada.", { description: `Saldo banco ${bankMoney(saved.bankBalance)}` })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["accounting"] }),
      ])
    },
    onSettled: () => { inFlight.current = false },
  })

  function close() {
    if (!inFlight.current) onOpenChange(false)
  }

  function submit(input: DraftInput) {
    if (inFlight.current || query.isFetching) return

    const signature = JSON.stringify(input)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ ...input, requestKey })
  }

  const ready = query.data?.available && !query.isError
  const conflict = isAxiosError(save.error) && save.error.response?.status === 409
  return (
    <ErpDataDialog description={`Conciliar movimientos de la cuenta ${account.code}`} onOpenChange={close} title="Conciliar" tone="banking">
      <ErpDataDialogBody className="grid gap-1.5" onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault()
          event.stopPropagation()
          close()
        }
      }}>
        {query.isPending && <div className="grid min-h-64 place-items-center"><Spinner /></div>}
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        {query.data && !query.data.available && <Alert><AlertDescription>{query.data.reason || "Conciliación no disponible."}</AlertDescription></Alert>}
        {save.isError && <Alert variant="destructive"><AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          {getApiErrorMessage(save.error)}
          {conflict && <Button disabled={query.isFetching} onClick={() => {
            save.reset()
            void query.refetch()
          }} size="xs" type="button" variant="outline">Actualizar pendientes</Button>}
        </AlertDescription></Alert>}
        {ready && query.data ? (
          <ReconciliationDraft data={query.data} key={draftVersion} locked={query.isFetching || save.isPending}
            onClose={close} onSave={submit} saving={save.isPending} />
        ) : (
          <div className="flex justify-end gap-1">
            <Button onClick={close} size="sm" type="button" variant="outline">Cancelar</Button>
            {query.isError && <Button disabled={query.isFetching} onClick={() => void query.refetch()} size="sm" type="button">Reintentar</Button>}
          </div>
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
