import { useQuery, type QueryKey } from "@tanstack/react-query"
import { useId, useState, type ComponentProps } from "react"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableRow } from "@/shared/ui/table"

type Supplier = { id: number; code: string; name: string }
type SupplierFilters = { code: string; name: string }

export function PurchaseSupplierSearchDialog({ initial, description, onSelect, onClose, queryKey, search, codeLength = 20, tone }: {
  initial: SupplierFilters
  description: string
  onSelect: (supplier: Supplier) => void
  onClose: () => void
  queryKey: (filters: SupplierFilters) => QueryKey
  search: (filters: SupplierFilters, signal: AbortSignal) => Promise<Supplier[]>
  codeLength?: number
  tone?: ComponentProps<typeof ErpDataDialog>["tone"]
}) {
  const codeId = useId()
  const nameId = useId()
  const [filters, setFilters] = useState(initial)
  const [submitted, setSubmitted] = useState(initial)
  const [selected, setSelected] = useState<Supplier | null>(null)
  const query = useQuery({
    queryKey: queryKey(submitted),
    queryFn: ({ signal }) => search(submitted, signal),
    enabled: Boolean(submitted.code || submitted.name),
  })

  return (
    <ErpDataDialog defaultWidth={520} title="Buscar proveedor" description={description} tone={tone}
      onOpenChange={(open) => { if (!open) onClose() }}>
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="grid grid-cols-[minmax(4rem,1fr)_minmax(6rem,3fr)_auto] items-end gap-1" onSubmit={(event) => {
          event.preventDefault()
          setSelected(null)
          setSubmitted({ code: filters.code.trim().toUpperCase(), name: filters.name.trim() })
        }}>
          <div className="grid gap-0.5">
            <Label htmlFor={codeId}>Código</Label>
            <Input autoFocus id={codeId} className="uppercase" maxLength={codeLength} value={filters.code}
              onChange={(event) => setFilters({ ...filters, code: event.target.value })} />
          </div>
          <div className="grid gap-0.5">
            <Label htmlFor={nameId}>Nombre</Label>
            <Input id={nameId} maxLength={60} value={filters.name}
              onChange={(event) => setFilters({ ...filters, name: event.target.value })} />
          </div>
          <Button disabled={query.isFetching || (!filters.code.trim() && !filters.name.trim())} size="sm" type="submit">Buscar</Button>
        </form>
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        <ErpDataTableViewport className="h-44">
          <Table className="min-w-80">
            <TableBody>
              {query.data?.map((supplier) => (
                <TableRow key={supplier.id} data-state={selected?.id === supplier.id ? "selected" : undefined}>
                  <TableCell className="p-0">
                    <Button aria-pressed={selected?.id === supplier.id} className="flex w-full justify-start text-left"
                      size="xs" variant="ghost" onClick={() => setSelected(supplier)} onDoubleClick={() => onSelect(supplier)}>
                      <span className="w-20 shrink-0 font-mono">{supplier.code}</span>{supplier.name}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {query.isFetching && <TableRow><TableCell><Spinner aria-label="Buscando proveedores" /></TableCell></TableRow>}
              {query.data?.length === 0 && <TableRow><TableCell>Sin proveedores para la búsqueda.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </ErpDataTableViewport>
        <div className="flex justify-end gap-1">
          <Button disabled={!selected || query.isFetching} onClick={() => { if (selected) onSelect(selected) }} size="sm">OK</Button>
          <Button onClick={onClose} size="sm" variant="outline">Cancelar</Button>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
