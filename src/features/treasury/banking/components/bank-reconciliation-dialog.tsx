import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useId, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { accountingPolicyQueryOptions } from "@/features/accounting/policies/logic"
import { BankPanelTable, type BankPanelColumn } from "@/features/treasury/banking/components/bank-panel-table"
import { printBankPolicy } from "@/features/treasury/banking/components/bank-policy-print"
import { bankAccountKeys, bankMoney, bankPanelQueryOptions } from "@/features/treasury/banking/logic"
import type { BankAccount, BankPanel, BankPostdateInput, BankReconciliationInput, BankTransitInput } from "@/features/treasury/banking/model"
import { registerBankReconciliation, setBankPostdate, setBankTransit } from "@/features/treasury/banking/services/bank-account-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

type DraftInput = Omit<BankReconciliationInput, "requestKey">
type PostdateDraft = Omit<BankPostdateInput, "requestKey">

const columns: BankPanelColumn[] = [
  { label: "Beneficiario", key: "beneficiary" }, { label: "OK", key: "reconciled" },
  { label: "TM", key: "movementType" }, { label: "Cheque", key: "checkNumber" },
  { label: "Póliza", key: "policyNumber" }, { label: "Fecha", key: "policyDate" },
  { label: "Cargos", key: "charge", numeric: true }, { label: "Abonos", key: "credit", numeric: true },
  { label: "C.C.", key: "costCenter" }, { label: "T", key: "inTransit" },
  { label: "Fecha P.", key: "postdatedAt" }, { label: "T.C.", key: "accountingType" },
]
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

function ReconciliationDraft({ data, locked, saving, changingTransit, onClose, onSave, onTransit, onPostdate }: {
  data: BankPanel
  locked: boolean
  saving: boolean
  changingTransit: boolean
  onClose: () => void
  onSave: (input: DraftInput) => void
  onTransit: (input: BankTransitInput) => Promise<boolean>
  onPostdate: (input: PostdateDraft) => void
}) {
  const dateId = useId()
  const balanceId = useId()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(new Set<number>())
  const [focusedId, setFocusedId] = useState<number | null>(null)
  const [transitOnly, setTransitOnly] = useState(false)
  const rows = transitOnly ? data.items.filter((row) => row.inTransit === "*") : data.items
  const focused = rows.find((row) => row.movementId === focusedId)
  const policyId = typeof focused?.policyId === "number" && focused.policyId > 0 ? focused.policyId : null
  const postdateRevision = focused?.postdateRevision
  const print = useMutation({
    mutationFn: async (id: number) => printBankPolicy(await queryClient.fetchQuery(accountingPolicyQueryOptions(id))),
  })
  const movements = useMemo(() => {
    const result = new Map<number, { net: number; date: string; historical: boolean }>()
    for (const row of data.items) {
      const id = reconcilableMovementId(row)
      const charge = cents(row.charge)
      const credit = cents(row.credit)
      if (id !== null && charge !== null && credit !== null) {
        result.set(id, { net: charge - credit, date: datePart(row.policyDate), historical: row.historical === true })
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
  const cutoffDates = [datePart(data.summary?.lastStatementDate), ...selectedMovements.map(({ date }) => date)]
  if (selectedMovements.some(({ historical }) => historical)) cutoffDates.push(datePart(data.summary?.lastLegacyStatementDate))
  const earliest = cutoffDates.reduce((latest, date) => date > latest ? date : latest, "")
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
      <BankPanelTable columns={movements.size ? [selectionColumn, ...columns] : columns} rows={rows}
        onSelect={(row) => {
          print.reset()
          setFocusedId(typeof row.movementId === "number" ? row.movementId : null)
        }} selectedId={focusedId} />
      {transitOnly && rows.length === 0 && <p className="text-muted-foreground" role="status">Sin movimientos en tránsito.</p>}
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
      {movements.size === 0 && <p className="text-muted-foreground" role="status">Sin movimientos disponibles para conciliar.</p>}
      {print.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(print.error)}</AlertDescription></Alert>}
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
          <Button disabled={policyId === null || print.isPending} size="xs" type="button" variant="outline"
            onClick={() => { if (policyId !== null) print.mutate(policyId) }}>
            {print.isPending && <Spinner />}Imprimir Póliza
          </Button>
          <Button disabled size="xs" type="button" variant="outline">Imprimir Cheque</Button>
          <Button disabled={locked || focused?.canChangeTransit !== true} size="xs" type="button" variant="outline"
            aria-pressed={focused?.inTransit === "*"} onClick={async () => {
              if (!focused || typeof focused.movementId !== "number") return
              const movementId = focused.movementId
              const inTransit = focused.inTransit !== "*"
              if (await onTransit({ movementId, inTransit }) && inTransit) {
                setSelected((previous) => {
                  const next = new Set(previous)
                  next.delete(movementId)
                  return next
                })
                clearErrors()
              }
            }}>
            {changingTransit && <Spinner />}Tránsito
          </Button>
          <Button aria-pressed={transitOnly} disabled={locked} onClick={() => setTransitOnly((value) => !value)}
            size="xs" type="button" variant="outline">Filtra tránsito</Button>
          <Button disabled size="xs" type="button" variant="outline">Detalle</Button>
          <Button disabled={locked || policyId === null || typeof postdateRevision !== "number"} size="xs" type="button" variant="outline"
            onClick={() => {
              if (focusedId === null || policyId === null || typeof postdateRevision !== "number") return
              const currentDate = datePart(focused?.postdatedAt)
              onPostdate({ movementId: focusedId, policyId, revision: postdateRevision, postDate: currentDate > "1900-12-31" ? currentDate : null })
            }}>FP</Button>
        </div>
        <div className="ml-auto flex gap-1">
          <Button disabled={saving || changingTransit} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
          <Button disabled={disabled} size="sm" type="submit">{saving && <Spinner />}Registrar</Button>
        </div>
      </footer>
    </form>
  )
}

function BankPostdateDialog({ draft, pending, error, onClose, onSave }: {
  draft: PostdateDraft
  pending: boolean
  error: Error | null
  onClose: () => void
  onSave: (input: PostdateDraft) => void
}) {
  const dateId = useId()
  const [postDate, setPostDate] = useState(draft.postDate ?? "")
  return (
    <ErpDataDialog defaultWidth={340} description="Fecha de posfechado de la póliza seleccionada"
      onOpenChange={onClose} title="Fecha P." tone="banking">
      <ErpDataDialogBody>
        <form className="grid gap-2" onSubmit={(event) => {
          event.preventDefault()
          if (!pending) onSave({ ...draft, postDate: postDate || null })
        }} onKeyDown={(event) => {
          if (event.key !== "Escape" || pending) return
          event.preventDefault()
          event.stopPropagation()
          onClose()
        }}>
          <Label htmlFor={dateId}>Fecha de posfechado</Label>
          <Input id={dateId} type="date" value={postDate}
            disabled={pending} onChange={(event) => setPostDate(event.target.value)} />
          {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
          <div className="flex justify-end gap-1">
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={pending}>{pending && <Spinner />}Guardar</Button>
          </div>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function BankReconciliationDialog({ account, onOpenChange }: {
  account: BankAccount
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [draftVersion, setDraftVersion] = useState(0)
  const [postdateDraft, setPostdateDraft] = useState<PostdateDraft | null>(null)
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
  const transit = useMutation({
    networkMode: "always",
    mutationFn: (input: BankTransitInput) => setBankTransit(account.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
    onSettled: () => { inFlight.current = false },
  })
  const postdate = useMutation({
    networkMode: "always",
    mutationFn: (input: BankPostdateInput) => setBankPostdate(account.id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["accounting"] }),
      ])
      setPostdateDraft(null)
      toast.success("Fecha de posfechado guardada.")
    },
    onSettled: () => { inFlight.current = false },
  })

  function savePostdate(input: PostdateDraft) {
    if (inFlight.current) return
    const signature = JSON.stringify(input)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    postdate.mutate({ ...input, requestKey })
  }

  function closePostdate() {
    if (inFlight.current) return
    if (isAxiosError(postdate.error) && postdate.error.response?.status === 409) void query.refetch()
    postdate.reset()
    setPostdateDraft(null)
  }

  function close() {
    if (!inFlight.current) onOpenChange(false)
  }

  function submit(input: DraftInput) {
    if (inFlight.current || query.isFetching) return

    transit.reset()
    const signature = JSON.stringify(input)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ ...input, requestKey })
  }

  async function changeTransit(input: BankTransitInput) {
    if (inFlight.current || query.isFetching) return false
    save.reset()
    inFlight.current = true
    try {
      await transit.mutateAsync(input)
      return true
    } catch {
      return false
    }
  }

  const ready = query.data?.available && !query.isError
  const mutationError = save.error ?? transit.error
  const conflict = isAxiosError(mutationError) && mutationError.response?.status === 409
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
        {mutationError && <Alert variant="destructive"><AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          {getApiErrorMessage(mutationError)}
          {conflict && <Button disabled={query.isFetching} onClick={() => {
            save.reset()
            transit.reset()
            void query.refetch()
          }} size="xs" type="button" variant="outline">Actualizar pendientes</Button>}
        </AlertDescription></Alert>}
        {ready && query.data ? (
          <ReconciliationDraft data={query.data} key={draftVersion} locked={query.isFetching || save.isPending || transit.isPending || postdateDraft !== null}
            onClose={close} onSave={submit} onTransit={changeTransit} onPostdate={setPostdateDraft}
            saving={save.isPending} changingTransit={transit.isPending} />
        ) : (
          <div className="flex justify-end gap-1">
            <Button onClick={close} size="sm" type="button" variant="outline">Cancelar</Button>
            {query.isError && <Button disabled={query.isFetching} onClick={() => void query.refetch()} size="sm" type="button">Reintentar</Button>}
          </div>
        )}
      </ErpDataDialogBody>
      {postdateDraft && <BankPostdateDialog draft={postdateDraft} error={postdate.error} pending={postdate.isPending}
        onClose={closePostdate} onSave={savePostdate} />}
    </ErpDataDialog>
  )
}
