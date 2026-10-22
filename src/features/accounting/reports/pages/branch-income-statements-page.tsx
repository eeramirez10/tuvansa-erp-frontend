import { useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { IncomeStatementToolbar } from "@/features/accounting/reports/components/income-statement-toolbar"
import { FinancialIncomeStatementDocument } from "@/features/accounting/reports/components/financial-income-statement-document"
import { branchIncomeStatementOptionsQuery, branchIncomeStatementsQuery } from "@/features/accounting/reports/logic"
import type { BranchIncomeStatements, BranchIncomeStatementsOptions, IncomeStatementFormat, MexicoIncomeStatementCriteria } from "@/features/accounting/reports/model"
import { downloadIncomeStatementExcel } from "@/features/accounting/reports/services/download-income-statement-excel"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { notifications } from "@/shared/notifications/notifications"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

type Props={onFormatChange:(format:IncomeStatementFormat)=>void}
const schema=z.object({month:z.number().int().min(1).max(12),year:z.number().int().min(2000).max(2100)})
function Parameters({options,initial,onClose,onSubmit}:{options:BranchIncomeStatementsOptions;initial:MexicoIncomeStatementCriteria;onClose:()=>void;onSubmit:(criteria:MexicoIncomeStatementCriteria)=>void}) {
  const form=useForm<MexicoIncomeStatementCriteria>({resolver:zodResolver(schema),defaultValues:initial})
  return <DesktopWindowIdentity id="accounting:income-statement:branches:parameters"><ErpDataDialog defaultWidth={620} defaultHeight={340} title="Estado de resultados — Todas las sucursales" description="Parámetros del reporte completo" onOpenChange={open=>{if(!open)onClose()}}>
    <ErpDataDialogBody><form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
      <p className="text-xs">{options.branches.map(branch=>branch.name.replace(/^SUC[.]?\s*/i,"")).join(" · ")}</p>
      <div className="grid grid-cols-[6rem_1fr] items-center gap-2">
        <label htmlFor="branches-year">Ejercicio</label><Input id="branches-year" readOnly type="number" {...form.register("year",{valueAsNumber:true})}/>
        <label htmlFor="branches-month">Mes</label><select id="branches-month" className="h-7 rounded-sm border bg-background px-1" {...form.register("month",{valueAsNumber:true})}>{options.months.map(month=><option key={month.value} value={month.value}>{month.label}</option>)}</select>
      </div>
      <p className="text-xs">Incluye siete reportes y el consolidado final del mes y acumulado.</p>
      <footer className="flex justify-end gap-2"><Button type="submit">OK</Button><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button></footer>
    </form></ErpDataDialogBody>
  </ErpDataDialog></DesktopWindowIdentity>
}
function Documents({data}:{data:BranchIncomeStatements}) {
  return <div className="financial-statement-report-set">{data.branches.map(item=><FinancialIncomeStatementDocument key={item.branch.warehouseCode} report={item.report}/>)}<FinancialIncomeStatementDocument report={data.consolidated}/></div>
}
function Workspace({options,onFormatChange}:{options:BranchIncomeStatementsOptions}&Props) {
  const defaults:MexicoIncomeStatementCriteria={month:options.defaultMonth,year:options.year}
  const [parametersOpen,setParametersOpen]=useState(true),[exporting,setExporting]=useState(false)
  const [criteria,setCriteria]=useState<MexicoIncomeStatementCriteria|null>(null)
  const report=useQuery({...branchIncomeStatementsQuery(criteria??defaults),enabled:criteria!==null})
  const printable=Boolean(report.data&&!report.data.empty&&!report.isFetching&&!report.isError)
  const generate=(next:MexicoIncomeStatementCriteria)=>{if(JSON.stringify(next)===JSON.stringify(criteria))void report.refetch();else setCriteria(next);setParametersOpen(false)}
  const excel=async()=>{
    if(!report.data||!printable||exporting)return
    setExporting(true)
    try { await downloadIncomeStatementExcel(report.data) } catch(error) { notifications.error(error instanceof Error?error.message:"No se pudo generar el archivo Excel.") } finally { setExporting(false) }
  }
  return <>
    <IncomeStatementToolbar format="branches" onFormatChange={onFormatChange} onParameters={()=>setParametersOpen(true)} printable={printable} onExcel={()=>void excel()} exporting={exporting}/>
    <h1 className="text-sm font-semibold">Estado de resultados — Todas las sucursales</h1>
    {report.isFetching&&<p role="status" className="flex items-center gap-2 py-4"><Spinner/>Generando siete sucursales y consolidado…</p>}
    {report.isError&&<Alert variant="destructive"><AlertDescription>{getApiErrorMessage(report.error)}</AlertDescription><Button size="sm" onClick={()=>void report.refetch()}>Reintentar</Button></Alert>}
    {!criteria&&<p className="py-4 text-xs">Selecciona el mes para generar el archivo completo.</p>}
    {report.data?.empty&&!report.isFetching&&!report.isError&&<p role="status" className="py-4 text-xs">No hay saldos ni movimientos en las siete sucursales para el mes seleccionado.</p>}
    {printable&&<div className="income-statement-preview mt-2"><Documents data={report.data!}/></div>}
    {printable&&createPortal(<div className="income-statement-print-root"><Documents data={report.data!}/></div>,document.body)}
    {parametersOpen&&<Parameters options={options} initial={criteria??defaults} onClose={()=>setParametersOpen(false)} onSubmit={generate}/>}
  </>
}
export function BranchIncomeStatementsPage({onFormatChange}:Props) {
  const options=useQuery(branchIncomeStatementOptionsQuery())
  if(options.isPending)return <p role="status" className="flex items-center gap-2"><Spinner/>Cargando las siete sucursales…</p>
  if(options.isError)return <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(options.error)}</AlertDescription><Button size="sm" onClick={()=>void options.refetch()}>Reintentar</Button></Alert>
  return <Workspace options={options.data} onFormatChange={onFormatChange}/>
}
