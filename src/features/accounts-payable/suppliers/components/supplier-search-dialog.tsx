import { useDeferredValue, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supplierSearchQueryOptions } from "@/features/accounts-payable/suppliers/logic"
import type { Supplier } from "@/features/accounts-payable/suppliers/model"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { cn } from "@/shared/utils/cn"

type Props = {
  onOpenChange: (open: boolean) => void
  onSelect: (supplier: Supplier) => void
}

export function SupplierSearchDialog({ onOpenChange, onSelect }: Props) {
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [taxId, setTaxId] = useState("")
  const [selected, setSelected] = useState<Supplier | null>(null)
  const q = useDeferredValue((code || name || taxId).trim())
  const query = useQuery({
    ...supplierSearchQueryOptions({ q: q || undefined, status: "all", page: 1, pageSize: 100 }),
  })
  const suppliers = query.data?.data ?? []

  const changeFilter = (filter: "code" | "name" | "taxId", value: string) => {
    setCode(filter === "code" ? value : "")
    setName(filter === "name" ? value : "")
    setTaxId(filter === "taxId" ? value.toUpperCase() : "")
    setSelected(null)
  }
  const accept = (supplier = selected) => supplier && onSelect(supplier)

  return (
    <ErpDataDialog className="sm:max-w-[42rem]" description="Buscar proveedor por código, razón social o RFC." onOpenChange={onOpenChange} title="Encuentra proveedor" tone="payable">
      <ErpDataDialogBody>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: "7rem minmax(0,1fr) 9rem" }}>
          {([
            ["code", "Proveedor", code],
            ["name", "Razón social", name],
            ["taxId", "R.F.C.", taxId],
          ] as const).map(([key, label, value]) => (
            <label className="grid gap-0.5" key={key}>
              <span className="px-1">{label}</span>
              <input autoComplete="off" className="h-5 border border-input bg-background px-1 text-[9px] shadow-inner outline-none focus:border-module-payable" onChange={(event) => changeFilter(key, event.target.value)} value={value} />
            </label>
          ))}
        </div>

        <ErpDataTableViewport axes="y" className="mt-1" style={{ height: "17rem" }}>
          <table className="w-full table-fixed border-collapse text-[9px]/none">
            <colgroup><col className="w-[7rem]" /><col /><col className="w-[9rem]" /></colgroup>
            <thead className="sticky top-0 bg-background"><tr className="h-4 border-b"><th className="px-1 text-left font-normal">Proveedor</th><th className="px-1 text-left font-normal">Razón social</th><th className="px-1 text-left font-normal">R.F.C.</th></tr></thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr className={cn("h-4 cursor-default", selected?.id === supplier.id && "bg-module-payable text-module-payable-foreground")} key={supplier.id} onClick={() => setSelected(supplier)} onDoubleClick={() => accept(supplier)}>
                  <td className="truncate px-1">{supplier.code}</td><td className="truncate px-1">{supplier.name}</td><td className="truncate px-1">{supplier.fiscal.taxId}</td>
                </tr>
              ))}
              {!query.isLoading && suppliers.length === 0 && <tr><td className="h-48 text-center text-muted-foreground" colSpan={3}>Sin proveedores</td></tr>}
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
