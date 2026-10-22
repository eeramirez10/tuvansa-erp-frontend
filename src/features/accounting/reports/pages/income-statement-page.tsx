import { useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { z } from "zod"

import { paths } from "@/app/router/paths"
import { AccountingReportsMenu } from "@/features/accounting/reports/components/accounting-reports-menu"
import { FinancialIncomeStatementDocument } from "@/features/accounting/reports/components/financial-income-statement-document"
import { IncomeStatementDocument } from "@/features/accounting/reports/components/income-statement-document"
import { incomeStatementOptionsQuery, incomeStatementQuery } from "@/features/accounting/reports/logic"
import type { IncomeStatementCriteria, IncomeStatementOptions } from "@/features/accounting/reports/model"
import { ErpModuleToolbarPortal } from "@/features/workspace/components/erp-module-toolbar-portal"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

const schema=z.object({accounts:z.literal("8"),month:z.number().int().min(1).max(24),level:z.number().int().min(1).max(8)})
function Parameters({ options, initial, onClose, onSubmit }: {
  options:IncomeStatementOptions; initial:IncomeStatementCriteria; onClose:()=>void; onSubmit:(criteria:IncomeStatementCriteria)=>void
}) {
  const form=useForm<IncomeStatementCriteria>({resolver:zodResolver(schema),defaultValues:initial})
  return <DesktopWindowIdentity id="accounting:income-statement:parameters"><ErpDataDialog defaultWidth={595} defaultHeight={285} title="Estado de resultados" description="Parámetros del reporte" onOpenChange={open=>{if(!open)onClose()}}>
    <ErpDataDialogBody>
      <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-[6rem_1fr] items-center gap-2">
          <label htmlFor="income-accounts">Cuentas</label><div className="flex items-center gap-2"><Input className="w-24" id="income-accounts" readOnly {...form.register("accounts")} /><span>('8' Solo result)</span></div>
          <label htmlFor="income-month">Mes</label><select className="h-7 rounded-sm border bg-background px-1" id="income-month" {...form.register("month",{valueAsNumber:true})}>{options.months.map(m=><option key={m.value} value={m.value}>{m.value} — {m.label}</option>)}</select>
          <label htmlFor="income-level">Nivel</label><select className="h-7 w-24 rounded-sm border bg-background px-1" id="income-level" {...form.register("level",{valueAsNumber:true})}>{options.levels.map(l=><option key={l.value} value={l.value}>{l.value}</option>)}</select>
        </div>
        {Object.keys(form.formState.errors).length>0 && <p role="alert">Revisa el mes y nivel seleccionados.</p>}
        <div>Imprimir en <label className="ml-2 inline-flex items-center gap-1"><input type="radio" checked readOnly/>Pantalla</label></div>
        <footer className="flex justify-end gap-2"><Button type="submit">OK</Button><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button></footer>
      </form>
    </ErpDataDialogBody>
  </ErpDataDialog></DesktopWindowIdentity>
}
function Workspace({ options }: {options:IncomeStatementOptions}) {
  const defaults:IncomeStatementCriteria={accounts:"8",month:options.defaultMonth,level:options.defaultLevel}
  const [parametersOpen,setParametersOpen]=useState(true)
  const [format,setFormat]=useState<"financial"|"proscai">("financial")
  const [criteria,setCriteria]=useState<IncomeStatementCriteria|null>(null)
  const report=useQuery({...incomeStatementQuery(criteria??defaults),enabled:criteria!==null})
  const loaded=report.data && !report.data.empty && !report.isFetching && !report.isError
  const printable=loaded && (format==="proscai" || Boolean(report.data?.financial))
  const ReportDocument=format==="financial" ? FinancialIncomeStatementDocument : IncomeStatementDocument
  const generate=(next:IncomeStatementCriteria)=>{
    if (JSON.stringify(next)===JSON.stringify(criteria)) void report.refetch()
    else setCriteria(next)
    setParametersOpen(false)
  }
  return <>
    <ErpModuleToolbarPortal><div className="flex items-center gap-1">
      <AccountingReportsMenu/>
      <label htmlFor="income-format" className="ml-1 text-xs">Formato</label>
      <select id="income-format" className="h-7 rounded-sm border bg-background px-1 text-xs" value={format} onChange={event=>setFormat(event.target.value as "financial"|"proscai")}><option value="financial">Gerencial (Excel)</option><option value="proscai">PROSCAI</option></select>
      <Button size="sm" variant="outline" onClick={()=>setParametersOpen(true)}>Parámetros</Button>
      <Button disabled={!printable} size="sm" onClick={()=>window.print()}>Imprimir / Guardar PDF</Button>
    </div></ErpModuleToolbarPortal>
    <div className="flex items-center justify-between gap-2"><h1 className="text-sm font-semibold">Estado de resultados</h1><Link className="text-xs underline" to={paths.accountingPolicies}>Volver a Pólizas</Link></div>
    {report.isFetching && <p className="flex items-center gap-2 py-4" role="status"><Spinner/>Generando reporte…</p>}
    {report.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(report.error)}</AlertDescription><Button size="sm" onClick={()=>void report.refetch()}>Reintentar</Button></Alert>}
    {!criteria && <p className="py-4 text-xs">Selecciona el mes y nivel en Parámetros para generar el estado de resultados.</p>}
    {report.data?.empty && !report.isFetching && !report.isError && <p className="py-4 text-xs" role="status">No hay saldos ni movimientos para los parámetros seleccionados.</p>}
    {loaded && format==="financial" && !report.data?.financial && <p role="alert" className="py-4 text-xs">Actualiza el backend para generar el formato Gerencial (Excel).</p>}
    {printable && <div className="income-statement-preview mt-2"><ReportDocument report={report.data!}/></div>}
    {printable && createPortal(<div className="income-statement-print-root"><ReportDocument report={report.data!}/></div>,document.body)}
    {parametersOpen && <Parameters options={options} initial={criteria??defaults} onClose={()=>setParametersOpen(false)} onSubmit={generate}/>}
  </>
}
export function IncomeStatementPage() {
  const options=useQuery(incomeStatementOptionsQuery())
  if (options.isPending) return <p className="flex items-center gap-2" role="status"><Spinner/>Cargando ejercicio contable…</p>
  if (options.isError) return <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(options.error)}</AlertDescription><Button size="sm" onClick={()=>void options.refetch()}>Reintentar</Button></Alert>
  return <Workspace options={options.data}/>
}
