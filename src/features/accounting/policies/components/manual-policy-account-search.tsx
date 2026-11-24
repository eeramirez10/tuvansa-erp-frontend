import { useQuery } from "@tanstack/react-query"
import { useDeferredValue, useState } from "react"
import { manualPolicyAccountsQueryOptions } from "@/features/accounting/policies/logic"
import type { ManualPolicyAccount } from "@/features/accounting/policies/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

export function ManualPolicyAccountSearch({ initialCode, onClose, onSelect }: {
  initialCode: string
  onClose: () => void
  onSelect: (account: ManualPolicyAccount) => void
}) {
  const [search, setSearch] = useState(initialCode)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const submitted = useDeferredValue(search.trim())
  const query = useQuery(manualPolicyAccountsQueryOptions(submitted))
  const accounts = query.data ?? []
  const selected = accounts.find(account => account.id === selectedId)
  return (
    <ErpDataDialog defaultWidth={510} title="Buscar cuenta" description="Busca una cuenta contable por código o nombre."
      onOpenChange={open => { if (!open) onClose() }}>
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal" onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); onClose() }
      }}>
        <Input aria-label="Código o nombre de la cuenta" autoFocus maxLength={80} placeholder="Código o nombre"
          value={search} onChange={event => { setSearch(event.currentTarget.value); setSelectedId(null) }} />
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        {query.isFetching && <div className="flex items-center gap-1" role="status"><Spinner /> Consultando cuentas…</div>}
        <ErpDataTableViewport axes="xy" className="h-48">
          <Table>
            <TableHeader className="sticky top-0 bg-muted"><TableRow><TableHead>Código</TableHead><TableHead>Cuenta</TableHead></TableRow></TableHeader>
            <TableBody>
              {accounts.map(account => (
                <TableRow data-state={account.id === selectedId ? "selected" : undefined} key={account.id}
                  onClick={() => setSelectedId(account.id)} onDoubleClick={() => onSelect(account)}>
                  <TableCell><Button aria-pressed={account.id === selectedId} size="xs" type="button" variant="ghost">
                    {account.code}
                  </Button></TableCell>
                  <TableCell>{account.name}</TableCell>
                </TableRow>
              ))}
              {submitted && !query.isFetching && !query.isError && accounts.length === 0 &&
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Sin cuentas disponibles</TableCell></TableRow>}
            </TableBody>
          </Table>
        </ErpDataTableViewport>
        <footer className="flex justify-end gap-1">
          <Button disabled={!selected || query.isFetching} onClick={() => { if (selected) onSelect(selected) }} size="xs" type="button">OK</Button>
          <Button onClick={onClose} size="xs" type="button" variant="outline">Cancelar</Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
