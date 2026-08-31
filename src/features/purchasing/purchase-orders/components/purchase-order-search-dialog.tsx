import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { purchaseOrderSearchQueryOptions } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import type { PurchaseOrderSearchCriteria } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type Filters = {
  orderNumber: string
  supplierOrderNumber: string
  supplierCode: string
  orderedAt: string
  dueAt: string
  agent: string
  documentType: string
}

const emptyFilters: Filters = {
  orderNumber: "", supplierOrderNumber: "", supplierCode: "",
  orderedAt: "", dueAt: "", agent: "", documentType: "",
}

const fields: Array<{ key: keyof Filters; label: string; type?: "date" | "number" }> = [
  { key: "orderNumber", label: "Pedido" },
  { key: "supplierOrderNumber", label: "Ped. Proveedor" },
  { key: "supplierCode", label: "Proveedor" },
  { key: "orderedAt", label: "Fecha", type: "date" },
  { key: "dueAt", label: "Vencimiento", type: "date" },
  { key: "agent", label: "Agente" },
  { key: "documentType", label: "Tipo", type: "number" },
]

function toCriteria(filters: Filters): Omit<PurchaseOrderSearchCriteria, "page" | "pageSize"> {
  const criteria: Omit<PurchaseOrderSearchCriteria, "page" | "pageSize"> = {}
  if (filters.orderNumber) criteria.orderNumber = filters.orderNumber.trim()
  if (filters.supplierOrderNumber) criteria.supplierOrderNumber = filters.supplierOrderNumber.trim()
  if (filters.supplierCode) criteria.supplierCode = filters.supplierCode.trim()
  if (filters.orderedAt) criteria.orderedAt = filters.orderedAt
  if (filters.dueAt) criteria.dueAt = filters.dueAt
  if (filters.agent) criteria.agent = filters.agent.trim()
  if (filters.documentType) criteria.documentType = Number(filters.documentType)
  return criteria
}

const displayDate = (input: string | null) => input ? input.slice(0, 10).split("-").reverse().join("/") : ""

export function PurchaseOrderSearchDialog({ onOpenChange, onSelect }: {
  onOpenChange: (open: boolean) => void
  onSelect: (purchaseOrder: PurchaseOrder) => void
}) {
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [submitted, setSubmitted] = useState<Omit<PurchaseOrderSearchCriteria, "page" | "pageSize"> | null>(null)
  const [selected, setSelected] = useState<PurchaseOrder | null>(null)
  const [page, setPage] = useState(1)
  const result = useQuery({
    ...purchaseOrderSearchQueryOptions({ ...(submitted ?? {}), page, pageSize: 100 }),
    enabled: submitted !== null,
  })
  const pages = result.data?.pagination.pages ?? 0
  const search = () => { setPage(1); setSelected(null); setSubmitted(toCriteria(filters)) }

  return (
    <ErpDataDialog className="sm:max-w-[52rem]" description="Búsqueda de órdenes de compra" onOpenChange={onOpenChange} title="Búsqueda">
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="grid gap-1" onSubmit={(event) => { event.preventDefault(); search() }}>
          <div className="overflow-x-auto pb-0.5">
            <div className="grid min-w-[45rem] grid-cols-[5rem_7rem_5rem_7rem_7rem_4rem_3rem] gap-0.5">
              {fields.map((field, index) => (
                <label className="grid min-w-0 gap-0.5" key={field.key}>
                  <span className="truncate text-[8px]">{field.label}</span>
                  <Input autoFocus={index === 0} className="h-5 min-w-0 px-1 text-[9px]" onChange={(event) => setFilters((current) => ({ ...current, [field.key]: event.target.value }))} type={field.type ?? "text"} value={filters[field.key]} />
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-1">
            <Button onClick={() => { setFilters(emptyFilters); setSubmitted(null); setSelected(null) }} size="xs" type="button" variant="ghost">Limpiar</Button>
            <Button disabled={result.isFetching} size="xs" type="submit" variant="outline">{result.isFetching && <Spinner />}Buscar</Button>
          </div>
        </form>

        <ErpDataTableViewport axes="xy" className="h-[24rem]">
          <Table className="min-w-[900px] text-[9px]">
            <TableHeader><TableRow>
              {["Pedido", "Ped. Proveedor", "Proveedor", "Nombre", "Fecha", "Vencimiento", "Tipo", "Status"].map((column) => <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{column}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {result.data?.data.map((purchaseOrder) => (
                <TableRow className={selected?.id === purchaseOrder.id ? "bg-module-reception/25" : "cursor-default"} key={purchaseOrder.id} onClick={() => setSelected(purchaseOrder)} onDoubleClick={() => onSelect(purchaseOrder)}>
                  <TableCell className="px-1 py-0.5">{purchaseOrder.number}</TableCell>
                  <TableCell className="px-1 py-0.5">{purchaseOrder.supplierOrderNumber}</TableCell>
                  <TableCell className="px-1 py-0.5">{purchaseOrder.supplier.code}</TableCell>
                  <TableCell className="max-w-64 truncate px-1 py-0.5">{purchaseOrder.supplier.name}</TableCell>
                  <TableCell className="whitespace-nowrap px-1 py-0.5">{displayDate(purchaseOrder.dates.orderedAt)}</TableCell>
                  <TableCell className="whitespace-nowrap px-1 py-0.5">{displayDate(purchaseOrder.dates.dueAt)}</TableCell>
                  <TableCell className="px-1 py-0.5">{purchaseOrder.documentKind === "quote" ? "COTIZ" : "PEDIDO"}</TableCell>
                  <TableCell className="px-1 py-0.5">{purchaseOrder.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
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
