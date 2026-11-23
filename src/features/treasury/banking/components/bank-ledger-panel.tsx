import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { BankPanelTable } from "@/features/treasury/banking/components/bank-panel-table"
import { bankAccountKeys, bankMoney } from "@/features/treasury/banking/logic"
import type { BankPanel } from "@/features/treasury/banking/model"
import { saveBankBudget } from "@/features/treasury/banking/services/bank-panel-settings-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const schema = z.object({
  values: z.array(z.string().trim().regex(/^-?(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/, "Captura importes de hasta dos decimales.")).length(12),
})

function BudgetEditor({ defaults, mode, saving, onSave, onCancel }: {
  defaults: string[]
  mode: "equal" | "monthly"
  saving: boolean
  onSave: (values: number[]) => void
  onCancel: () => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { values: defaults },
  })
  return <form className="grid gap-1" onSubmit={handleSubmit(({ values }) => {
    const amounts = values.map(Number)
    onSave(mode === "equal" ? Array<number>(12).fill(amounts[0] ?? 0) : amounts)
  })}>
    {(mode === "equal" ? ["Importe mensual"] : months).map((month, index) => (
      <div className="flex items-center justify-between gap-1" key={month}>
        <Label htmlFor={`bank-budget-${index}`}>{month}</Label>
        <Input className="h-6 w-24 text-right tabular-nums" disabled={saving} id={`bank-budget-${index}`} inputMode="decimal"
          aria-invalid={Boolean(errors.values?.[index])} {...register(`values.${index}`)} />
      </div>
    ))}
    {errors.values && <p className="text-destructive" role="alert">Captura importes de hasta dos decimales.</p>}
    <div className="flex justify-end gap-1">
      <Button disabled={saving} onClick={onCancel} size="xs" type="button" variant="outline">Cancelar</Button>
      <Button disabled={saving} size="xs" type="submit">OK</Button>
    </div>
  </form>
}

export function BankLedgerPanel({ accountId, data, center, onCenterChange }: {
  accountId: number
  data: BankPanel
  center?: string
  onCenterChange?: (center: string) => void
}) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<"equal" | "monthly" | null>(null)
  const periods = [data.items.slice(0, 12), data.items.slice(12, 24)]
  const rows = data.items.map((row, index) => ({ ...row, period: index < 12 ? 1 : 2, monthName: months[index % 12] }))
  const years = Array.isArray(data.summary?.years) ? data.summary.years : []
  const centers = Array.isArray(data.summary?.centers)
    ? (data.summary.centers as { code: string; description: string }[]).map(({ code, description }) => ({
      value: String(code).trim(), label: `${code} ${description}`,
    }))
    : []
  const save = useMutation({
    mutationFn: (values: number[]) => saveBankBudget(accountId, Number(data.summary?.revision ?? 0), values, center),
    onSuccess: async () => {
      setMode(null)
      toast.success("Presupuesto guardado.")
      await queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
    },
  })
  return <div className="grid min-w-0 gap-2">
    {onCenterChange && centers.length > 0 && <div className="flex items-center gap-2">
      <Label htmlFor="bank-ledger-center">Centro de costos</Label>
      <Select disabled={Boolean(mode) || save.isPending} items={centers} onValueChange={(value) => { if (value) onCenterChange(value) }} value={center ?? ""}>
        <SelectTrigger id="bank-ledger-center" size="sm"><SelectValue placeholder="Selecciona un centro" /></SelectTrigger>
        <SelectContent>{centers.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
      </Select>
    </div>}
    <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <BankPanelTable columns={[
        { label: "Periodo", key: "period" }, { label: "Mes", key: "monthName" },
        { label: "Saldo", key: "balance", numeric: true }, { label: "Cargos", key: "charges", numeric: true },
        { label: "Abono", key: "credits", numeric: true },
        ...(center ? [{ label: "Gastos prorrateo", key: "prorationExpenses", numeric: true }] : []),
      ]} minWidth="min-w-[520px]" rows={rows} />
      <div className="grid content-start gap-1">
        {periods.map((period, index) => <Card key={index} size="sm">
          <CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Presupuesto {years[index] ?? index + 1}</CardTitle></CardHeader>
          <CardContent className="grid gap-0.5 py-1">
            {index === 0 && mode
              ? <BudgetEditor defaults={period.map((row) => Number(row.budget ?? 0).toFixed(2))}
                mode={mode} onCancel={() => { setMode(null); save.reset() }} onSave={(values) => save.mutate(values)} saving={save.isPending} />
              : <>
                {period.map((row, month) => <ErpDataMetric key={month} label={months[month] ?? ""} value={bankMoney(row.budget)} />)}
                {index === 0 && <div className="flex gap-1">
                  <Button disabled={!data.summary?.budgetEditable} onClick={() => setMode("equal")} size="xs" variant="outline">Iguales</Button>
                  <Button disabled={!data.summary?.budgetEditable} onClick={() => setMode("monthly")} size="xs" variant="outline">Cambiar</Button>
                </div>}
              </>}
          </CardContent>
        </Card>)}
      </div>
    </div>
    {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
  </div>
}
