import { useDeferredValue, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { clientSearchQueryOptions } from "@/features/accounts-receivable/clients/logic"
import type { Client } from "@/features/accounts-receivable/clients/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type Customer = Pick<Client, "id" | "code" | "name">

function CustomerSearch({ onSelect, onClose }: { onSelect: (customer: Customer) => void; onClose: () => void }) {
  const [search, setSearch] = useState(""), [page, setPage] = useState(1)
  const term = useDeferredValue(search.trim())
  const query = useQuery(clientSearchQueryOptions({ ...(term ? { q: term } : {}), status: "all", page, pageSize: 25 }))
  const loading = query.isFetching || term !== search.trim()
  const customers = loading ? [] : query.data?.data ?? []
  const total = query.data?.pagination.total ?? 0
  return <DesktopWindowIdentity id="sales:reports:commission-customer-search">
    <ErpDataDialog title="Seleccionar cliente para comisiones" description="Busca por código o nombre y selecciona un cliente concreto." tone="sales" defaultWidth={700} defaultHeight={490} fillHeight onOpenChange={open => { if (!open) onClose() }}>
      <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="grid shrink-0 gap-1"><Label htmlFor="commission-customer-search">Código o nombre del cliente</Label>
          <Input id="commission-customer-search" autoFocus autoComplete="off" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} />
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-sm border" role="region" aria-label="Resultados de clientes">
          {loading && <p role="status" className="p-3 text-xs">Buscando clientes…</p>}
          {!loading && query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription><Button type="button" onClick={() => void query.refetch()}>Reintentar búsqueda</Button></Alert>}
          {!loading && !query.isError && <Table aria-label="Clientes para filtrar comisiones">
            <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nombre</TableHead><TableHead>Selección</TableHead></TableRow></TableHeader>
            <TableBody>{customers.map(customer => <TableRow key={customer.id} onDoubleClick={() => onSelect(customer)}>
              <TableCell>{customer.code}</TableCell><TableCell>{customer.name}</TableCell>
              <TableCell><Button type="button" variant="outline" size="sm" aria-label={`Seleccionar cliente ${customer.code}`} onClick={() => onSelect(customer)}>Seleccionar</Button></TableCell>
            </TableRow>)}{customers.length === 0 && <TableRow><TableCell colSpan={3}>No se encontraron clientes.</TableCell></TableRow>}</TableBody>
          </Table>}
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-2 text-[10px]">
          <span>{total} clientes · Página {page} de {Math.max(1, Math.ceil(total / 25))}</span>
          <div className="flex gap-1"><Button type="button" variant="outline" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Clientes anteriores</Button>
            <Button type="button" variant="outline" disabled={loading || page * 25 >= total} onClick={() => setPage(page + 1)}>Clientes siguientes</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button></div>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  </DesktopWindowIdentity>
}

export function CollectionCustomerFilter({ value, onChange, disabled }: { value: number | undefined; onChange: (value: number | undefined) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false), [selected, setSelected] = useState<Customer | null>(null)
  const label = value === undefined ? "Todos los clientes" : selected?.id === value ? `${selected.code} · ${selected.name}` : `Cliente ${value}`
  return <>
    <div className="grid min-w-0 gap-1"><Label htmlFor="collection-customer">Cliente</Label>
      <div className="flex min-w-0 gap-1"><Button type="button" id="collection-customer" variant="outline" className="min-w-0 flex-1 justify-start" aria-label="Seleccionar cliente" title={label} disabled={disabled} onClick={() => setOpen(true)}><span className="truncate">{label}</span></Button>
        <Button type="button" variant="outline" disabled={disabled || value === undefined} onClick={() => { setSelected(null); onChange(undefined) }}>Limpiar cliente</Button></div>
    </div>
    {open && <div onMouseDown={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
      <CustomerSearch onClose={() => setOpen(false)} onSelect={customer => { setSelected(customer); onChange(customer.id); setOpen(false) }} />
    </div>}
  </>
}
