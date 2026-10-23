import type { IncomeStatementFormat } from "@/features/accounting/reports/model"
import { ErpModuleToolbarPortal } from "@/features/workspace/components/erp-module-toolbar-portal"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

export function IncomeStatementToolbar({ format, onFormatChange, onParameters, printable, onExcel, exporting=false, showActions=true }: {
  format: IncomeStatementFormat
  onFormatChange: (format: IncomeStatementFormat) => void
  onParameters: () => void
  printable: boolean
  onExcel?:()=>void
  exporting?:boolean
  showActions?:boolean
}) {
  return <ErpModuleToolbarPortal><div className="flex items-center gap-1">
    <Label htmlFor="income-format" className="ml-1 text-xs">Formato</Label>
    <Select value={format} items={[{value:"branches",label:"Gerencial (Excel/PDF)"},{value:"financial",label:"México (Excel)"},{value:"proscai",label:"PROSCAI"}]} modal={false} onValueChange={value=>{if(value)onFormatChange(value as IncomeStatementFormat)}}>
      <SelectTrigger id="income-format" size="sm"><SelectValue /></SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false}>
        <SelectItem value="branches">Gerencial (Excel/PDF)</SelectItem>
        <SelectItem value="financial">México (Excel)</SelectItem>
        <SelectItem value="proscai">PROSCAI</SelectItem>
      </SelectContent>
    </Select>
    <Button size="sm" variant="outline" onClick={onParameters}>Parámetros</Button>
    {onExcel && <Button disabled={!printable||exporting} size="sm" variant="outline" onClick={onExcel}>{exporting?"Generando Excel…":"Descargar Excel"}</Button>}
    {showActions && <Button disabled={!printable||exporting} size="sm" onClick={()=>window.print()}>Imprimir / Guardar PDF</Button>}
  </div></ErpModuleToolbarPortal>
}
