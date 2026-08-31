import { useId } from "react"
import type { BankAccount } from "@/features/treasury/banking/model"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const display = (value: string | number | null) => value === null ? "" : String(value)

function Field({ label, value, className = "", numeric = false }: { label: string; value: string | number | null; className?: string; numeric?: boolean }) {
  const id = useId()
  return <div className={`grid min-w-0 gap-0.5 ${className}`}><Label className="truncate text-[9px]/none" htmlFor={id}>{label}</Label><Input className={`h-4 min-w-0 px-1 text-[9px] ${numeric ? "text-right tabular-nums" : ""}`} id={id} readOnly value={numeric && typeof value === "number" ? money.format(value) : display(value)} /></div>
}

function Check({ label, checked }: { label: string; checked: boolean }) {
  const id = useId()
  return <label className="flex h-5 items-center gap-1 whitespace-nowrap text-[9px]" htmlFor={id}><Checkbox checked={checked} disabled id={id} />{label}</label>
}

export function BankAccountDetails({ account }: { account: BankAccount }) {
  return <div className="grid min-w-0 gap-2 [font-family:Tahoma,'Segoe_UI',sans-serif] xl:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.8fr)]">
    <div className="grid min-w-0 gap-2">
      <Card size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Datos de la cuenta</CardTitle></CardHeader><CardContent className="grid grid-cols-12 gap-1 py-1">
        <Field className="col-span-3" label="Código" value={account.code} /><Field className="col-span-3" label="Familia" value={account.family} /><Field className="col-span-4" label="Número" value={account.accountNumber} /><Field className="col-span-2" label="Sucursal" value={account.branch} />
        <Field className="col-span-8" label="Nombre" value={account.name} />
        <div className="col-span-4 grid grid-cols-2 gap-x-2"><Check checked={account.nature === "debtor"} label="Deudora" /><Check checked={account.nature === "creditor"} label="Acreedora" /><Check checked={account.systemType === "bank"} label="Banco" /><Check checked={account.systemType === "expense"} label="Gasto" /><Check checked={account.systemType === "other"} label="Otro" /></div>
      </CardContent></Card>
      <Card size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Control</CardTitle></CardHeader><CardContent className="grid grid-cols-12 gap-1 py-1">
        <Field className="col-span-4" label="Gerente" value={account.control.manager} /><Field className="col-span-4" label="Teléfono" value={account.control.phone} /><Field className="col-span-2" label="# Cliente" value={account.control.customerNumber} /><Check checked={account.control.controlEnabled} label="Control" />
        <Field className="col-span-2" label="Nº Cheque" value={account.control.nextCheckNumber} /><Field className="col-span-2" label="Nº Depósito" value={account.control.nextDepositNumber} /><Field className="col-span-2" label="Nº Transf." value={account.control.nextTransferNumber} /><Field className="col-span-2" label="Moneda" value={account.currency.id} /><Field className="col-span-2" label="Formato" value={account.control.format} /><Check checked={account.control.subAccounts} label="Sub ctas" /><Check checked={account.control.movements} label="Movs" />
        <Field className="col-span-2" label="Cia" value={account.control.company} /><Field className="col-span-2" label="Multicia Cia" value={account.control.multiCompany} /><Check checked={account.control.deposits} label="Depósitos" /><Check checked={account.control.payments} label="Pagos" /><Check checked={account.control.budgetable} label="Presupuestable" /><Check checked={account.control.preventJournalEntries} label="No poder utilizar en pólizas" />
        <Field className="col-span-2" label="% Vta." value={account.prorationPercentages.sales} /><Field className="col-span-2" label="% Inv." value={account.prorationPercentages.inventory} /><Field className="col-span-2" label="% Dist." value={account.prorationPercentages.distribution} /><Field className="col-span-2" label="% Anti." value={account.prorationPercentages.advance} /><span className="col-span-2 self-end pb-1 text-[9px]">=100%</span>
      </CardContent></Card>
      <Card size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Información para reportes Fiscales:</CardTitle></CardHeader><CardContent className="flex flex-wrap items-center gap-x-3 py-1"><span>Ajuste anual por inflación</span><Check checked={account.fiscalReports.annualInflationAdjustment === 0} label="No" /><Check checked={account.fiscalReports.annualInflationAdjustment === 1} label="Créditos" /><Check checked={account.fiscalReports.annualInflationAdjustment === 2} label="Débitos" /><Check checked={account.fiscalReports.deductibleIetu} label="Deducible IETU" /><Check checked={account.fiscalReports.nonDeductibleVat} label="No Deducible IVA" /></CardContent></Card>
    </div>
    <div className="grid content-start gap-2">
      <Card size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Saldos</CardTitle></CardHeader><CardContent className="grid gap-1 py-1"><Field label="Saldo actual" numeric value={account.balances.current} /><Field label="Saldo banco" numeric value={account.balances.bank} /><Field label="Saldo anterior" numeric value={account.balances.previous} /><Field label="Saldo tránsito" numeric value={account.balances.inTransit} /></CardContent></Card>
      <Card size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Moneda {account.currency.name}</CardTitle></CardHeader><CardContent className="grid gap-1 py-1"><Field label="Saldo actual" numeric value={account.currencyBalances.current} /><Field label="Saldo Mes 12" numeric value={account.currencyBalances.month12} /><Field label="Saldo anterior" numeric value={account.currencyBalances.previous} /><Field label="Alta" value={account.createdAt} /></CardContent></Card>
    </div>
  </div>
}
