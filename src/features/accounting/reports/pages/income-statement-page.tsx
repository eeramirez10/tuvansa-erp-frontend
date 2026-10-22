import { useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { z } from "zod"

import { paths } from "@/app/router/paths"
import { IncomeStatementToolbar } from "@/features/accounting/reports/components/income-statement-toolbar"
import { MexicoIncomeStatementPage } from "@/features/accounting/reports/pages/mexico-income-statement-page"
import { IncomeStatementDocument } from "@/features/accounting/reports/components/income-statement-document"
import { incomeStatementOptionsQuery, incomeStatementQuery } from "@/features/accounting/reports/logic"
import type { IncomeStatementCriteria, IncomeStatementOptions } from "@/features/accounting/reports/model"
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
function Workspace({ options, onFormatChange }: {options:IncomeStatementOptions; onFormatChange:(format:"financial"|"proscai")=>void}) {
  const defaults:IncomeStatementCriteria={accounts:"8",month:options.defaultMonth,level:options.defaultLevel}
  const [parametersOpen,setParametersOpen]=useState(true)
  const [criteria,setCriteria]=useState<IncomeStatementCriteria|null>(null)
  const report=useQuery({...incomeStatementQuery(criteria??defaults),enabled:criteria!==null})
  const loaded=report.data && !report.data.empty && !report.isFetching && !report.isError
  const printable=Boolean(loaded)
  const generate=(next:IncomeStatementCriteria)=>{
    if (JSON.stringify(next)===JSON.stringify(criteria)) void report.refetch()
    else setCriteria(next)
    setParametersOpen(false)
  }
  return <>
    <IncomeStatementToolbar format="proscai" onFormatChange={onFormatChange} onParameters={()=>setParametersOpen(true)} printable={printable}/>
    <div className="flex items-center justify-between gap-2"><h1 className="text-sm font-semibold">Estado de resultados</h1><Link className="text-xs underline" to={paths.accountingPolicies}>Volver a Pólizas</Link></div>
    {report.isFetching && <p className="flex items-center gap-2 py-4" role="status"><Spinner/>Generando reporte…</p>}
    {report.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(report.error)}</AlertDescription><Button size="sm" onClick={()=>void report.refetch()}>Reintentar</Button></Alert>}
    {!criteria && <p className="py-4 text-xs">Selecciona el mes y nivel en Parámetros para generar el estado de resultados.</p>}
    {report.data?.empty && !report.isFetching && !report.isError && <p className="py-4 text-xs" role="status">No hay saldos ni movimientos para los parámetros seleccionados.</p>}
    {printable && <div className="income-statement-preview mt-2"><IncomeStatementDocument report={report.data!}/></div>}
    {printable && createPortal(<div className="income-statement-print-root"><IncomeStatementDocument report={report.data!}/></div>,document.body)}
    {parametersOpen && <Parameters options={options} initial={criteria??defaults} onClose={()=>setParametersOpen(false)} onSubmit={generate}/>}
  </>
}
function ProscaiIncomeStatementPage({onFormatChange}:{onFormatChange:(format:"financial"|"proscai")=>void}) {
  const options=useQuery(incomeStatementOptionsQuery())
  if (options.isPending) return <p className="flex items-center gap-2" role="status"><Spinner/>Cargando ejercicio contable…</p>
  if (options.isError) return <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(options.error)}</AlertDescription><Button size="sm" onClick={()=>void options.refetch()}>Reintentar</Button></Alert>
  return <Workspace options={options.data} onFormatChange={onFormatChange}/>
}


export function IncomeStatementPage() {
  const [format,setFormat]=useState<"financial"|"proscai">("financial")
  return format==="financial" ? <MexicoIncomeStatementPage onFormatChange={setFormat}/> : <ProscaiIncomeStatementPage onFormatChange={setFormat}/>
}
