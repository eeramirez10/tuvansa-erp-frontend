import { useDeferredValue, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { clientSearchQueryOptions } from "@/features/accounts-receivable/clients/logic"
import type { Client } from "@/features/accounts-receivable/clients/model"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { cn } from "@/shared/utils/cn"

type ClientSearchDialogProps = {
  onOpenChange: (open: boolean) => void
  onSelect: (client: Client) => void
}

export function ClientSearchDialog({ onOpenChange, onSelect }: ClientSearchDialogProps) {
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [taxId, setTaxId] = useState("")
  const [selected, setSelected] = useState<Client | null>(null)
  const q = useDeferredValue((code || name || taxId).trim())
  const query = useQuery({
    ...clientSearchQueryOptions({ q: q || undefined, status: "all", page: 1, pageSize: 100 }),
  })
  const clients = query.data?.data ?? []

  const changeFilter = (filter: "code" | "name" | "taxId", value: string) => {
    setCode(filter === "code" ? value : "")
    setName(filter === "name" ? value : "")
    setTaxId(filter === "taxId" ? value.toUpperCase() : "")
    setSelected(null)
  }

  const accept = (client = selected) => client && onSelect(client)

  return (
    <ErpDataDialog className="sm:max-w-[39rem]" description="Buscar cliente por código, razón social o RFC." onOpenChange={onOpenChange} title="Encuentra cliente" tone="receivable">
      <ErpDataDialogBody>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: "7rem minmax(0,1fr) 9rem" }}>
          {([
            ["code", "Cliente", code],
            ["name", "Razón social", name],
            ["taxId", "R.F.C.", taxId],
          ] as const).map(([key, label, value]) => (
            <label className="grid gap-0.5" key={key}>
              <span className="px-1">{label}</span>
              <input autoComplete="off" className="h-5 border border-input bg-background px-1 text-[9px] shadow-inner outline-none focus:border-module-receivable" onChange={(event) => changeFilter(key, event.target.value)} value={value} />
            </label>
          ))}
        </div>

        <ErpDataTableViewport axes="y" className="mt-1" style={{ height: "17rem" }}>
          <table className="w-full table-fixed border-collapse text-[9px]/none">
            <colgroup><col className="w-[7rem]" /><col /><col className="w-[9rem]" /></colgroup>
            <thead className="sticky top-0 bg-background"><tr className="h-4 border-b"><th className="px-1 text-left font-normal">Cliente</th><th className="px-1 text-left font-normal">Razón social</th><th className="px-1 text-left font-normal">R.F.C.</th></tr></thead>
            <tbody>
              {clients.map((client) => (
                <tr className={cn("h-4 cursor-default", selected?.id === client.id && "bg-module-receivable text-module-receivable-foreground")} key={client.id} onClick={() => setSelected(client)} onDoubleClick={() => accept(client)}>
                  <td className="truncate px-1">{client.code}</td><td className="truncate px-1">{client.name}</td><td className="truncate px-1">{client.fiscal.taxId}</td>
                </tr>
              ))}
              {!query.isLoading && clients.length === 0 && <tr><td className="h-48 text-center text-muted-foreground" colSpan={3}>Sin clientes</td></tr>}
            </tbody>
          </table>
        </ErpDataTableViewport>
        <div className="mt-1 flex justify-end gap-1">
          <Button disabled={!selected} onClick={() => accept()} size="xs">✓ OK</Button>
          <Button onClick={() => onOpenChange(false)} size="xs" variant="outline">× Cancelar</Button>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
