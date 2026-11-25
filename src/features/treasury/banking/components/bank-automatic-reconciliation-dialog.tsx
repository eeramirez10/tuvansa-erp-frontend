import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useMemo, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  bankStatementCents,
  decodeBankStatement,
  matchBankStatement,
  matchedStatementCsv,
  parseBankStatement,
  statementBankMovement,
  type BankStatementMatch,
  type BankStatementRow,
} from "@/features/treasury/banking/bank-automatic-reconciliation"
import { BankPanelTable, type BankPanelColumn } from "@/features/treasury/banking/components/bank-panel-table"
import { bankAccountKeys, bankMoney } from "@/features/treasury/banking/logic"
import type { BankAccount, BankReconciliationInput } from "@/features/treasury/banking/model"
import { registerBankReconciliation } from "@/features/treasury/banking/services/bank-account-service"
import { getBankAutomaticReconciliation } from "@/features/treasury/banking/services/bank-automatic-reconciliation-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

type Match = Extract<BankStatementMatch, { status: "matched" }>
type Registration = { payload: BankReconciliationInput; matches: Match[] }

const mexicoDate = new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeZone: "America/Mexico_City" })
const dateSchema = z.iso.date()
const formSchema = z.object({
  statementDate: dateSchema,
  statementBalance: z.string().refine((amount) => bankStatementCents(amount) !== null),
})

const bankColumns: BankPanelColumn[] = [
  { label: "Fecha", key: "policyDate" }, { label: "Ch./Dep.", key: "bankReference" }, { label: "Póliza", key: "policyNumber" },
  { label: "Concepto", key: "displayDescription" }, { label: "Ingresos", key: "charge", numeric: true },
  { label: "Egresos", key: "credit", numeric: true }, { label: "Fila", key: "statementLine" },
]

const statusLabels: Record<BankStatementMatch["status"], string> = {
  matched: "Coincide", ambiguous: "Ambigua", unmatched: "Sin coincidencia", "outside-cutoff": "Fuera del corte",
}

function sumCents(rows: readonly BankStatementRow[]) {
  const sum = rows.reduce((total, current) => total + BigInt(current.amountCents), 0n)
  const numeric = Number(sum)
  return Number.isSafeInteger(numeric) ? numeric : null
}

function money(cents: number | null) {
  return cents === null ? "" : bankMoney(cents / 100)
}

function downloadMatches(accountCode: string, matches: Match[]) {
  const url = URL.createObjectURL(new Blob([matchedStatementCsv(matches)], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "coincidencias-" + accountCode + ".csv"
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function BankAutomaticReconciliationDialog({ account, onOpenChange }: {
  account: BankAccount
  onOpenChange: (open: boolean) => void
}) {
  const dateId = useId()
  const balanceId = useId()
  const fileId = useId()
  const queryClient = useQueryClient()
  const inFlight = useRef(false)
  const requestKeys = useRef(new Map<string, string>())
  const [statementRows, setStatementRows] = useState<BankStatementRow[]>([])
  const [registered, setRegistered] = useState<Match[]>([])
  const [excluded, setExcluded] = useState(new Set<number>())
  const [links, setLinks] = useState(new Map<number, number>())
  const [linkLine, setLinkLine] = useState(0)
  const [linkMovement, setLinkMovement] = useState(0)
  const [fileName, setFileName] = useState("")
  const [fileError, setFileError] = useState("")
  const [reading, setReading] = useState(false)
  const today = mexicoDate.format()
  const { control, register, handleSubmit } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { statementDate: today, statementBalance: "" },
  })
  const cutoff = useWatch({ control, name: "statementDate" })
  const statementBalance = useWatch({ control, name: "statementBalance" })
  const validDate = dateSchema.safeParse(cutoff).success && cutoff <= today
  const query = useQuery({
    queryKey: [...bankAccountKeys.panel(account.id, "automatic-reconciliation"), cutoff],
    queryFn: ({ signal }) => getBankAutomaticReconciliation(account.id, cutoff, signal),
    enabled: validDate,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
  const save = useMutation({
    networkMode: "always",
    mutationFn: ({ payload }: Registration) => registerBankReconciliation(account.id, payload),
    onSuccess: async (saved, { matches }) => {
      setRegistered((current) => [...current, ...matches])
      toast.success("Conciliación registrada.", { description: "Saldo banco " + bankMoney(saved.bankBalance) })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["accounting"] }),
      ])
    },
    onSettled: () => { inFlight.current = false },
  })
  const data = validDate ? query.data : undefined
  const registeredByLine = useMemo(() => new Map(registered.map((match) => [match.row.line, match])), [registered])
  const matches = useMemo(() => matchBankStatement(
    statementRows.filter(({ line }) => !registeredByLine.has(line)), data?.items ?? [], cutoff, links,
  ), [cutoff, data?.items, links, registeredByLine, statementRows])
  const matchesByLine = useMemo(() => new Map(matches.map((match) => [match.row.line, match])), [matches])
  const uniqueMatches = matches.filter((item): item is Match => item.status === "matched")
  const selected = uniqueMatches.filter(({ movementId }) => !excluded.has(movementId))
  const matchedLineByMovement = new Map(uniqueMatches.map(({ movementId, row }) => [movementId, row.line]))
  const linkableRows = matches.filter(({ row, status }) => status === "unmatched" || status === "ambiguous" || links.has(row.line))
  const linkRow = linkableRows.find(({ row }) => row.line === linkLine)?.row
  const linkOptions = linkRow ? (data?.items ?? []).flatMap((row) => {
    const movement = statementBankMovement(row, cutoff)
    if (!movement || movement.amountCents !== linkRow.amountCents) return []
    const assigned = matchedLineByMovement.get(movement.movementId)
    return assigned === undefined || assigned === linkLine ? [{ ...movement, reference: row.bankNumber ?? row.checkNumber }] : []
  }) : []
  const lastWebDate = typeof data?.summary?.lastStatementDate === "string" ? data.summary.lastStatementDate : ""
  const historicalIds = new Set(data?.items.filter(({ historical }) => historical === true).map(({ movementId }) => movementId))
  const lastLegacyDate = selected.some(({ movementId }) => historicalIds.has(movementId))
    && typeof data?.summary?.lastLegacyStatementDate === "string" ? data.summary.lastLegacyStatementDate : ""
  const lastStatementDate = lastWebDate > lastLegacyDate ? lastWebDate : lastLegacyDate
  const cutoffValid = validDate && cutoff >= lastStatementDate
  const bank = bankStatementCents(data?.summary?.bankBalance)
  const net = sumCents(selected.map(({ row }) => row))
  const projected = bank !== null && net !== null && Number.isSafeInteger(bank + net) ? bank + net : null
  const rawStatement = bankStatementCents(statementBalance)
  const balanceAgrees = rawStatement !== null && rawStatement === projected
  const locked = save.isPending || reading || query.isFetching
  const submitEnabled = data?.available && !query.isError && cutoffValid && !locked && !fileError
    && selected.length > 0 && balanceAgrees && bank !== null

  function close() {
    if (!inFlight.current) onOpenChange(false)
  }

  function resetLinks() {
    setLinks(new Map())
    setLinkLine(0)
    setLinkMovement(0)
  }

  function updateLink(movement: number) {
    if (locked || !linkRow || (movement && !linkOptions.some(({ movementId }) => movementId === movement))) return
    setLinks((current) => {
      const next = new Map(current)
      if (movement) next.set(linkRow.line, movement)
      else next.delete(linkRow.line)
      return next
    })
    setLinkMovement(0)
    save.reset()
  }

  async function loadStatement(file: File) {
    if (inFlight.current || reading) return
    setReading(true)
    setFileName(file.name)
    setStatementRows([])
    setRegistered([])
    setExcluded(new Set())
    resetLinks()
    setFileError("")
    save.reset()
    try {
      setStatementRows(parseBankStatement(decodeBankStatement(await file.arrayBuffer())))
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "No fue posible leer el estado de cuenta.")
    } finally {
      setReading(false)
    }
  }

  function submit() {
    if (inFlight.current || !submitEnabled || bank === null || rawStatement === null) return
    const movementIds = selected.map(({ movementId }) => movementId).sort((left, right) => left - right)
    const input = { movementIds, statementDate: cutoff, statementBalance: rawStatement / 100, expectedBankBalance: bank / 100 }
    const signature = JSON.stringify(input)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ payload: { ...input, requestKey }, matches: selected })
  }

  const fileColumns: BankPanelColumn[] = [
    { label: "Sel.", key: "selected", render: ({ line }) => {
      const match = typeof line === "number" ? matchesByLine.get(line) : undefined
      if (match?.status !== "matched") return null
      const { movementId, row } = match
      return <Checkbox aria-label={"Incluir coincidencia de la fila " + row.line} checked={!excluded.has(movementId)}
        disabled={locked} onCheckedChange={(checked) => {
          setExcluded((previous) => {
            const next = new Set(previous)
            if (checked) next.delete(movementId)
            else next.add(movementId)
            return next
          })
          save.reset()
        }} />
    } },
    { label: "Fecha", key: "date" }, { label: "Referencia", key: "reference" },
    { label: "Ingresos", key: "charge", numeric: true }, { label: "Egresos", key: "credit", numeric: true },
    { label: "Resultado", key: "status" },
  ]
  const importedRows = statementRows.map((row) => {
    const match = matchesByLine.get(row.line)
    return {
      ...row, charge: Math.max(row.amountCents, 0) / 100, credit: Math.max(-row.amountCents, 0) / 100,
      status: registeredByLine.has(row.line) ? "Registrado" : match?.status === "matched" && links.has(row.line) ? "Ligado"
        : match ? statusLabels[match.status] : "",
    }
  })
  const bookRows = (data?.items ?? []).map((row) => ({
    ...row,
    bankReference: row.bankNumber || row.checkNumber,
    displayDescription: row.description || row.beneficiary,
    statementLine: typeof row.movementId === "number" ? matchedLineByMovement.get(row.movementId) : undefined,
  }))
  const pendingFile = matches.filter((match) => match.status !== "matched").map(({ row }) => row)
  const exportable = [...registered, ...uniqueMatches].sort((first, second) => first.row.line - second.row.line)
  const error = fileError || (query.isError ? getApiErrorMessage(query.error) : "")
    || (save.isError ? getApiErrorMessage(save.error) : "")

  return (
    <ErpDataDialog defaultWidth={1190} description={`Conciliar un estado de cuenta de ${account.code}`}
      onOpenChange={close} title="Concilia Automático" tone="banking">
      <ErpDataDialogBody className="text-[10px]" onKeyDown={(event) => {
        if (event.key !== "Escape" || event.defaultPrevented) return
        event.preventDefault()
        event.stopPropagation()
        close()
      }}>
        <form className="grid gap-2" noValidate onSubmit={(event) => { void handleSubmit(submit)(event) }}>
          <fieldset className="grid min-w-0 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_12rem]" disabled={save.isPending}>
            <div className="grid min-w-0 gap-0.5">
              <Label htmlFor={fileId}>Estado de cuenta (CSV o TSV)</Label>
              <Input accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" className="h-7 min-w-0 px-1 text-[10px]"
                disabled={reading} id={fileId} type="file" onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  if (file) void loadStatement(file)
                }} />
              <p className="text-muted-foreground">
                Fecha, Referencia, Ingresos y Egresos. Usa AAAA-MM-DD o DD/MM/AAAA y punto decimal.
              </p>
            </div>
            <div className="grid gap-0.5">
              <Label htmlFor={dateId}>Fecha de corte</Label>
              <Input aria-invalid={!cutoffValid} className="h-7" id={dateId} max={today} min={lastStatementDate || undefined}
                type="date" {...register("statementDate", {
                  onChange: () => { setExcluded(new Set()); resetLinks(); save.reset() },
                })} />
            </div>
            <div className="grid gap-0.5">
              <Label htmlFor={balanceId}>Saldo del estado de cuenta</Label>
              <Input className="h-7 text-right tabular-nums" id={balanceId} inputMode="decimal"
                {...register("statementBalance", { onChange: () => save.reset() })} />
            </div>
          </fieldset>

          {(reading || (validDate && query.isFetching)) && <p className="flex items-center gap-1" role="status">
            <Spinner /> {reading ? "Leyendo el archivo" : "Buscando movimientos hasta la fecha de corte"}
          </p>}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {!error && data && !data.available && <Alert><AlertDescription>{data.reason || "Conciliación no disponible."}</AlertDescription></Alert>}
          {!cutoffValid && <p className="text-destructive" role="alert">
            {validDate && lastStatementDate ? "El corte debe ser igual o posterior a " + lastStatementDate + "." : "Captura una fecha de corte válida hasta hoy."}
          </p>}

          <div className="grid min-w-0 gap-2 lg:grid-cols-2">
            <section className="grid min-w-0 gap-1">
              <h3 className="truncate">{fileName || "Movimientos del archivo"}</h3>
              <BankPanelTable columns={fileColumns} height="h-[16rem]" minWidth="min-w-[430px]" rows={importedRows} />
              <div className="flex flex-wrap gap-1">
                <ErpDataMetric label="Coincidencias" value={String(uniqueMatches.length)} />
                <ErpDataMetric label="Sin conciliar" value={String(pendingFile.length)} />
                <ErpDataMetric label="Pendiente del archivo" value={money(sumCents(pendingFile))} />
                {registered.length > 0 && <ErpDataMetric label="Registradas" value={String(registered.length)} />}
              </div>
            </section>
            <section className="grid min-w-0 gap-1">
              <h3>Movimientos de la cuenta</h3>
              <BankPanelTable columns={bankColumns} height="h-[16rem]" minWidth="min-w-[500px]" rows={bookRows} />
              <div className="flex flex-wrap gap-1">
                <ErpDataMetric label="Saldo banco" value={money(bank)} />
                <ErpDataMetric label="Suma seleccionada" value={money(net)} />
                <ErpDataMetric label="Saldo proyectado" value={money(projected)} />
              </div>
            </section>
          </div>
          {linkableRows.length > 0 && <fieldset className="flex flex-wrap items-end gap-1.5" disabled={locked}>
            <legend className="mb-1 font-medium">Ligar una partida</legend>
            <label className="grid gap-0.5">Fila del estado de cuenta
              <select className="h-7 max-w-64 rounded border bg-background px-1" onChange={(event) => {
                setLinkLine(Number(event.target.value))
                setLinkMovement(0)
              }} value={linkRow?.line ?? 0}>
                <option value={0}>Selecciona una fila</option>
                {linkableRows.map(({ row }) => <option key={row.line} value={row.line}>{row.line} · {row.reference}</option>)}
              </select>
            </label>
            <label className="grid gap-0.5">Movimiento del mismo importe
              <select className="h-7 max-w-72 rounded border bg-background px-1" disabled={!linkOptions.length}
                onChange={(event) => setLinkMovement(Number(event.target.value))} value={linkMovement}>
                <option value={0}>{linkRow && !linkOptions.length ? "Sin movimientos compatibles" : "Selecciona un movimiento"}</option>
                {linkOptions.map(({ movementId, date, policyNumber, reference }) => <option key={movementId} value={movementId}>
                  {date} · {policyNumber} · {String(reference ?? "")}
                </option>)}
              </select>
            </label>
            <Button disabled={!linkMovement || !linkOptions.some(({ movementId }) => movementId === linkMovement)}
              onClick={() => updateLink(linkMovement)} size="xs" type="button" variant="outline">Liga</Button>
            {linkRow && links.has(linkRow.line) && <Button onClick={() => updateLink(0)} size="xs" type="button" variant="outline">Quitar liga</Button>}
          </fieldset>}
          {selected.length > 0 && statementBalance.trim() && !balanceAgrees && (
            <p className="text-destructive" role="alert">El saldo del estado de cuenta debe coincidir con el saldo proyectado.</p>
          )}
          <footer className="flex flex-wrap items-center gap-1.5">
            <Button disabled={!exportable.length || locked} onClick={() => downloadMatches(account.code, exportable)}
              size="xs" type="button" variant="outline">Exportar coincidencias</Button>
            <Button disabled={!validDate || locked} onClick={() => { save.reset(); void query.refetch() }}
              size="xs" type="button" variant="outline">Actualizar movimientos</Button>
            <div className="ml-auto flex gap-1">
              <Button disabled={save.isPending} onClick={close} size="sm" type="button" variant="outline">Cancelar</Button>
              <Button disabled={!submitEnabled} size="sm" type="submit">{save.isPending && <Spinner />}Registra</Button>
            </div>
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
