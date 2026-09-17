import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { captureCustomerMatchesQuery } from "@/features/sales/orders/capture-logic"
import type {
  CaptureCustomerMatch,
  CaptureCustomerSearchCriteria,
} from "@/features/sales/orders/capture-model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils/cn"

type OrderCustomerMatchesDialogProps = {
  initialCode: string
  onOpenChange: (open: boolean) => void
  onSelect: (customer: CaptureCustomerMatch) => void
}

type SearchFields = {
  code: string
  name: string
  taxId: string
}

const columns = [
  "Código",
  "Nombre",
  "Sucursal",
  "RFC",
  "EAN",
  "Tel.",
  "Cel.",
  "E-mail",
]

const matchKey = (match: CaptureCustomerMatch) => `${match.id}:${match.branch}`
const toCriteria = (fields: SearchFields): CaptureCustomerSearchCriteria => ({
  ...(fields.code.trim() ? { code: fields.code.trim() } : {}),
  ...(fields.name.trim() ? { name: fields.name.trim() } : {}),
  ...(fields.taxId.trim() ? { taxId: fields.taxId.trim().toUpperCase() } : {}),
})

export function OrderCustomerMatchesDialog({
  initialCode,
  onOpenChange,
  onSelect,
}: OrderCustomerMatchesDialogProps) {
  const initialFields = { code: initialCode, name: "", taxId: "" }
  const [fields, setFields] = useState<SearchFields>(initialFields)
  const [criteria, setCriteria] = useState<CaptureCustomerSearchCriteria>(() =>
    toCriteria(initialFields),
  )
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const result = useQuery(captureCustomerMatchesQuery(criteria))
  const matches = result.data ?? []
  const selected =
    matches.find((match) => matchKey(match) === selectedKey) ?? matches[0] ?? null
  const hasFilter = Boolean(fields.code.trim() || fields.name.trim() || fields.taxId.trim())

  const search = () => {
    if (!hasFilter) return
    setSelectedKey(null)
    setCriteria(toCriteria(fields))
  }
  const accept = (match = selected) => {
    if (match) onSelect(match)
  }

  return (
    <ErpDataDialog
      defaultHeight={470}
      defaultWidth={1000}
      description="Buscar y seleccionar un cliente para el pedido"
      fillHeight
      onOpenChange={onOpenChange}
      title="Encuentra cliente"
      tone="sales"
    >
      <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-1">
        <form
          className="grid grid-cols-[7rem_minmax(14rem,1fr)_10rem_auto] items-end gap-1"
          onSubmit={event => { event.preventDefault(); search() }}
        >
          <label className="grid gap-0.5">
            <span>Código</span>
            <Input autoFocus className="h-5 rounded-none px-1 text-[9px]" maxLength={20} onChange={event => setFields(current => ({ ...current, code: event.target.value }))} value={fields.code} />
          </label>
          <label className="grid gap-0.5">
            <span>Nombre</span>
            <Input className="h-5 rounded-none px-1 text-[9px]" maxLength={100} onChange={event => setFields(current => ({ ...current, name: event.target.value }))} value={fields.name} />
          </label>
          <label className="grid gap-0.5">
            <span>RFC</span>
            <Input className="h-5 rounded-none px-1 text-[9px] uppercase" maxLength={20} onChange={event => setFields(current => ({ ...current, taxId: event.target.value.toUpperCase() }))} value={fields.taxId} />
          </label>
          <Button disabled={!hasFilter || result.isFetching} size="sm" type="submit" variant="outline">
            {result.isFetching && <Spinner />}Buscar
          </Button>
        </form>

        {result.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(result.error)}</AlertDescription></Alert>}

        <ErpDataTableViewport axes="xy" className="min-h-0 flex-1">
          <table className="min-w-[960px] w-full border-collapse text-[9px]/none">
            <colgroup><col className="w-[6rem]" /><col className="w-[19rem]" /><col className="w-[8rem]" /><col className="w-[9rem]" /><col className="w-[8rem]" /><col className="w-[8rem]" /><col className="w-[8rem]" /><col className="w-[16rem]" /></colgroup>
            <thead className="sticky top-0 z-[1] bg-muted">
              <tr className="h-5 border-b border-input">
                {columns.map(column => <th className="whitespace-nowrap px-1 text-left font-normal" key={column}>{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {matches.map(match => (
                <tr className={cn("h-5 cursor-default border-b border-dotted border-input/60", selected && matchKey(selected) === matchKey(match) && "bg-module-sales text-module-sales-foreground")} key={matchKey(match)} onClick={() => setSelectedKey(matchKey(match))} onDoubleClick={() => accept(match)}>
                  <td className="truncate px-1 font-mono">{match.code}</td><td className="truncate px-1">{match.name}</td><td className="truncate px-1">{match.branch}</td><td className="truncate px-1">{match.taxId}</td><td className="truncate px-1">{match.ean}</td><td className="truncate px-1">{match.phone}</td><td className="truncate px-1">{match.mobile}</td><td className="truncate px-1">{match.email}</td>
                </tr>
              ))}
              {!result.isFetching && matches.length === 0 && <tr><td className="h-40 text-center text-muted-foreground" colSpan={8}>Sin coincidencias</td></tr>}
            </tbody>
          </table>
        </ErpDataTableViewport>

        <footer className="flex items-center justify-between gap-1">
          <span>{matches.length} coincidencia{matches.length === 1 ? "" : "s"}</span>
          <div className="flex gap-1">
            <Button disabled={!selected} onClick={() => accept()} size="sm">✓ OK</Button>
            <Button onClick={() => onOpenChange(false)} size="sm" variant="outline">× Cancelar</Button>
          </div>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
