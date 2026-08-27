import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { orderSearchQueryOptions } from "@/features/sales/orders/logic"
import type { Order } from "@/features/sales/orders/model"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

export function OrderSearchDialog({ onOpenChange, onSelect }: { onOpenChange: (open: boolean) => void; onSelect: (order: Order) => void }) {
  const [query, setQuery] = useState("")
  const [submitted, setSubmitted] = useState("")
  const [selected, setSelected] = useState<Order | null>(null)
  const result = useQuery({ ...orderSearchQueryOptions({ ...(submitted ? { q: submitted } : {}), page: 1, pageSize: 100 }), enabled: submitted.length > 0 })
  return (
    <ErpDataDialog className="sm:max-w-[48rem]" description="Búsqueda de pedidos" onOpenChange={onOpenChange} title="Búsqueda">
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="grid grid-cols-[1fr_auto] gap-1" onSubmit={(event) => { event.preventDefault(); setSubmitted(query.trim()) }}>
          <label className="grid gap-0.5"><span>Pedido / pedido cliente / cliente</span><Input autoFocus className="h-5 text-[9px]" onChange={(event) => setQuery(event.target.value)} value={query} /></label>
          <Button className="self-end" size="sm" type="submit" variant="outline">Buscar</Button>
        </form>
        <ErpDataTableViewport className="h-[24rem]" axes="xy">
          <Table className="min-w-[900px] text-[9px]"><TableHeader><TableRow>
            {['Pedido','Ped. Cliente','Cliente','Nombre','Fecha','Vencimiento','Status','Sucursal','Almacén','% surt'].map((column) => <TableHead className="h-5 px-1 text-[9px]" key={column}>{column}</TableHead>)}
          </TableRow></TableHeader><TableBody>{result.data?.data.map((order) => (
            <TableRow className={selected?.id === order.id ? "bg-module-sales/20" : ""} key={order.id} onClick={() => setSelected(order)} onDoubleClick={() => onSelect(order)}>
              <TableCell className="px-1 py-0.5">{order.number}</TableCell><TableCell className="px-1 py-0.5">{order.customerOrderNumber}</TableCell>
              <TableCell className="px-1 py-0.5">{order.customer.code}</TableCell><TableCell className="px-1 py-0.5">{order.customer.name}</TableCell>
              <TableCell className="px-1 py-0.5">{order.dates.orderedAt}</TableCell><TableCell className="px-1 py-0.5">{order.dates.dueAt}</TableCell>
              <TableCell className="px-1 py-0.5">{order.status}</TableCell><TableCell className="px-1 py-0.5">{order.branch}</TableCell>
              <TableCell className="px-1 py-0.5">{order.warehouse}</TableCell><TableCell className="px-1 py-0.5">{order.minimumFulfillmentPercentage}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </ErpDataTableViewport>
        <footer className="flex justify-end gap-1"><Button onClick={() => selected && onSelect(selected)} size="sm" variant="outline">✓ OK</Button><Button onClick={() => onOpenChange(false)} size="sm" variant="outline">× Cancelar</Button></footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
