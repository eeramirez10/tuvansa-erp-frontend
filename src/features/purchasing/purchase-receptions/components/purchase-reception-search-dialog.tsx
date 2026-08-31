import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { purchaseReceptionSearchQueryOptions } from "@/features/purchasing/purchase-receptions/logic"
import type { PurchaseReception } from "@/features/purchasing/purchase-receptions/model"
import type { PurchaseReceptionSearchCriteria } from "@/features/purchasing/purchase-receptions/services/purchase-reception-service"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type Filters = {
  documentNumber: string
  receivedAt: string
  orderNumber: string
  supplierReference: string
  deliveryNote: string
  folio: string
  supplierCode: string
  warehouse: string
}

const emptyFilters: Filters = {
  documentNumber: "", receivedAt: "", orderNumber: "", supplierReference: "",
  deliveryNote: "", folio: "", supplierCode: "", warehouse: "",
}

const fields: Array<{ key: keyof Filters; label: string; type?: "date" }> = [
  { key: "documentNumber", label: "Documento" },
  { key: "receivedAt", label: "Fecha", type: "date" },
  { key: "orderNumber", label: "Pedido" },
  { key: "supplierReference", label: "Ped. Proveedor" },
  { key: "deliveryNote", label: "Talón" },
  { key: "folio", label: "Folio" },
  { key: "supplierCode", label: "Proveedor" },
  { key: "warehouse", label: "Alm" },
]

function toCriteria(filters: Filters): Omit<PurchaseReceptionSearchCriteria, "page" | "pageSize"> {
  return Object.fromEntries(Object.entries(filters).filter(([, fieldValue]) => fieldValue.trim() !== ""))
}

const displayDate = (input: string | null) => input ? input.slice(0, 10).split("-").reverse().join("/") : ""

export function PurchaseReceptionSearchDialog({ onOpenChange, onSelect }: {
  onOpenChange: (open: boolean) => void
  onSelect: (reception: PurchaseReception) => void
}) {
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [submitted, setSubmitted] = useState<Omit<PurchaseReceptionSearchCriteria, "page" | "pageSize"> | null>(null)
  const [selected, setSelected] = useState<PurchaseReception | null>(null)
  const [page, setPage] = useState(1)
  const result = useQuery({
    ...purchaseReceptionSearchQueryOptions({ ...(submitted ?? {}), page, pageSize: 100 }),
    enabled: submitted !== null,
  })
  const pages = result.data?.pagination.pages ?? 0
  const search = () => { setPage(1); setSelected(null); setSubmitted(toCriteria(filters)) }

  return (
    <ErpDataDialog className="sm:max-w-[56rem]" description="Búsqueda de recepciones de orden de compra" onOpenChange={onOpenChange} title="Búsqueda">
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="grid gap-1" onSubmit={(event) => { event.preventDefault(); search() }}>
          <div className="overflow-x-auto pb-0.5">
            <div className="grid min-w-[49rem] grid-cols-[6rem_7rem_6rem_8rem_6rem_6rem_6rem_4rem] gap-0.5">
              {fields.map((field, index) => (
                <label className="grid min-w-0 gap-0.5" key={field.key}>
                  <span className="truncate text-[8px]">{field.label}</span>
                  <Input
                    autoFocus={index === 0}
                    className="h-5 min-w-0 px-1 text-[9px]"
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

        <ErpDataTableViewport axes="xy" className="h-[24rem]">
          <Table className="min-w-[980px] text-[9px]">
            <TableHeader><TableRow>
              {["Documento", "Fecha", "Pedido", "Ped. Proveedor", "Proveedor", "Nombre", "Alm", "Total", "Saldo"].map((column) => (
                <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{column}</TableHead>
              ))}
            </TableRow></TableHeader>
            <TableBody>
              {result.data?.data.map((reception) => (
                <TableRow
                  className={selected?.id === reception.id ? "bg-module-reception/25" : "cursor-default"}
                  key={reception.id}
                  onClick={() => setSelected(reception)}
                  onDoubleClick={() => onSelect(reception)}
                >
                  <TableCell className="px-1 py-0.5">{reception.number}</TableCell>
                  <TableCell className="whitespace-nowrap px-1 py-0.5">{displayDate(reception.dates.receivedAt)}</TableCell>
                  <TableCell className="px-1 py-0.5">{reception.orderNumber}</TableCell>
                  <TableCell className="px-1 py-0.5">{reception.supplierReference}</TableCell>
                  <TableCell className="px-1 py-0.5">{reception.supplier.code}</TableCell>
                  <TableCell className="max-w-64 truncate px-1 py-0.5">{reception.supplier.name}</TableCell>
                  <TableCell className="px-1 py-0.5">{reception.warehouse}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{reception.totals.total.toFixed(2)}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{reception.totals.balance.toFixed(2)}</TableCell>
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
