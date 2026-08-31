import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { accountingPolicySearchQueryOptions } from "@/features/accounting/policies/logic"
import type { AccountingPolicy } from "@/features/accounting/policies/model"
import type { AccountingPolicySearchCriteria } from "@/features/accounting/policies/services/accounting-policy-service"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type Filters = { number: string; date: string; applied: string; family: string; cheque: string }
const emptyFilters: Filters = { number: "", date: "", applied: "", family: "", cheque: "" }

function toCriteria(filters: Filters): Omit<AccountingPolicySearchCriteria, "page" | "pageSize"> {
  const criteria: Omit<AccountingPolicySearchCriteria, "page" | "pageSize"> = {}
  if (filters.number) criteria.number = filters.number.trim()
  if (filters.date) criteria.date = filters.date
  if (filters.applied) criteria.applied = filters.applied === "true"
  if (filters.family) criteria.family = filters.family.trim()
  if (filters.cheque) criteria.cheque = filters.cheque.trim()
  return criteria
}

const displayDate = (input: string | null) => input ? input.slice(0, 10).split("-").reverse().join("/") : ""

export function AccountingPolicySearchDialog({ onOpenChange, onSelect }: {
  onOpenChange: (open: boolean) => void
  onSelect: (policy: AccountingPolicy) => void
}) {
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [submitted, setSubmitted] = useState<Omit<AccountingPolicySearchCriteria, "page" | "pageSize"> | null>(null)
  const [selected, setSelected] = useState<AccountingPolicy | null>(null)
  const [page, setPage] = useState(1)
  const result = useQuery({
    ...accountingPolicySearchQueryOptions({ ...(submitted ?? {}), page, pageSize: 100 }),
    enabled: submitted !== null,
  })
  const pages = result.data?.pagination.pages ?? 0
  const search = () => { setPage(1); setSelected(null); setSubmitted(toCriteria(filters)) }

  return (
    <ErpDataDialog className="sm:max-w-[52rem]" description="Búsqueda de pólizas contables" onOpenChange={onOpenChange} title="Búsqueda">
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="grid gap-1" onSubmit={(event) => { event.preventDefault(); search() }}>
          <div className="overflow-x-auto pb-0.5">
            <div className="grid min-w-[42rem] grid-cols-[8rem_8rem_5rem_13rem_8rem] gap-0.5">
              <label className="grid gap-0.5"><span className="text-[8px]">Póliza</span><Input autoFocus className="h-5 px-1 text-[9px]" onChange={(event) => setFilters((current) => ({ ...current, number: event.target.value }))} value={filters.number} /></label>
              <label className="grid gap-0.5"><span className="text-[8px]">Fecha</span><Input className="h-5 px-1 text-[9px]" onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} type="date" value={filters.date} /></label>
              <label className="grid gap-0.5"><span className="text-[8px]">Aplic.</span><select className="h-5 rounded border bg-background px-1 text-[9px]" onChange={(event) => setFilters((current) => ({ ...current, applied: event.target.value }))} value={filters.applied}><option value="" /><option value="true">Sí</option><option value="false">No</option></select></label>
              <label className="grid gap-0.5"><span className="text-[8px]">Familia de Póliza</span><Input className="h-5 px-1 text-[9px]" onChange={(event) => setFilters((current) => ({ ...current, family: event.target.value }))} value={filters.family} /></label>
              <label className="grid gap-0.5"><span className="text-[8px]">Cheque</span><Input className="h-5 px-1 text-[9px]" onChange={(event) => setFilters((current) => ({ ...current, cheque: event.target.value }))} value={filters.cheque} /></label>
            </div>
          </div>
          <div className="flex justify-end gap-1">
            <Button onClick={() => { setFilters(emptyFilters); setSubmitted(null); setSelected(null) }} size="xs" type="button" variant="ghost">Limpiar</Button>
            <Button disabled={result.isFetching} size="xs" type="submit" variant="outline">{result.isFetching && <Spinner />}Buscar</Button>
          </div>
        </form>

        <ErpDataTableViewport axes="xy" className="h-[24rem]">
          <Table className="min-w-[850px] text-[9px]">
            <TableHeader><TableRow>
              {["Póliza", "Fecha", "Aplic.", "Familia de Póliza", "Cheque", "Beneficiario", "Concepto"].map((column) => <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{column}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>{result.data?.data.map((policy) => (
              <TableRow className={selected?.id === policy.id ? "bg-module-accounting/25" : "cursor-default"} key={policy.id} onClick={() => setSelected(policy)} onDoubleClick={() => onSelect(policy)}>
                <TableCell className="px-1 py-0.5">{policy.number}</TableCell>
                <TableCell className="whitespace-nowrap px-1 py-0.5">{displayDate(policy.date)}</TableCell>
                <TableCell className="px-1 py-0.5">{policy.applied ? "X" : ""}</TableCell>
                <TableCell className="px-1 py-0.5">{policy.family}</TableCell>
                <TableCell className="px-1 py-0.5">{policy.cheque}</TableCell>
                <TableCell className="max-w-56 truncate px-1 py-0.5">{policy.beneficiary}</TableCell>
                <TableCell className="max-w-72 truncate px-1 py-0.5">{policy.concept}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </ErpDataTableViewport>

        <footer className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <Button disabled={page <= 1 || result.isFetching} onClick={() => setPage((current) => current - 1)} size="xs" variant="outline">Anterior</Button>
            <span className="min-w-16 text-center">{submitted === null ? "" : `${page} / ${Math.max(pages, 1)}`}</span>
            <Button disabled={page >= pages || result.isFetching} onClick={() => setPage((current) => current + 1)} size="xs" variant="outline">Siguiente</Button>
          </div>
          <div className="flex gap-1">
            <Button disabled={!selected} onClick={() => selected && onSelect(selected)} size="sm">✓ OK</Button>
            <Button onClick={() => onOpenChange(false)} size="sm" variant="outline">× Cancelar</Button>
          </div>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
