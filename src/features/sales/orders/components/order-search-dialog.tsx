import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { orderSearchQueryOptions } from "@/features/sales/orders/logic"
import type { Order } from "@/features/sales/orders/model"
import type { OrderSearchCriteria } from "@/features/sales/orders/services/order-service"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type SearchFilters = {
  orderNumber: string
  customerOrderNumber: string
  customerCode: string
  orderedAt: string
  dueAt: string
  agent: string
  status: string
  branch: string
  warehouse: string
  authorization: string
  minimumFulfillmentPercentage: string
}

const emptyFilters: SearchFilters = {
  orderNumber: "", customerOrderNumber: "", customerCode: "",
  orderedAt: "", dueAt: "", agent: "", status: "", branch: "",
  warehouse: "", authorization: "", minimumFulfillmentPercentage: "",
}

const fields: Array<{ key: keyof SearchFilters; label: string; type?: "date" | "number" }> = [
  { key: "orderNumber", label: "Pedido" },
  { key: "customerOrderNumber", label: "Ped. Cliente" },
  { key: "customerCode", label: "Cliente" },
  { key: "orderedAt", label: "Fecha", type: "date" },
  { key: "dueAt", label: "Vencimiento", type: "date" },
  { key: "agent", label: "Agente" },
  { key: "status", label: "Status" },
  { key: "branch", label: "Sucursal", type: "number" },
  { key: "warehouse", label: "Almacén" },
  { key: "authorization", label: "Autoriz." },
  { key: "minimumFulfillmentPercentage", label: "% surt", type: "number" },
]

function toCriteria(filters: SearchFilters): Omit<OrderSearchCriteria, "page" | "pageSize"> {
  const criteria: Omit<OrderSearchCriteria, "page" | "pageSize"> = {}
  if (filters.orderNumber) criteria.orderNumber = filters.orderNumber.trim()
  if (filters.customerOrderNumber) criteria.customerOrderNumber = filters.customerOrderNumber.trim()
  if (filters.customerCode) criteria.customerCode = filters.customerCode.trim()
  if (filters.orderedAt) criteria.orderedAt = filters.orderedAt
  if (filters.dueAt) criteria.dueAt = filters.dueAt
  if (filters.agent) criteria.agent = filters.agent.trim()
  if (filters.status) criteria.status = filters.status.trim()
  if (filters.branch) criteria.branch = Number(filters.branch)
  if (filters.warehouse) criteria.warehouse = filters.warehouse.trim()
  if (filters.authorization) criteria.authorization = filters.authorization.trim()
  if (filters.minimumFulfillmentPercentage) criteria.minimumFulfillmentPercentage = Number(filters.minimumFulfillmentPercentage)
  return criteria
}

const displayDate = (value: string | null) => {
  if (!value) return ""
  const [year, month, day] = value.slice(0, 10).split("-")
  return year && month && day ? `${day}/${month}/${year}` : value
}

export function OrderSearchDialog({ onOpenChange, onSelect }: {
  onOpenChange: (open: boolean) => void
  onSelect: (order: Order) => void
}) {
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters)
  const [submitted, setSubmitted] = useState<Omit<OrderSearchCriteria, "page" | "pageSize"> | null>(null)
  const [selected, setSelected] = useState<Order | null>(null)
  const [page, setPage] = useState(1)
  const result = useQuery({
    ...orderSearchQueryOptions({ ...(submitted ?? {}), page, pageSize: 100 }),
    enabled: submitted !== null,
  })

  const search = (next = filters) => {
    setPage(1)
    setSelected(null)
    setSubmitted(toCriteria(next))
  }
  const searchAuthorized = () => {
    const next = { ...filters, authorization: "O.K." }
    setFilters(next)
    search(next)
  }
  const pages = result.data?.pagination.pages ?? 0

  return (
    <ErpDataDialog className="sm:max-w-[48rem]" description="Búsqueda de pedidos" onOpenChange={onOpenChange} title="Búsqueda">
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="grid gap-1" onSubmit={(event) => { event.preventDefault(); search() }}>
          <div className="overflow-x-auto pb-0.5">
            <div className="grid min-w-[45rem] grid-cols-[3.4rem_5rem_3.4rem_4.5rem_4.5rem_3.2rem_3rem_3.2rem_3.3rem_3.2rem_3rem] gap-0.5">
              {fields.map((field, index) => (
                <label className="grid min-w-0 gap-0.5" key={field.key}>
                  <span className="truncate text-[8px]">{field.label}</span>
                  <Input
                    autoFocus={index === 0}
                    className="h-5 min-w-0 px-1 text-[9px]"
                    min={field.type === "number" ? 0 : undefined}
                    onChange={(event) => setFilters((current) => ({ ...current, [field.key]: event.target.value }))}
                    type={field.type ?? "text"}
                    value={filters[field.key]}
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-1">
            <Button onClick={() => { setFilters(emptyFilters); setSubmitted(null); setSelected(null) }} size="xs" type="button" variant="ghost">Limpiar</Button>
            <Button disabled={result.isFetching} size="xs" type="submit" variant="outline">{result.isFetching && <Spinner />}Buscar</Button>
          </div>
        </form>

        <ErpDataTableViewport className="h-[24rem]" axes="xy">
          <Table className="min-w-[760px] text-[9px]">
            <TableHeader><TableRow>
              {['Pedido','Ped. Cliente','Cliente','Nombre','Fecha','Vencimiento','Status','Sucursal','Almacén','Autoriz.','% surt'].map((column) => <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{column}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {result.data?.data.map((order) => (
                <TableRow
                  className={selected?.id === order.id ? "bg-module-sales/20" : "cursor-default"}
                  key={order.id}
                  onClick={() => setSelected(order)}
                  onDoubleClick={() => onSelect(order)}
                >
                  <TableCell className="px-1 py-0.5">{order.number}</TableCell>
                  <TableCell className="px-1 py-0.5">{order.customerOrderNumber}</TableCell>
                  <TableCell className="px-1 py-0.5">{order.customer.code}</TableCell>
                  <TableCell className="max-w-52 truncate px-1 py-0.5">{order.customer.name}</TableCell>
                  <TableCell className="whitespace-nowrap px-1 py-0.5">{displayDate(order.dates.orderedAt)}</TableCell>
                  <TableCell className="whitespace-nowrap px-1 py-0.5">{displayDate(order.dates.dueAt)}</TableCell>
                  <TableCell className="px-1 py-0.5">{order.status}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{order.branch}</TableCell>
                  <TableCell className="px-1 py-0.5">{order.warehouse}</TableCell>
                  <TableCell className="px-1 py-0.5">{order.authorization}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{order.minimumFulfillmentPercentage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {submitted !== null && !result.isFetching && result.data?.data.length === 0 && <div className="grid h-20 place-items-center text-muted-foreground">No se encontraron pedidos.</div>}
        </ErpDataTableViewport>

        <footer className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <Button disabled={page <= 1 || result.isFetching} onClick={() => { setSelected(null); setPage((current) => current - 1) }} size="xs" variant="outline">Anterior</Button>
            <span className="min-w-16 text-center">{submitted === null ? "" : `${page} / ${Math.max(pages, 1)}`}</span>
            <Button disabled={page >= pages || result.isFetching} onClick={() => { setSelected(null); setPage((current) => current + 1) }} size="xs" variant="outline">Siguiente</Button>
          </div>
          <div className="flex gap-1">
            <Button onClick={searchAuthorized} size="sm" variant="outline">Pedidos O.K.</Button>
            <Button disabled={!selected} onClick={() => selected && onSelect(selected)} size="sm">✓ OK</Button>
            <Button onClick={() => onOpenChange(false)} size="sm" variant="outline">× Cancelar</Button>
          </div>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
