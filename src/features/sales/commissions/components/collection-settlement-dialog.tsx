import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { collectionMoney, collectionReportQuery } from "@/features/sales/commissions/logic"
import type { CollectionCommissions, SettlementSettings } from "@/features/sales/commissions/model"
import { downloadCollectionCommissions } from "@/features/sales/commissions/services/download-collection-commissions"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { notifications } from "@/shared/notifications/notifications"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { ReportSelect } from "@/shared/ui/report-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
const money = z.number().min(0).max(1_000_000_000_000).multipleOf(0.01)
const schema = z.object({ bonusMode: z.enum(["additional","exclusive","unconfirmed"]), agents: z.array(z.object({ code: z.string(), plan: z.enum(["salary","fixed","unconfirmed"]), fixedRate: z.number().min(0).max(100).multipleOf(0.01),
  costBasis: z.enum(["proportional","total"]), costOverride: money.nullable(), freight: money, gratuities: money, includeLm: z.boolean() })) })
const percent = (value: number | null) => value === null ? "Pendiente" : value.toFixed(2) + "%"

export function CollectionSettlementDialog({ original, onClose, onApply }: { original: CollectionCommissions; onClose: () => void; onApply: (settings: SettlementSettings) => void }) {
  const defaults: SettlementSettings = { bonusMode: original.settlement.bonusMode, agents: original.settlement.agents.map(a => a.config) }
  const form = useForm<SettlementSettings>({ resolver: zodResolver(schema), defaultValues: defaults })
  const [submitted, setSubmitted] = useState<SettlementSettings | null>(null), [exporting, setExporting] = useState(false)
  const preview = useQuery({ ...collectionReportQuery(original.criteria, submitted ?? defaults), enabled: submitted !== null })
  const source = submitted ? preview.data : original, busy = preview.isFetching || exporting
  const ready = Boolean(source && !form.formState.isDirty && !busy && !(submitted && preview.isError))
  const calculate = (settings: SettlementSettings) => { form.reset(settings); if (JSON.stringify(settings) === JSON.stringify(submitted)) void preview.refetch(); else setSubmitted(settings) }
  const download = async () => {
    if (!ready || !source) return
    setExporting(true)
    try { await downloadCollectionCommissions(source) } catch (error) { notifications.error(getApiErrorMessage(error)) } finally { setExporting(false) }
  }
  return <DesktopWindowIdentity id="sales:reports:collection-settlement"><ErpDataDialog title="Liquidación de comisiones" description="Resumen y parámetros del archivo de comisiones por sucursal" tone="sales" defaultWidth={1200} defaultHeight={Math.min(790, window.innerHeight - 130)} fillHeight onOpenChange={open => { if (!open) onClose() }}>
    <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-2">
      <Alert className="shrink-0"><AlertDescription>Nuevo y Viejo recuperado: 1% del pago sin IVA. Se utiliza la marca actual del cliente. Ajustes sólo para este reporte; no modifican el ERP. El Excel contiene detalle por agente y fecha, resumen de tres renglones y una hoja por vendedor con 15 columnas, incluida la marca nuevo y su 1% de lo pagado.</AlertDescription></Alert>
      <div className="min-h-0 flex-1 overflow-auto" role="region" aria-label="Liquidación y parámetros de comisiones">
        <form onSubmit={form.handleSubmit(calculate)} className="space-y-2 rounded-sm border bg-background p-2">
          <div className="flex items-end gap-2"><Controller control={form.control} name="bonusMode" render={({ field }) => <ReportSelect id="settlement-bonus-mode" label="Tratamiento del 1%" value={field.value} options={[{ value:"unconfirmed",label:"Por confirmar" },{ value:"additional",label:"Adicional a la comisión normal" },{ value:"exclusive",label:"Sustituye la comisión normal" }]} onChange={field.onChange} disabled={busy} />} />
            <Button type="submit" disabled={busy}>{preview.isFetching ? "Recalculando…" : "Recalcular liquidación"}</Button></div>
          <p className="text-[10px]">Tabulador mensual: margen neto mayor a 16%; tasas 0%, 4%, 5%, 7%, 8%, 9% y 12% según cobranza. Perfiles precargados sólo para septiembre 2026 de México, conforme al ejemplo. Otros periodos o equipos requieren selección.</p>
          <Table aria-label="Parámetros por agente" className="min-w-[1450px]"><TableHeader><TableRow>{["Agente","Plan","% fijo","Base de costo","Costo manual (opcional)","Flete entrega","Gratificaciones","Incluir PLM"].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{original.settlement.agents.map((agent, i) => <TableRow key={agent.code}><TableCell>{agent.code} · {agent.name}</TableCell>
              <TableCell><Controller control={form.control} name={`agents.${i}.plan`} render={({ field }) => <ReportSelect id={`settlement-plan-${agent.code}`} label={`Plan ${agent.code}`} value={field.value} options={[{ value:"unconfirmed",label:"Por confirmar" },{ value:"salary",label:"Tabulador con sueldo" },{ value:"fixed",label:"Porcentaje fijo" }]} onChange={field.onChange} disabled={busy} />} /></TableCell>
              <TableCell><Label htmlFor={`settlement-rate-${agent.code}`}>% fijo {agent.code}</Label><Input id={`settlement-rate-${agent.code}`} type="number" min="0" max="100" step="0.01" disabled={busy} {...form.register(`agents.${i}.fixedRate`, { valueAsNumber:true })} /></TableCell>
              <TableCell><Controller control={form.control} name={`agents.${i}.costBasis`} render={({ field }) => <ReportSelect id={`settlement-cost-${agent.code}`} label={`Base de costo ${agent.code}`} value={field.value} options={[{ value:"proportional",label:"Costo real proporcional" },{ value:"total",label:"Costo total de factura" }]} onChange={field.onChange} disabled={busy} />} /></TableCell>
              <TableCell><Label htmlFor={`settlement-override-${agent.code}`}>Costo manual {agent.code}</Label><Controller control={form.control} name={`agents.${i}.costOverride`} render={({ field }) => <Input id={`settlement-override-${agent.code}`} type="number" min="0" step="0.01" placeholder="Usar origen" value={field.value ?? ""} disabled={busy} onChange={e => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />} /></TableCell>
              <TableCell><Label htmlFor={`settlement-freight-${agent.code}`}>Flete {agent.code}</Label><Input id={`settlement-freight-${agent.code}`} type="number" min="0" step="0.01" disabled={busy} {...form.register(`agents.${i}.freight`, { valueAsNumber:true })} /></TableCell>
              <TableCell><Label htmlFor={`settlement-gratuity-${agent.code}`}>Gratificaciones {agent.code}</Label><Input id={`settlement-gratuity-${agent.code}`} type="number" min="0" step="0.01" disabled={busy} {...form.register(`agents.${i}.gratuities`, { valueAsNumber:true })} /></TableCell>
              <TableCell><Controller control={form.control} name={`agents.${i}.includeLm`} render={({ field }) => <Label><Checkbox checked={field.value} disabled={busy} onCheckedChange={v => field.onChange(v === true)} />PLM {agent.code}</Label>} /></TableCell>
            </TableRow>)}</TableBody></Table>
          {Object.keys(form.formState.errors).length > 0 && <p role="alert" className="text-xs text-destructive">Revisa porcentajes de 0 a 100 e importes positivos con hasta dos decimales.</p>}
        </form>
        {form.formState.isDirty && <p role="status" className="p-2 text-xs">Recalcula para aplicar los parámetros y habilitar la descarga.</p>}
        {submitted && preview.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(preview.error)}</AlertDescription><Button onClick={() => void preview.refetch()}>Reintentar liquidación</Button></Alert>}
        {source && <><p className="p-2 text-xs font-semibold">{source.company} · {source.criteria.from} — {source.criteria.to}</p>
          <Table aria-label="Resumen de liquidación" className="min-w-[1900px]"><TableHeader><TableRow>{["Agente","Cobranza normal","Costo","Utilidad bruta","% bruta","Flete","Gratificaciones","Utilidad neta","% neta","% comisión","Comisión normal","Base clientes 1%","Bono clientes 1%","PLM","Total a recibir"].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{source.settlement.agents.map(a => <TableRow key={a.code}><TableCell>{a.code} · {a.name}</TableCell>
            {[a.payment,a.cost,a.grossProfit].map((v,i) => <TableCell key={i}>{collectionMoney(v)}</TableCell>)}<TableCell>{percent(a.grossMargin)}</TableCell>
            {[a.freight,a.gratuities,a.netProfit].map((v,i) => <TableCell key={i}>{collectionMoney(v)}</TableCell>)}<TableCell>{percent(a.netMargin)}</TableCell><TableCell>{percent(a.rate)}</TableCell>
            {[a.regularCommission,a.customerBonusBase,a.customerBonus,a.lmBonus,a.totalCommission].map((v,i) => <TableCell key={i}>{collectionMoney(v)}</TableCell>)}</TableRow>)}</TableBody></Table>
          {!source.settlement.ready && <Alert className="mt-2 border-amber-500"><AlertDescription>Liquidación pendiente: los importes sin confirmar se dejan vacíos en Excel.
            {source.settlement.bonusMode === "unconfirmed" && <p>Elige si el 1% se suma o sustituye a la comisión normal.</p>}
            {source.settlement.agents.map(a => ({...a,pending:a.pending.filter(p => !p.startsWith("Elige si el 1%"))})).filter(a => a.pending.length).map(a => <p key={a.code}>{a.code} · {a.pending.join(" ")}</p>)}</AlertDescription></Alert>}
          <p className="p-2 text-xs font-semibold">Comisión normal: {collectionMoney(source.settlement.totals.regularCommission)} · Clientes 1%: {collectionMoney(source.settlement.totals.customerBonus)} · PLM: {collectionMoney(source.settlement.totals.lmBonus)} · Total: {collectionMoney(source.settlement.totals.totalCommission)}</p>
        </>}
      </div>
      <footer className="flex shrink-0 justify-end gap-2"><Button disabled={!ready} onClick={() => void download()}>{exporting ? "Generando Excel…" : "Descargar liquidación Excel"}</Button><Button disabled={!ready} variant="outline" onClick={() => { onApply(submitted ?? defaults); onClose() }}>Aplicar y cerrar</Button><Button variant="outline" onClick={onClose}>Cancelar</Button></footer>
    </ErpDataDialogBody>
  </ErpDataDialog></DesktopWindowIdentity>
}
