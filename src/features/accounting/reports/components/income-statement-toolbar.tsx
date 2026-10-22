import { AccountingReportsMenu } from "@/features/accounting/reports/components/accounting-reports-menu"
import { ErpModuleToolbarPortal } from "@/features/workspace/components/erp-module-toolbar-portal"
import { Button } from "@/shared/ui/button"

export function IncomeStatementToolbar({ format, onFormatChange, onParameters, printable }: {
  format: "financial" | "proscai"
  onFormatChange: (format: "financial" | "proscai") => void
  onParameters: () => void
  printable: boolean
}) {
  return <ErpModuleToolbarPortal><div className="flex items-center gap-1">
    <AccountingReportsMenu/>
    <label htmlFor="income-format" className="ml-1 text-xs">Formato</label>
    <select id="income-format" className="h-7 rounded-sm border bg-background px-1 text-xs" value={format} onChange={event=>onFormatChange(event.target.value as "financial"|"proscai")}>
      <option value="financial">México (Excel)</option><option value="proscai">PROSCAI</option>
    </select>
    <Button size="sm" variant="outline" onClick={onParameters}>Parámetros</Button>
    <Button disabled={!printable} size="sm" onClick={()=>window.print()}>Imprimir / Guardar PDF</Button>
  </div></ErpModuleToolbarPortal>
}
