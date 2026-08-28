import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { invoiceSearchQueryOptions } from "@/features/sales/invoicing/logic"
import type { Invoice } from "@/features/sales/invoicing/model"
import type { InvoiceSearchCriteria } from "@/features/sales/invoicing/services/invoice-service"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type SearchFilters = {
  issuedAt: string
  invoiceNumber: string
  orderNumber: string
  customerOrderNumber: string
  deliveryNote: string
  folio: string
  customerCode: string
  warehouseSeal: string
  amount: string
}

const emptyFilters: SearchFilters = {
  issuedAt: "",
  invoiceNumber: "",
  orderNumber: "",
  customerOrderNumber: "",
  deliveryNote: "",
  folio: "",
  customerCode: "",
  warehouseSeal: "",
  amount: "",
}

const fields: Array<{ key: keyof SearchFilters; label: string; type?: "date" | "number" }> = [
  { key: "issuedAt", label: "Fecha", type: "date" },
  { key: "invoiceNumber", label: "Documento" },
  { key: "orderNumber", label: "Pedido" },
  { key: "customerOrderNumber", label: "Ped. Cliente" },
  { key: "deliveryNote", label: "Talón" },
  { key: "folio", label: "Folio" },
  { key: "customerCode", label: "Cliente" },
  { key: "warehouseSeal", label: "Sello Alm." },
  { key: "amount", label: "Importe", type: "number" },
]

function toCriteria(filters: SearchFilters): Omit<InvoiceSearchCriteria, "page" | "pageSize"> {
  const criteria: Omit<InvoiceSearchCriteria, "page" | "pageSize"> = {}
  if (filters.issuedAt) criteria.issuedAt = filters.issuedAt
  if (filters.invoiceNumber) criteria.invoiceNumber = filters.invoiceNumber.trim()
  if (filters.orderNumber) criteria.orderNumber = filters.orderNumber.trim()
  if (filters.customerOrderNumber) criteria.customerOrderNumber = filters.customerOrderNumber.trim()
  if (filters.deliveryNote) criteria.deliveryNote = filters.deliveryNote.trim()
  if (filters.folio) criteria.folio = filters.folio.trim()
  if (filters.customerCode) criteria.customerCode = filters.customerCode.trim()
  if (filters.warehouseSeal) criteria.warehouseSeal = filters.warehouseSeal.trim()
  if (filters.amount) criteria.amount = Number(filters.amount)
  return criteria
}

function displayDate(input: string | null) {
  if (!input) return ""
  const [year, month, day] = input.slice(0, 10).split("-")
  return year && month && day ? `${day}/${month}/${year}` : input
}

export function InvoiceSearchDialog({
  onOpenChange,
  onSelect,
}: {
  onOpenChange: (open: boolean) => void
  onSelect: (invoice: Invoice) => void
}) {
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters)
  const [submitted, setSubmitted] = useState<Omit<InvoiceSearchCriteria, "page" | "pageSize"> | null>(null)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [page, setPage] = useState(1)
  const result = useQuery({
    ...invoiceSearchQueryOptions({ ...(submitted ?? {}), page, pageSize: 100 }),
    enabled: submitted !== null,
  })
  const pages = result.data?.pagination.pages ?? 0

  const search = () => {
    setPage(1)
    setSelected(null)
    setSubmitted(toCriteria(filters))
  }

  return (
    <ErpDataDialog
      className="sm:max-w-[64rem]"
      description="Búsqueda de facturas"
      onOpenChange={onOpenChange}
      title="Búsqueda"
      tone="sales"
    >
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="grid gap-1" onSubmit={(event) => { event.preventDefault(); search() }}>
          <div className="overflow-x-auto pb-0.5">
            <div className="grid min-w-[58rem] grid-cols-[6.2rem_6rem_5.5rem_6.5rem_5rem_5rem_5rem_5.5rem_5rem] gap-0.5">
              {fields.map((field, index) => (
                <label className="grid min-w-0 gap-0.5" key={field.key}>
                  <span className="truncate text-[8px]">{field.label}</span>
                  <Input
                    autoFocus={index === 1}
                    className="h-5 min-w-0 px-1 text-[9px]"
                    onChange={(event) => setFilters((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))}
                    step={field.type === "number" ? "0.01" : undefined}
                    type={field.type ?? "text"}
                    value={filters[field.key]}
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-1">
            <Button
              onClick={() => { setFilters(emptyFilters); setSubmitted(null); setSelected(null) }}
              size="xs"
              type="button"
              variant="ghost"
            >
              Limpiar
            </Button>
            <Button disabled={result.isFetching} size="xs" type="submit" variant="outline">
              {result.isFetching && <Spinner />}Buscar
            </Button>
          </div>
        </form>

        <ErpDataTableViewport className="h-[24rem]" axes="xy">
          <Table className="min-w-[980px] text-[9px]" containerClassName="overflow-visible">
            <TableHeader className="sticky top-0 z-[1] bg-muted"><TableRow>
              {['Fecha','Documento','Pedido','Ped. Cliente','Talón','Folio','Cliente','Nombre','Sello Alm.','Importe'].map((column) => (
                <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{column}</TableHead>
              ))}
            </TableRow></TableHeader>
            <TableBody>
              {result.data?.data.map((invoice) => (
                <TableRow
                  className={selected?.id === invoice.id ? "bg-module-sales/20" : "cursor-default"}
                  key={invoice.id}
                  onClick={() => setSelected(invoice)}
                  onDoubleClick={() => onSelect(invoice)}
                >
                  <TableCell className="px-1 py-0.5">{displayDate(invoice.dates.issuedAt)}</TableCell>
                  <TableCell className="px-1 py-0.5 font-mono">{invoice.number}</TableCell>
                  <TableCell className="px-1 py-0.5">{invoice.orderNumber}</TableCell>
                  <TableCell className="px-1 py-0.5">{invoice.customerOrderNumber}</TableCell>
                  <TableCell className="px-1 py-0.5">{invoice.deliveryNote}</TableCell>
                  <TableCell className="px-1 py-0.5">{invoice.folio}</TableCell>
                  <TableCell className="px-1 py-0.5">{invoice.customer.code}</TableCell>
                  <TableCell className="max-w-56 truncate px-1 py-0.5">{invoice.customer.name}</TableCell>
                  <TableCell className="px-1 py-0.5">{invoice.warehouseSeal}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{invoice.totals.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {submitted !== null && !result.isFetching && result.data?.data.length === 0 && (
            <div className="grid h-20 place-items-center text-muted-foreground">No se encontraron facturas.</div>
          )}
        </ErpDataTableViewport>

        <footer className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <Button disabled={page <= 1 || result.isFetching} onClick={() => { setSelected(null); setPage((current) => current - 1) }} size="xs" variant="outline">Anterior</Button>
            <span className="min-w-16 text-center">{submitted === null ? "" : `${page} / ${Math.max(pages, 1)}`}</span>
            <Button disabled={page >= pages || result.isFetching} onClick={() => { setSelected(null); setPage((current) => current + 1) }} size="xs" variant="outline">Siguiente</Button>
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
