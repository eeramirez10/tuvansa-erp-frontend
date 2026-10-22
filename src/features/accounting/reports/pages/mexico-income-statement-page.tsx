import { useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { z } from "zod"
import { paths } from "@/app/router/paths"
import { IncomeStatementToolbar } from "@/features/accounting/reports/components/income-statement-toolbar"
import { FinancialIncomeStatementDocument } from "@/features/accounting/reports/components/financial-income-statement-document"
import { mexicoIncomeStatementOptionsQuery, mexicoIncomeStatementQuery } from "@/features/accounting/reports/logic"
import type { MexicoIncomeStatementCriteria, MexicoIncomeStatementOptions } from "@/features/accounting/reports/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

type Props={onFormatChange:(format:"financial"|"proscai")=>void}
const schema=z.object({month:z.number().int().min(1).max(12),year:z.number().int().min(2000).max(2100)})
function MexicoParameters({options,initial,onClose,onSubmit}:{options:MexicoIncomeStatementOptions;initial:MexicoIncomeStatementCriteria;onClose:()=>void;onSubmit:(criteria:MexicoIncomeStatementCriteria)=>void}) {
  const form=useForm<MexicoIncomeStatementCriteria>({resolver:zodResolver(schema),defaultValues:initial})
  return <DesktopWindowIdentity id="accounting:income-statement:mexico:parameters"><ErpDataDialog defaultWidth={540} defaultHeight={300} title="Estado de resultados — México" description="Parámetros del reporte de México" onOpenChange={open=>{if(!open)onClose()}}>
    <ErpDataDialogBody><form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-[6rem_1fr] items-center gap-2">
        <label htmlFor="mexico-branch">Sucursal</label><Input id="mexico-branch" readOnly value="01 — México"/>
        <label htmlFor="mexico-year">Ejercicio</label><Input id="mexico-year" readOnly type="number" {...form.register("year",{valueAsNumber:true})}/>
        <label htmlFor="mexico-month">Mes</label><select id="mexico-month" className="h-7 rounded-sm border bg-background px-1" {...form.register("month",{valueAsNumber:true})}>{options.months.map(month=><option key={month.value} value={month.value}>{month.label}</option>)}</select>
      </div>
      {Object.keys(form.formState.errors).length>0 && <p role="alert">Revisa el mes y ejercicio.</p>}
      <footer className="flex justify-end gap-2"><Button type="submit">OK</Button><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button></footer>
    </form></ErpDataDialogBody>
  </ErpDataDialog></DesktopWindowIdentity>
}
function MexicoWorkspace({options,onFormatChange}:{options:MexicoIncomeStatementOptions}&Props) {
  const defaults:MexicoIncomeStatementCriteria={month:options.defaultMonth,year:options.year}
  const [parametersOpen,setParametersOpen]=useState(true)
  const [criteria,setCriteria]=useState<MexicoIncomeStatementCriteria|null>(null)
  const report=useQuery({...mexicoIncomeStatementQuery(criteria??defaults),enabled:criteria!==null})
  const printable=Boolean(report.data?.financial && !report.data.empty && !report.isFetching && !report.isError)
  const generate=(next:MexicoIncomeStatementCriteria)=>{
    if (JSON.stringify(next)===JSON.stringify(criteria)) void report.refetch()
    else setCriteria(next)
    setParametersOpen(false)
  }
  return <>
    <IncomeStatementToolbar format="financial" onFormatChange={onFormatChange} onParameters={()=>setParametersOpen(true)} printable={printable}/>
    <div className="flex items-center justify-between gap-2"><h1 className="text-sm font-semibold">Estado de resultados — México</h1><Link className="text-xs underline" to={paths.accountingPolicies}>Volver a Pólizas</Link></div>
    {report.isFetching && <p role="status" className="flex items-center gap-2 py-4"><Spinner/>Generando reporte de México…</p>}
    {report.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(report.error)}</AlertDescription><Button size="sm" onClick={()=>void report.refetch()}>Reintentar</Button></Alert>}
    {!criteria && <p className="py-4 text-xs">Selecciona el mes de México para generar el reporte.</p>}
    {report.data?.empty && !report.isFetching && !report.isError && <p className="py-4 text-xs" role="status">No hay saldos ni movimientos de México para el mes seleccionado.</p>}
    {printable && <div className="income-statement-preview mt-2"><FinancialIncomeStatementDocument report={report.data!}/></div>}
    {printable && createPortal(<div className="income-statement-print-root"><FinancialIncomeStatementDocument report={report.data!}/></div>,document.body)}
    {parametersOpen && <MexicoParameters options={options} initial={criteria??defaults} onClose={()=>setParametersOpen(false)} onSubmit={generate}/>}
  </>
}
export function MexicoIncomeStatementPage({onFormatChange}:Props) {
  const options=useQuery(mexicoIncomeStatementOptionsQuery())
  if (options.isPending) return <p role="status" className="flex items-center gap-2"><Spinner/>Cargando ejercicio de México…</p>
  if (options.isError) return <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(options.error)}</AlertDescription><Button size="sm" onClick={()=>void options.refetch()}>Reintentar</Button></Alert>
  return <MexicoWorkspace options={options.data} onFormatChange={onFormatChange}/>
}
